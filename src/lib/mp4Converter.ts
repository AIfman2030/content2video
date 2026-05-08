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

  // H.264 video + AAC audio → universally compatible MP4
  // (pix_fmt yuv420p required for iOS; faststart puts moov at front for streaming)
  await ff.exec([
    '-i', 'input.webm',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',             // encode audio as AAC if present, skip if none
    '-movflags', '+faststart',
    'output.mp4',
  ]);

  const data = await ff.readFile('output.mp4');
  await ff.deleteFile('input.webm');
  await ff.deleteFile('output.mp4');

  return new Blob([data], { type: 'video/mp4' });
}
