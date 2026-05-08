import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<void> | null = null;

const CDN = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) {
    await loadPromise;
    return ffmpegInstance!;
  }

  const ff = new FFmpeg();
  loadPromise = ff.load({
    coreURL: await toBlobURL(`${CDN}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${CDN}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  await loadPromise;
  ffmpegInstance = ff;
  return ff;
}

function resetInstance() {
  ffmpegInstance = null;
  loadPromise = null;
}

export async function webmToMp4(
  webmBlob: Blob,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  const ff = await loadFFmpeg();

  ff.on('progress', ({ progress }) => {
    onProgress?.(Math.min(progress, 1));
  });

  const inputData = await fetchFile(webmBlob);
  await ff.writeFile('input.webm', inputData);

  // Try H.264 + AAC (handles both video-only and video+audio WebM)
  let exitCode = await ff.exec([
    '-i', 'input.webm',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',    // required for iOS / most platforms
    '-c:a', 'aac',            // encode audio as AAC if audio stream present
    '-movflags', '+faststart', // moov atom at front → streaming compatible
    'output.mp4',
  ]);

  // If audio encoding failed, retry without audio track
  if (exitCode !== 0) {
    try { await ff.deleteFile('output.mp4'); } catch { /* may not exist */ }
    exitCode = await ff.exec([
      '-i', 'input.webm',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-an',
      '-movflags', '+faststart',
      'output.mp4',
    ]);
  }

  if (exitCode !== 0) {
    try { await ff.deleteFile('input.webm'); } catch { /* ignore */ }
    try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }
    resetInstance(); // reset so next call gets a fresh FFmpeg instance
    throw new Error(`FFmpeg conversion failed (exit code ${exitCode})`);
  }

  const data = await ff.readFile('output.mp4');
  try { await ff.deleteFile('input.webm'); } catch { /* ignore */ }
  try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }

  return new Blob([data], { type: 'video/mp4' });
}
