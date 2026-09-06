import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import type { AnimEngine } from './canvasEngine';

type VideoEncoderLike = {
  encodeQueueSize: number;
  configure: (config: Record<string, unknown>) => void;
  encode: (frame: unknown, options?: { keyFrame?: boolean }) => void;
  flush: () => Promise<void>;
  close: () => void;
};

type VideoEncoderConstructor = {
  new (init: {
    output: (chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata) => void;
    error: (error: DOMException) => void;
  }): VideoEncoderLike;
  isConfigSupported: (config: Record<string, unknown>) => Promise<{ supported?: boolean; config?: Record<string, unknown> }>;
};

type VideoFrameConstructor = new (
  source: HTMLCanvasElement,
  init: { timestamp: number; duration: number },
) => { close: () => void };

function webCodecs() {
  const scope = globalThis as typeof globalThis & {
    VideoEncoder?: VideoEncoderConstructor;
    VideoFrame?: VideoFrameConstructor;
  };
  return { VideoEncoder: scope.VideoEncoder, VideoFrame: scope.VideoFrame };
}

export function canEncodeMp4Directly(): boolean {
  const { VideoEncoder, VideoFrame } = webCodecs();
  return !!VideoEncoder && !!VideoFrame;
}

async function supportedConfig(width: number, height: number, frameRate: number) {
  const { VideoEncoder } = webCodecs();
  if (!VideoEncoder) return null;

  const base = {
    width,
    height,
    bitrate: Math.max(3_000_000, Math.round(width * height * 2.5)),
    framerate: frameRate,
    hardwareAcceleration: 'prefer-hardware',
    latencyMode: 'quality',
    avc: { format: 'avc' },
  };

  for (const codec of ['avc1.42E028', 'avc1.4D4028', 'avc1.640028']) {
    const result = await VideoEncoder.isConfigSupported({ ...base, codec });
    if (result.supported) return result.config ?? { ...base, codec };
  }
  return null;
}

export async function encodeCanvasToMp4(
  canvas: HTMLCanvasElement,
  engine: AnimEngine,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  const { VideoEncoder, VideoFrame } = webCodecs();
  if (!VideoEncoder || !VideoFrame) throw new Error('WebCodecs unavailable');

  const frameRate = 30;
  const width = canvas.width - (canvas.width % 2);
  const height = canvas.height - (canvas.height % 2);
  const config = await supportedConfig(width, height, frameRate);
  if (!config) throw new Error('H.264 encoder unavailable');

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width, height, frameRate },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  let encoderError: DOMException | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, metadata) => muxer.addVideoChunk(chunk, metadata),
    error: error => { encoderError = error; },
  });
  encoder.configure(config);

  const totalMs = engine.getTotalMs();
  const frameDurationUs = Math.round(1_000_000 / frameRate);
  const frameCount = Math.max(1, Math.ceil(totalMs / 1000 * frameRate));

  engine.stop();
  try {
    for (let index = 0; index <= frameCount; index++) {
      const elapsedMs = Math.min(totalMs, index * 1000 / frameRate);
      engine.seekTo(elapsedMs);
      const frame = new VideoFrame(canvas, {
        timestamp: index * frameDurationUs,
        duration: frameDurationUs,
      });
      encoder.encode(frame, { keyFrame: index % (frameRate * 2) === 0 });
      frame.close();

      if (encoder.encodeQueueSize > 8) await encoder.flush();
      if (index % 5 === 0) {
        onProgress?.(index / frameCount);
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      }
      if (encoderError) throw encoderError;
    }

    await encoder.flush();
    if (encoderError) throw encoderError;
    muxer.finalize();
    onProgress?.(1);
    return new Blob([target.buffer], { type: 'video/mp4' });
  } finally {
    encoder.close();
    engine.seekTo(totalMs);
  }
}

export async function assertMp4(blob: Blob): Promise<void> {
  const header = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
  const marker = String.fromCharCode(...header.slice(4, 8));
  if (marker !== 'ftyp') throw new Error('生成文件不是有效的 MP4');
}
