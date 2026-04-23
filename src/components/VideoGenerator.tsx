import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Video, Download, RotateCcw, Loader2 } from 'lucide-react';
import type { GeneratedContent, StyleType, ChineseOptions } from '../types/video';
import { createAnimEngine, CW, CH } from '../lib/canvasEngine';

interface Props {
  content: GeneratedContent;
  style: StyleType;
  coverIndex: number;
  chineseOptions?: ChineseOptions;
  onClose: () => void;
}

// Preview scale: 340 wide × 604 tall
const PREVIEW_W = 340;
const PREVIEW_H = 604;
const SCALE = PREVIEW_W / CW;

type RecordState = 'idle' | 'recording' | 'done';

export default function VideoGenerator({
  content, style, coverIndex, chineseOptions, onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [initError, setInitError] = useState('');

  const engineRef = useRef<Awaited<ReturnType<typeof createAnimEngine>> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Init engine
  useEffect(() => {
    if (!canvasRef.current) return;
    setEngineReady(false);
    setInitError('');

    createAnimEngine(
      canvasRef.current,
      content,
      style,
      coverIndex,
      chineseOptions,
    ).then(engine => {
      engineRef.current = engine;
      setEngineReady(true);
      // Auto-start preview
      engine.start();
      setIsPlaying(true);
    }).catch(err => {
      setInitError(String(err));
    });

    return () => {
      engineRef.current?.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreview = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.stop();
    engine.start();
    setIsPlaying(true);
    setRecordState('idle');
    setProgress(0);
  }, []);

  const handleRecord = useCallback(async () => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    setRecordState('recording');
    setProgress(0);
    chunksRef.current = [];

    // Stop any ongoing animation
    engine.stop();

    // Setup MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setRecordState('done');
      setProgress(100);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };

    recorder.start(100); // collect every 100ms

    // Progress tracking
    const total = engine.getTotalMs();
    const startTime = performance.now();
    progressTimerRef.current = setInterval(() => {
      const elapsed = performance.now() - startTime;
      setProgress(Math.min(99, (elapsed / total) * 100));
    }, 100);

    // Re-start animation
    createAnimEngine(
      canvas,
      content,
      style,
      coverIndex,
      chineseOptions,
      () => {
        // Animation complete → stop recording
        setTimeout(() => {
          recorder.stop();
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        }, 500);
      },
    ).then(newEngine => {
      engineRef.current = newEngine;
      newEngine.start();
    });
  }, [content, style, coverIndex, chineseOptions]);

  const handleDownload = useCallback(() => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${content.title.slice(0, 10)}.webm`;
    a.click();
  }, [downloadUrl, content.title]);

  const accent = style === 'chinese' ? '#e74c3c'
    : style === 'city' ? '#f5d87a' : '#a855f7';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="relative flex flex-col lg:flex-row items-center gap-8 w-full max-w-4xl px-6">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-6 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Canvas preview */}
        <div
          className="flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{ width: PREVIEW_W, height: PREVIEW_H, position: 'relative' }}
        >
          {!engineReady && !initError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
              <Loader2 size={32} className="animate-spin text-white/50 mb-2" />
              <span className="text-sm text-white/40">加载中…</span>
            </div>
          )}
          {initError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-4">
              <span className="text-sm text-red-400 text-center">{initError}</span>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            style={{
              width: PREVIEW_W,
              height: PREVIEW_H,
              display: 'block',
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {/* Content info */}
          <div
            className="rounded-xl p-4 border border-white/10"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <div className="text-base font-bold text-white mb-2">{content.title}</div>
            <div className="space-y-1">
              {content.points.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/50">
                  <span
                    className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                    style={{ background: `${accent}30`, color: accent }}
                  >
                    {i + 1}
                  </span>
                  <span>{p.label}</span>
                  <span className="text-white/30 text-xs truncate">{p.short}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar (recording) */}
          {recordState === 'recording' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>录制中…</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: accent }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handlePreview}
              disabled={!engineReady || recordState === 'recording'}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all disabled:opacity-40"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              <Play size={16} />
              预览动画
            </button>

            {recordState !== 'done' ? (
              <button
                onClick={handleRecord}
                disabled={!engineReady || recordState === 'recording'}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: recordState === 'recording'
                    ? 'rgba(255,255,255,0.1)'
                    : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  color: '#fff',
                  boxShadow: recordState !== 'recording' ? `0 4px 20px ${accent}50` : 'none',
                }}
              >
                {recordState === 'recording' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    录制中…
                  </>
                ) : (
                  <>
                    <Video size={16} />
                    录制视频
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all"
                style={{
                  background: `linear-gradient(135deg, #22c55e, #16a34a)`,
                  color: '#fff',
                  boxShadow: '0 4px 20px #22c55e50',
                }}
              >
                <Download size={16} />
                下载视频
              </button>
            )}

            {recordState === 'done' && (
              <button
                onClick={handlePreview}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-white/50 hover:text-white/70 transition-colors border border-white/10"
              >
                <RotateCcw size={14} />
                重新录制
              </button>
            )}
          </div>

          <p className="text-xs text-white/25 text-center">
            录制完成后自动下载 .webm 格式视频
          </p>
        </div>
      </div>
    </div>
  );
}
