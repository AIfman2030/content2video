import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Video, Download, RotateCcw, Loader2, Mic } from 'lucide-react';
import type { GeneratedContent, StyleType, ChineseOptions, AIOptions, NatureContent, SubtitleOptions, CityOptions, MangaContent, MangaOptions, AItechOptions } from '../types/video';
import { createAnimEngine, CW, CH } from '../lib/canvasEngine';
import { webmToMp4 } from '../lib/mp4Converter';
import { CoverPreview } from './CoverPreview';
import { synthesize } from '../services/tts';

interface Props {
  content: GeneratedContent;
  style: StyleType;
  coverIndex: number;
  chineseOptions?: ChineseOptions;
  aiOptions?: AIOptions;
  natureContent?: NatureContent;
  onClose: () => void;
  subtitleOptions?: SubtitleOptions;
  accentOverride?: string;
  cityOptions?: CityOptions;
  mangaContent?: MangaContent;
  mangaOptions?: MangaOptions;
  aitechOptions?: AItechOptions;
}

const PREVIEW_W = 512;
const PREVIEW_H = Math.round(512 * CH / CW);
type RecordState = 'idle' | 'generating_audio' | 'recording' | 'converting' | 'done';

export default function VideoGenerator({
  content, style, coverIndex, chineseOptions, aiOptions, natureContent, onClose,
  subtitleOptions, accentOverride, cityOptions, mangaContent, mangaOptions, aitechOptions,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'cover' | 'video'>('cover');
  const [engineReady, setEngineReady] = useState(false);
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [progress, setProgress] = useState(0);
  const [ttsStep, setTtsStep] = useState({ done: 0, total: 0 });
  const [downloadUrl, setDownloadUrl] = useState('');
  const [initError, setInitError] = useState('');
  const engineRef = useRef<Awaited<ReturnType<typeof createAnimEngine>> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Keep latest mangaOptions/mangaContent accessible in callbacks without re-creating them
  const mangaOptionsRef = useRef(mangaOptions);
  mangaOptionsRef.current = mangaOptions;
  const mangaContentRef = useRef(mangaContent);
  mangaContentRef.current = mangaContent;

  const isGeneratingAudio = recordState === 'generating_audio';
  const isRecording = recordState === 'recording';
  const isConverting = recordState === 'converting';
  const isDone = recordState === 'done';
  const isBusy = isGeneratingAudio || isRecording || isConverting;
  const aspect = CW / CH;

  const accent = style === 'chinese' ? '#e74c3c'
    : style === 'city' ? '#f5d87a'
    : style === 'nature' ? '#4ade80' : '#a855f7';

  // Init engine once
  useEffect(() => {
    if (!canvasRef.current) return;
    setEngineReady(false); setInitError('');
    createAnimEngine(canvasRef.current, content, style, coverIndex, chineseOptions, aiOptions, natureContent, undefined, subtitleOptions, accentOverride, cityOptions, mangaContent, mangaOptions, aitechOptions)
      .then(engine => { engineRef.current = engine; setEngineReady(true); engine.start(); })
      .catch(err => setInitError(String(err)));
    return () => { engineRef.current?.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = useCallback(() => {
    setPhase('video');
    engineRef.current?.restart();
  }, []);

  const handlePreview = useCallback(() => {
    engineRef.current?.stop(); engineRef.current?.start();
    setRecordState('idle'); setProgress(0);
  }, []);

  const handleRecord = useCallback(async () => {
    const canvas = canvasRef.current, engine = engineRef.current;
    if (!canvas || !engine) return;

    const opts = mangaOptionsRef.current;
    const mc = mangaContentRef.current;
    const isMangaTts = style === 'manga' && opts?.ttsEnabled && mc?.segments?.length;

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';

    // ── Phase A: Pre-generate TTS audio (parallel) ─────────────────────────
    let audioCtx: AudioContext | null = null;
    let audioDest: MediaStreamAudioDestinationNode | null = null;
    const audioBuffers: (AudioBuffer | null)[] = [];

    if (isMangaTts) {
      const segments = mc!.segments;
      const voice = opts!.ttsVoice ?? 'zh-CN-XiaoxiaoNeural';

      setRecordState('generating_audio');
      setTtsStep({ done: 0, total: segments.length });
      setProgress(0);

      audioCtx = new AudioContext();
      audioDest = audioCtx.createMediaStreamDestination();
      audioCtxRef.current = audioCtx;

      // Generate all segments in parallel — much faster than sequential
      let doneCount = 0;
      const results = await Promise.all(
        segments.map(async (seg, i) => {
          try {
            const ab = await synthesize(seg.text, voice);
            const decoded = await audioCtx!.decodeAudioData(ab.slice(0));
            doneCount++;
            setTtsStep({ done: doneCount, total: segments.length });
            setProgress(Math.round((doneCount / segments.length) * 100));
            return decoded;
          } catch (e) {
            console.warn(`TTS segment ${i} failed:`, e);
            doneCount++;
            setTtsStep({ done: doneCount, total: segments.length });
            return null;
          }
        })
      );
      audioBuffers.push(...results);

      // If ALL segments failed, skip audio entirely to avoid silent-track confusion
      const hasAny = audioBuffers.some(b => b !== null);
      if (!hasAny) {
        audioCtx.close();
        audioCtx = null;
        audioDest = null;
        audioCtxRef.current = null;
      }
    }

    // ── Phase B: Set up MediaRecorder stream ───────────────────────────────
    setRecordState('recording');
    setProgress(0);

    const videoStream = canvas.captureStream(30);
    const recordStream = (audioCtx && audioDest)
      ? new MediaStream([...videoStream.getTracks(), ...audioDest.stream.getTracks()])
      : videoStream;

    const recorder = new MediaRecorder(recordStream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      setRecordState('converting');
      setProgress(0);
      try {
        const mp4 = await webmToMp4(
          new Blob(chunksRef.current, { type: mimeType }),
          r => setProgress(Math.round(r * 100)),
        );
        setDownloadUrl(URL.createObjectURL(mp4));
        setProgress(100);
        setRecordState('done');
      } catch (err) {
        console.error('MP4 conversion failed:', err);
        setInitError(`视频转换失败: ${err instanceof Error ? err.message : String(err)}`);
        setRecordState('idle');
        setProgress(0);
      }
    };

    const total = engine.getTotalMs();

    const startRecording = () => {
      const t0 = performance.now();
      progressTimerRef.current = setInterval(
        () => setProgress(Math.min(99, ((performance.now() - t0) / total) * 100)), 100,
      );
      // Start recorder and engine simultaneously
      recorder.start(100);
      engine.restart(() => {
        setTimeout(() => {
          recorder.stop();
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        }, 500);
      });
    };

    // ── Phase C: Schedule audio then start recorder + engine together ──────
    if (audioCtx && audioDest && audioBuffers.some(b => b !== null)) {
      const slideSec = (opts!.slideDurationMs ?? 4000) / 1000;
      // Give a tiny gap so scheduling happens before playback starts
      const SYNC_DELAY_MS = 100;
      const startAt = audioCtx.currentTime + SYNC_DELAY_MS / 1000;

      audioBuffers.forEach((buf, i) => {
        if (!buf || !audioDest) return;
        const src = audioCtx!.createBufferSource();
        src.buffer = buf;
        src.connect(audioDest);
        src.start(startAt + i * slideSec);
      });

      // Start recorder + engine after the same delay so audio & video are locked together
      setTimeout(startRecording, SYNC_DELAY_MS);
    } else {
      // No TTS — start immediately
      startRecording();
    }
  }, [style]);

  const handleDownload = useCallback(() => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${content.title.slice(0, 12)}.mp4`;
    a.click();
  }, [downloadUrl, content.title]);

  const showControls = !isBusy;

  return (
    <div className="fixed inset-0" style={{ zIndex: isBusy ? 100 : 50 }}>
      {/* Overlay background */}
      <div className="absolute inset-0 transition-all duration-500"
        style={{ background: isRecording ? '#000' : 'rgba(0,0,0,0.88)', backdropFilter: isRecording ? 'none' : 'blur(6px)' }} />

      {/* Cover phase */}
      {phase === 'cover' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto py-8" style={{ zIndex: 10 }}>
          <div className="w-full max-w-sm px-4">
            <CoverPreview
              content={content}
              natureContent={natureContent ?? null}
              style={style}
              coverIndex={coverIndex}
              chineseOptions={chineseOptions}
              onContinue={handleContinue}
              onBack={onClose}
            />
          </div>
          <button onClick={onClose}
            className="absolute top-5 right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Animation canvas */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{ zIndex: 1, visibility: phase === 'video' ? 'visible' : 'hidden' }}>
        <div style={isRecording ? {
          position: 'relative', overflow: 'hidden',
          width: `max(100vw, calc(100vh * ${aspect}))`, height: `max(100vh, calc(100vw / ${aspect}))`,
        } : {
          position: 'relative', width: PREVIEW_W, height: PREVIEW_H,
          borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
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
          <canvas ref={canvasRef} width={CW} height={CH} style={{
            display: 'block',
            width: isRecording ? `max(100vw, calc(100vh * ${aspect}))` : PREVIEW_W,
            height: isRecording ? `max(100vh, calc(100vw / ${aspect}))` : PREVIEW_H,
          }} />
          {/* REC indicator (only during actual recording) */}
          <div style={{ display: isRecording ? 'block' : 'none' }}>
            <div className="absolute top-5 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/80 text-sm font-medium tabular-nums">REC {Math.round(progress)}%</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: accent }} />
            </div>
          </div>
        </div>
      </div>

      {/* Generating audio overlay */}
      {isGeneratingAudio && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ zIndex: 2 }}>
          <div className="flex items-center justify-center w-14 h-14 rounded-full"
            style={{ background: `${accent}22`, border: `1.5px solid ${accent}55` }}>
            <Mic size={24} style={{ color: accent }} className="animate-pulse" />
          </div>
          <p className="text-white/90 text-base font-medium">正在生成语音…</p>
          <p className="text-white/40 text-sm tabular-nums">
            {ttsStep.done} / {ttsStep.total} 段
          </p>
          <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: accent }} />
          </div>
          <p className="text-xs text-white/25">语音生成完成后自动开始录制</p>
        </div>
      )}

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

      {/* Controls (video phase, hidden while busy) */}
      {phase === 'video' && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 pointer-events-none"
          style={{ zIndex: 2, display: showControls ? 'flex' : 'none' }}>
          <button onClick={onClose}
            className="absolute top-5 right-6 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors pointer-events-auto">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3 pointer-events-auto">
            <button onClick={handlePreview} disabled={!engineReady}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }}>
              <Play size={15} />预览
            </button>
            {!isDone ? (
              <button onClick={handleRecord} disabled={!engineReady}
                className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)`, color: '#fff', boxShadow: `0 4px 24px ${accent}55` }}>
                {style === 'manga' && mangaOptions?.ttsEnabled ? <Mic size={15} /> : <Video size={15} />}
                {style === 'manga' && mangaOptions?.ttsEnabled ? '配音录制视频' : '全屏录制视频'}
              </button>
            ) : (
              <>
                <button onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 4px 20px #22c55e50' }}>
                  <Download size={15} />下载 MP4
                </button>
                <button onClick={handleRecord} disabled={!engineReady}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white/70 transition-colors border border-white/10 disabled:opacity-40">
                  <RotateCcw size={14} />重录
                </button>
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-white/25 pointer-events-none">
            {style === 'manga' && mangaOptions?.ttsEnabled
              ? '录制前自动生成语音 · 完成后合并为带音频的 MP4'
              : '点击「全屏录制」画面自动全屏并开始录制 · 完成后自动转换为 MP4'}
          </p>
        </div>
      )}
    </div>
  );
}
