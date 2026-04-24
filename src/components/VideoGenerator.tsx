import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Video, Download, RotateCcw, Loader2 } from 'lucide-react';
import type { GeneratedContent, StyleType, ChineseOptions, AIOptions, NatureContent } from '../types/video';
import { createAnimEngine, CW, CH } from '../lib/canvasEngine';
import { webmToMp4 } from '../lib/mp4Converter';

interface Props {
  content: GeneratedContent;
  style: StyleType;
  coverIndex: number;
  chineseOptions?: ChineseOptions;
  aiOptions?: AIOptions;
  natureContent?: NatureContent;
  onClose: () => void;
}

// Landscape 16:9 preview
const PREVIEW_W = 512;
const PREVIEW_H = Math.round(512 * CH / CW);

type RecordState = 'idle' | 'recording' | 'converting' | 'done';

export default function VideoGenerator({
  content, style, coverIndex, chineseOptions, aiOptions, natureContent, onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [initError, setInitError] = useState('');

  const engineRef = useRef<Awaited<ReturnType<typeof createAnimEngine>> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRecording = recordState === 'recording';
  const isConverting = recordState === 'converting';
  const isDone = recordState === 'done';
  const aspect = CW / CH; // 16/9

  // Init engine & auto-start preview
  useEffect(() => {
    if (!canvasRef.current) return;
    setEngineReady(false);
    setInitError('');
    createAnimEngine(canvasRef.current, content, style, coverIndex, chineseOptions, aiOptions, natureContent)
      .then(engine => {
        engineRef.current = engine;
        setEngineReady(true);
        engine.start();
      })
      .catch(err => setInitError(String(err)));
    return () => { engineRef.current?.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreview = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.stop();
    engine.start();
    setRecordState('idle');
    setProgress(0);
  }, []);

  // Click "录制视频" → canvas IMMEDIATELY fills screen + recording starts
  // Uses engine.restart() to avoid re-creating the engine (fixes city bug)
  const handleRecord = useCallback(async () => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    setRecordState('recording');
    setProgress(0);
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9' : 'video/webm';

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setRecordState('converting');
      setProgress(0);
      try {
        const webmBlob = new Blob(chunksRef.current, { type: mimeType });
        const mp4Blob = await webmToMp4(webmBlob, (r) => setProgress(Math.round(r * 100)));
        setDownloadUrl(URL.createObjectURL(mp4Blob));
        setProgress(100);
        setRecordState('done');
      } catch {
        // Fallback: provide WebM if conversion fails
        const webmBlob = new Blob(chunksRef.current, { type: mimeType });
        setDownloadUrl(URL.createObjectURL(webmBlob));
        setProgress(100);
        setRecordState('done');
      }
    };

    recorder.start(100);

    const total = engine.getTotalMs();
    const t0 = performance.now();
    progressTimerRef.current = setInterval(() => {
      setProgress(Math.min(99, ((performance.now() - t0) / total) * 100));
    }, 100);

    // Restart existing engine from t=0 (no re-loading shape images → fixes city bug)
    engine.restart(() => {
      setTimeout(() => {
        recorder.stop();
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      }, 500);
    });
  }, []);

  const handleDownload = useCallback(() => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${content.title.slice(0, 12)}.mp4`;
    a.click();
  }, [downloadUrl, content.title]);

  const accent = style === 'chinese' ? '#e74c3c'
    : style === 'city' ? '#f5d87a'
    : style === 'nature' ? '#4ade80'
    : '#a855f7';

  const showControls = !isRecording && !isConverting;

  return (
    <div className="fixed inset-0" style={{ zIndex: isRecording || isConverting ? 100 : 50 }}>
      {/* Background */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: isRecording ? '#000' : 'rgba(0,0,0,0.88)',
          backdropFilter: isRecording ? 'none' : 'blur(6px)',
        }}
      />

      {/* Canvas container — STABLE position in tree */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ zIndex: 1 }}>
        <div
          style={isRecording ? {
            position: 'relative',
            overflow: 'hidden',
            width: `max(100vw, calc(100vh * ${aspect}))`,
            height: `max(100vh, calc(100vw / ${aspect}))`,
          } : {
            position: 'relative',
            width: PREVIEW_W,
            height: PREVIEW_H,
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {!engineReady && !initError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
              <Loader2 size={28} className="animate-spin text-white/50 mb-2" />
              <span className="text-sm text-white/40">加载中…</span>
            </div>
          )}
          {initError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-4">
              <span className="text-sm text-red-400 text-center">{initError}</span>
            </div>
          )}

          {/* THE CANVAS */}
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            style={{
              display: 'block',
              width: isRecording ? `max(100vw, calc(100vh * ${aspect}))` : PREVIEW_W,
              height: isRecording ? `max(100vh, calc(100vw / ${aspect}))` : PREVIEW_H,
            }}
          />

          {/* REC badge + progress */}
          <div style={{ display: isRecording ? 'block' : 'none' }}>
            <div className="absolute top-5 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/80 text-sm font-medium tabular-nums">
                REC {Math.round(progress)}%
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: accent }} />
            </div>
          </div>
        </div>
      </div>

      {/* Converting overlay */}
      {isConverting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ zIndex: 2 }}>
          <Loader2 size={36} className="animate-spin" style={{ color: accent }} />
          <p className="text-white/80 text-base font-medium">正在转换为 MP4…</p>
          <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: accent }} />
          </div>
          <p className="text-xs text-white/30">首次转换需加载编码器，请稍候</p>
        </div>
      )}

      {/* Controls (hidden while recording/converting) */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-end pb-10 pointer-events-none"
        style={{ zIndex: 2, display: showControls ? 'flex' : 'none' }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-6 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors pointer-events-auto"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={handlePreview}
            disabled={!engineReady}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }}
          >
            <Play size={15} />
            预览
          </button>

          {!isDone ? (
            <button
              onClick={handleRecord}
              disabled={!engineReady}
              className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)`, color: '#fff', boxShadow: `0 4px 24px ${accent}55` }}
            >
              <Video size={15} />
              全屏录制视频
            </button>
          ) : (
            <>
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 4px 20px #22c55e50' }}
              >
                <Download size={15} />
                下载 MP4
              </button>
              <button
                onClick={handleRecord}
                disabled={!engineReady}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white/70 transition-colors border border-white/10 disabled:opacity-40"
              >
                <RotateCcw size={14} />
                重录
              </button>
            </>
          )}
        </div>

        <p className="mt-3 text-xs text-white/25 pointer-events-none">
          点击「全屏录制」画面自动全屏并开始录制 · 完成后自动转换为 MP4
        </p>
      </div>
    </div>
  );
}
