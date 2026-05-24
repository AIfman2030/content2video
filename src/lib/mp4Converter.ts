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

// ── Shared FFmpeg args for H.264 output ──────────────────────────────────────
// -fflags +genpts: regenerate presentation timestamps — fixes MediaRecorder WebM
//   files that have missing/invalid timestamps (very common in Chrome/Edge).
// -vsync vfr: keep variable frame rate from source without forcing CFR padding.
const H264_ARGS = [
  '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
];

// ── Clean up any stale temp files left by a previous failed run ───────────────
async function cleanupStaleFiles(ff: FFmpeg, names: string[]) {
  for (const n of names) {
    try { await ff.deleteFile(n); } catch { /* not present — OK */ }
  }
}

// ── Base WebM→MP4 (video-only fallback) ───────────────────────────────────────
export async function webmToMp4(
  webmBlob: Blob,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  const ff = await loadFFmpeg();
  await cleanupStaleFiles(ff, ['input.webm', 'output.mp4']);

  ff.on('progress', ({ progress }) => {
    onProgress?.(Math.min(progress, 1));
  });

  const inputData = await fetchFile(webmBlob);
  await ff.writeFile('input.webm', inputData);

  // First attempt: H.264 + optional AAC.
  // -fflags +genpts fixes MediaRecorder WebM timestamp issues.
  let exitCode = await ff.exec([
    '-fflags', '+genpts',
    '-i', 'input.webm',
    '-map', '0:v:0',
    '-map', '0:a:0?',
    ...H264_ARGS,
    '-c:a', 'aac',
    'output.mp4',
  ]);

  // Second attempt: video-only (no audio)
  if (exitCode !== 0) {
    try { await ff.deleteFile('output.mp4'); } catch { /* may not exist */ }
    exitCode = await ff.exec([
      '-fflags', '+genpts',
      '-i', 'input.webm',
      '-map', '0:v:0',
      ...H264_ARGS,
      '-an',
      'output.mp4',
    ]);
  }

  if (exitCode !== 0) {
    try { await ff.deleteFile('input.webm'); } catch { /* ignore */ }
    try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }
    resetInstance();
    throw new Error(`FFmpeg conversion failed (exit code ${exitCode})`);
  }

  const data = await ff.readFile('output.mp4');
  try { await ff.deleteFile('input.webm'); } catch { /* ignore */ }
  try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }

  return new Blob([data], { type: 'video/mp4' });
}

// ── WebM + MP3 segments → MP4 with merged audio track ─────────────────────────
// Each audioSegments entry is { mp3: ArrayBuffer, startMs: number } or null (skipped).
// Audio is time-shifted by startMs and mixed into a single AAC track using FFmpeg.
// volume: 0-100 (default 80). Applied as a FFmpeg volume filter.
export async function webmToMp4WithAudio(
  videoBlob: Blob,
  audioSegments: Array<{ mp3: ArrayBuffer; startMs: number } | null>,
  onProgress?: (ratio: number) => void,
  volume = 80,
): Promise<Blob> {
  const ff = await loadFFmpeg();
  ff.on('progress', ({ progress }) => onProgress?.(Math.min(progress, 1)));

  // Clean up any leftover temp files from a previous failed run
  const audioNames = audioSegments.map((_, i) => `aud${i}.mp3`);
  await cleanupStaleFiles(ff, ['video.webm', 'output.mp4', ...audioNames]);

  await ff.writeFile('video.webm', await fetchFile(videoBlob));

  // Write only the non-null segments
  const valids: Array<{ name: string; startMs: number }> = [];
  for (let i = 0; i < audioSegments.length; i++) {
    const seg = audioSegments[i];
    if (!seg) continue;
    const name = `aud${i}.mp3`;
    await ff.writeFile(name, new Uint8Array(seg.mp3));
    valids.push({ name, startMs: seg.startMs });
  }

  // Volume factor (0-100 → 0.0-1.0, clamped)
  const volFactor = (Math.max(0, Math.min(100, volume)) / 100).toFixed(2);

  let exitCode: number;

  if (valids.length === 0) {
    // No valid audio → video-only
    exitCode = await ff.exec([
      '-fflags', '+genpts', '-i', 'video.webm',
      '-map', '0:v:0', ...H264_ARGS, '-an', 'output.mp4',
    ]);
  } else if (valids.length === 1 && valids[0].startMs === 0) {
    // Single segment, no delay — apply volume filter
    exitCode = await ff.exec([
      '-fflags', '+genpts', '-i', 'video.webm', '-i', valids[0].name,
      '-filter_complex', `[1:a]volume=${volFactor}[aout]`,
      '-map', '0:v:0', '-map', '[aout]',
      ...H264_ARGS, '-c:a', 'aac', '-b:a', '128k', 'output.mp4',
    ]);
  } else {
    // Multiple segments (or single with delay) — adelay + amix + volume
    const inputArgs: string[] = ['-fflags', '+genpts', '-i', 'video.webm'];
    for (const v of valids) inputArgs.push('-i', v.name);

    const filterParts: string[] = [];
    const labels: string[] = [];
    for (let i = 0; i < valids.length; i++) {
      const inIdx = i + 1; // 0 = video
      const ms = valids[i].startMs;
      const label = `a${i}`;
      filterParts.push(`[${inIdx}:a]adelay=${ms}|${ms}[${label}]`);
      labels.push(`[${label}]`);
    }
    filterParts.push(
      `${labels.join('')}amix=inputs=${valids.length}:normalize=0:duration=longest[amixed]`,
    );
    filterParts.push(`[amixed]volume=${volFactor}[aout]`);

    exitCode = await ff.exec([
      ...inputArgs,
      '-filter_complex', filterParts.join(';'),
      '-map', '0:v:0', '-map', '[aout]',
      ...H264_ARGS, '-c:a', 'aac', '-b:a', '128k', 'output.mp4',
    ]);
  }

  // Cleanup audio temp files
  for (const v of valids) {
    try { await ff.deleteFile(v.name); } catch { /* ignore */ }
  }

  // Fallback: video-only if audio mixing failed
  if (exitCode !== 0) {
    console.warn('Audio merge failed, retrying video-only…');
    try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }
    exitCode = await ff.exec([
      '-fflags', '+genpts', '-i', 'video.webm',
      '-map', '0:v:0', ...H264_ARGS, '-an', 'output.mp4',
    ]);
    if (exitCode !== 0) {
      try { await ff.deleteFile('video.webm'); } catch { /* ignore */ }
      resetInstance();
      throw new Error(`FFmpeg conversion failed (exit code ${exitCode})`);
    }
  }

  const data = await ff.readFile('output.mp4');
  try { await ff.deleteFile('video.webm'); } catch { /* ignore */ }
  try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }

  return new Blob([data], { type: 'video/mp4' });
}

