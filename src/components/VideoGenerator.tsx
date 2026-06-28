import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Video, Download, RotateCcw, Loader2, Mic, Music, AlertCircle, FileVideo } from 'lucide-react';
import type {
  GeneratedContent, StyleType, ChineseOptions, AIOptions, NatureContent,
  SubtitleOptions, CityOptions, MangaContent, MangaOptions, AItechOptions,
  PetCoverConfig, NatureOptions, TitleOptions, KeywordOptions, AIGoblinOptions,
} from '../types/video';
import { createAnimEngine, CW, CH } from '../lib/canvasEngine';
import { webmToMp4, webmToMp4WithAudio } from '../lib/mp4Converter';
import { CoverPreview } from './CoverPreview';
import { synthesize } from '../services/tts';
import { fetchAudioAsBuffer } from '../services/sunoRap';

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
  petCoverConfig?: PetCoverConfig;
  natureOptions?: NatureOptions;
  titleOptions?: TitleOptions;
  keywordOptions?: KeywordOptions;
  aigoblinOptions?: AIGoblinOptions;
}

const PREVIEW_W_BASE = 512;
const calcPreviewH = (w: number, h: number) => Math.round(PREVIEW_W_BASE * h / w);

type RecordState = 'idle' | 'generating_audio' | 'recording' | 'converting' | 'done';

// ── Persist ALL critical state on window — survives Vite HMR module re-execution ─
// Module-level `const` is reset on every hot-update, but `window` is not.
// `phase` MUST be persisted — without it, HMR resets phase to 'cover' which
// looks like the overlay "automatically closes" during MP4 conversion.
interface WinStore {
  webmUrl: string;
  mp4Url: string;
  convError: string;
  phase: 'cover' | 'video';
}
const ws = (): WinStore => {
  const w = window as Record<string, unknown>;
  if (!w['__vrVidStore__'])
    w['__vrVidStore__'] = { webmUrl: '', mp4Url: '', convError: '', phase: 'cover' };
  return w['__vrVidStore__'] as WinStore;
};

// Custom events so a remounted VideoGenerator can receive results from an
// FFmpeg job that started in the previous (unmounted) component instance.
const EV_WEBM = 'vr:webmready';
const EV_MP4  = 'vr:mp4ready';
const EV_ERR  = 'vr:converror';

export default function VideoGenerator({
  content, style, coverIndex, chineseOptions, aiOptions, natureContent, onClose,
  subtitleOptions, accentOverride, cityOptions, mangaContent, mangaOptions,
  aitechOptions, petCoverConfig, natureOptions, titleOptions, keywordOptions,
  aigoblinOptions,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Awaited<ReturnType<typeof createAnimEngine>> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio preview cache
  const audioElRef    = useRef<HTMLAudioElement | null>(null);
  const rapBlobUrlRef = useRef<string | null>(null);
  const ttsRawMp3sRef = useRef<(ArrayBuffer | null)[] | null>(null);
  const ttsStopRef    = useRef<(() => void) | null>(null);

  // Latest opts accessible in async callbacks (avoid stale closures)
  const mangaOptionsRef  = useRef(mangaOptions);
  mangaOptionsRef.current  = mangaOptions;
  const mangaContentRef  = useRef(mangaContent);
  mangaContentRef.current  = mangaContent;

  const [phase, setPhase]           = useState<'cover' | 'video'>(ws().phase ?? 'cover');
  const [engineReady, setEngineReady] = useState(false);
  const [recordState, setRecordState] = useState<RecordState>(ws().mp4Url || ws().webmUrl ? 'done' : 'idle');
  const [progress, setProgress]     = useState(0);
  const [ttsStep, setTtsStep]       = useState({ done: 0, total: 0 });
  const [webmUrl, setWebmUrl]       = useState(ws().webmUrl);
  const [mp4Url, setMp4Url]         = useState(ws().mp4Url);
  const [initError, setInitError]   = useState('');
  const [convError, setConvError]   = useState(ws().convError);
  const [cvW, setCvW]               = useState(CW);
  const [cvH, setCvH]               = useState(CH);

  const previewW = PREVIEW_W_BASE;
  const previewH = calcPreviewH(cvW, cvH);
  const isGeneratingAudio = recordState === 'generating_audio';
  const isRecording       = recordState === 'recording';
  const isConverting      = recordState === 'converting';
  const isDone            = recordState === 'done';
  const isBusy            = isGeneratingAudio || isRecording || isConverting;
  const aspect            = cvW / cvH;

  const accent = style === 'chinese' ? '#e74c3c'
    : style === 'city' ? '#f5d87a'
    : style === 'nature' ? '#4ade80' : '#a855f7';

  // ── Listen for cross-instance events (FFmpeg result from old instance) ──
  useEffect(() => {
    const onWebm = (e: Event) => {
      const url = (e as CustomEvent<string>).detail;
      ws().webmUrl = url; setWebmUrl(url);
      setRecordState('converting');
    };
    const onMp4 = (e: Event) => {
      const url = (e as CustomEvent<string>).detail;
      ws().mp4Url = url; setMp4Url(url);
      setProgress(100); setRecordState('done');
    };
    const onErr = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail;
      ws().convError = msg; setConvError(msg);
      setRecordState('done');
    };
    window.addEventListener(EV_WEBM, onWebm);
    window.addEventListener(EV_MP4, onMp4);
    window.addEventListener(EV_ERR, onErr);
    return () => {
      window.removeEventListener(EV_WEBM, onWebm);
      window.removeEventListener(EV_MP4, onMp4);
      window.removeEventListener(EV_ERR, onErr);
    };
  }, []);

  // ── Init animation engine once ──────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    setEngineReady(false); setInitError('');
    createAnimEngine(
      canvasRef.current, content, style, coverIndex,
      chineseOptions, aiOptions, natureContent, undefined,
      subtitleOptions, accentOverride, cityOptions,
      mangaContent, mangaOptions, aitechOptions,
      natureOptions, titleOptions, keywordOptions, aigoblinOptions,
    )
      .then(engine => {
        engineRef.current = engine;
        setEngineReady(true);
        setCvW(engine.getCanvasWidth());
        setCvH(engine.getCanvasHeight());
        engine.start();
      })
      .catch(err => setInitError(String(err)));

    return () => {
      engineRef.current?.stop();
      audioElRef.current?.pause();
      ttsStopRef.current?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAllAudio = useCallback(() => {
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null; }
    if (ttsStopRef.current) { ttsStopRef.current(); ttsStopRef.current = null; }
  }, []);

  const handleContinue = useCallback(() => {
    ws().phase = 'video';
    setPhase('video');
    engineRef.current?.restart();
  }, []);

  // ── Preview: restart animation + play cached audio ──────────────────────
  const handlePreview = useCallback(async () => {
    stopAllAudio();
    engineRef.current?.stop(); engineRef.current?.start();
    setInitError('');

    const mc   = mangaContentRef.current;
    const opts = mangaOptionsRef.current;

    if (opts?.rapMode) {
      if (!mc?.rapAudioUrl) {
        setInitError('RAP 音频未生成。Suno API 的 custom_generate 接口正被机器人检测拦截，需要在 suno-api 的 Vercel 部署中更新 Suno 账号 Cookie。');
        return;
      }
      // Fetch + cache the blob URL (avoids repeated CORS issues)
      if (!rapBlobUrlRef.current) {
        try {
          const buf = await fetchAudioAsBuffer(mc.rapAudioUrl);
          rapBlobUrlRef.current = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
        } catch (e) {
          setInitError(`RAP 音频加载失败: ${e instanceof Error ? e.message : String(e)}`);
          return;
        }
      }
      const audio = new Audio(rapBlobUrlRef.current);
      audioElRef.current = audio;
      audio.play().catch(e => console.warn('Audio play failed:', e));
      return;
    }

    // TTS preview — play cached mp3 segments via AudioContext
    const cachedMp3s = ttsRawMp3sRef.current;
    if (cachedMp3s?.some(b => b !== null) && opts) {
      const slideDurationSec = (opts.slideDurationMs ?? 4000) / 1000;
      type ACtx = typeof AudioContext;
      const CtxCls: ACtx = window.AudioContext ?? (window as Record<string, unknown>)['webkitAudioContext'] as ACtx;
      const ctx = new CtxCls();
      const sources: AudioBufferSourceNode[] = [];
      let offset = ctx.currentTime + 0.05;
      for (const mp3 of cachedMp3s) {
        if (mp3) {
          try {
            const decoded = await ctx.decodeAudioData(mp3.slice(0));
            const src = ctx.createBufferSource();
            src.buffer = decoded; src.connect(ctx.destination); src.start(offset);
            sources.push(src);
          } catch { /* skip bad segment */ }
        }
        offset += slideDurationSec;
      }
      ttsStopRef.current = () => {
        sources.forEach(s => { try { s.stop(); } catch { /* already stopped */ } });
        ctx.close().catch(() => {});
      };
    }
  }, [stopAllAudio]);

  // ── Record + convert ────────────────────────────────────────────────────
  const handleRecord = useCallback(async () => {
    const canvas = canvasRef.current, engine = engineRef.current;
    if (!canvas || !engine) return;

    stopAllAudio();
    // Clear previous download state
    setInitError(''); setConvError('');
    ws().webmUrl = ''; ws().mp4Url = ''; ws().convError = '';
    setWebmUrl(''); setMp4Url('');
    setRecordState('idle');
    chunksRef.current = [];

    const opts = mangaOptionsRef.current;
    const mc   = mangaContentRef.current;
    const isMangaStyle = style === 'manga' || style === 'cat3d' || style === 'zen' || style === 'elite';
    const isRapMode  = isMangaStyle && !!(opts?.rapMode) && !!mc?.rapAudioUrl;
    const isMangaTts = isMangaStyle && !!(opts?.ttsEnabled) && !!mc?.segments?.length && !isRapMode;

    // ── Phase A-RAP: Fetch Suno audio ──────────────────────────────────────
    let rapAudioBuffer: ArrayBuffer | null = null;
    if (isRapMode) {
      setRecordState('generating_audio');
      setTtsStep({ done: 0, total: 1 }); setProgress(0);
      try {
        rapAudioBuffer = await fetchAudioAsBuffer(mc!.rapAudioUrl!);
        if (rapBlobUrlRef.current) URL.revokeObjectURL(rapBlobUrlRef.current);
        rapBlobUrlRef.current = URL.createObjectURL(new Blob([rapAudioBuffer], { type: 'audio/mpeg' }));
        setTtsStep({ done: 1, total: 1 }); setProgress(100);
      } catch (e) {
        setInitError(`RAP 音频下载失败（${e instanceof Error ? e.message : String(e)}），将录制无声视频。`);
      }
    }

    // ── Phase A-TTS: Generate TTS audio ───────────────────────────────────
    const rawMp3s: (ArrayBuffer | null)[] = [];
    let hasTtsAudio = false;
    let ttsVolume = 80;

    if (isMangaTts) {
      const segments = mc!.segments;
      const voice    = opts!.ttsCustomVoice?.trim() || opts!.ttsVoice || 'longxiaochun';
      const rate     = opts!.ttsRate ?? 1.0;
      ttsVolume      = opts!.ttsVolume ?? 80;

      setRecordState('generating_audio');
      setTtsStep({ done: 0, total: segments.length }); setProgress(0);

      let doneCount = 0;
      const results = await Promise.all(
        segments.map(async (seg, i) => {
          try {
            const ab = await synthesize(seg.text, voice, { rate });
            doneCount++;
            setTtsStep({ done: doneCount, total: segments.length });
            setProgress(Math.round((doneCount / segments.length) * 100));
            return ab;
          } catch (e) {
            console.warn(`TTS segment ${i} failed:`, e);
            doneCount++;
            setTtsStep({ done: doneCount, total: segments.length });
            return null;
          }
        }),
      );
      rawMp3s.push(...results);
      hasTtsAudio = rawMp3s.some(b => b !== null);
      ttsRawMp3sRef.current = rawMp3s;
      if (!hasTtsAudio) setInitError('语音合成失败，将录制无声视频。');
    }

    // ── Phase B: Canvas recording ─────────────────────────────────────────
    setRecordState('recording'); setProgress(0);

    // VP8 → better FFmpeg WASM compatibility than VP9
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';

    const videoStream = canvas.captureStream(30);
    const recorder    = new MediaRecorder(videoStream, { mimeType });
    recorderRef.current = recorder;
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

    recorder.onstop = async () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      const videoBlob = new Blob(chunksRef.current, { type: mimeType });
      console.log('[VideoGenerator] Recording done:', videoBlob.size, 'bytes,', mimeType);

      // ── Step 1: Immediate WebM download (no conversion wait) ─────────────
      const immediateWebmUrl = URL.createObjectURL(videoBlob);
      ws().webmUrl = immediateWebmUrl;
      setWebmUrl(immediateWebmUrl);
      window.dispatchEvent(new CustomEvent(EV_WEBM, { detail: immediateWebmUrl }));

      setRecordState('converting');
      setProgress(0);

      // ── Step 2: FFmpeg → MP4 in background ───────────────────────────────
      // Note: This may still be running if HMR fires and remounts this
      // component. The custom events (EV_MP4 / EV_ERR) + window store ensure
      // the new component instance receives the result.
      try {
        let mp4: Blob;
        if (rapAudioBuffer) {
          mp4 = await webmToMp4WithAudio(
            videoBlob, [{ mp3: rapAudioBuffer, startMs: 0 }],
            r => setProgress(Math.round(r * 100)),
            opts?.ttsVolume ?? 85,
          );
        } else if (hasTtsAudio) {
          const slideDurationMs = opts!.slideDurationMs ?? 4000;
          const audioSegs = rawMp3s.map((mp3, i) => mp3 ? { mp3, startMs: i * slideDurationMs } : null);
          mp4 = await webmToMp4WithAudio(
            videoBlob, audioSegs,
            r => setProgress(Math.round(r * 100)),
            ttsVolume,
          );
        } else {
          mp4 = await webmToMp4(videoBlob, r => setProgress(Math.round(r * 100)));
        }
        const url = URL.createObjectURL(mp4);
        console.log('[VideoGenerator] MP4 ready:', mp4.size, 'bytes');
        ws().mp4Url = url;
        setMp4Url(url);
        setProgress(100);
        setRecordState('done');
        // Notify any remounted instance of this component
        window.dispatchEvent(new CustomEvent(EV_MP4, { detail: url }));
      } catch (err) {
        console.error('[VideoGenerator] MP4 conversion failed:', err);
        const msg = `MP4 转换失败: ${err instanceof Error ? err.message : String(err)}`;
        ws().convError = msg;
        setConvError(msg);
        setRecordState('done');
        window.dispatchEvent(new CustomEvent(EV_ERR, { detail: msg }));
      }
    };

    // Progress bar during recording
    const total = engine.getTotalMs();
    const t0 = performance.now();
    progressTimerRef.current = setInterval(
      () => setProgress(Math.min(99, ((performance.now() - t0) / total) * 100)), 100,
    );

    recorder.start(100);
    engine.restart(() => {
      setTimeout(() => {
        recorder.stop();
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      }, 500);
    });
  }, [style, stopAllAudio]);

  const handleDownloadMp4 = useCallback(() => {
    if (!mp4Url) return;
    const a = document.createElement('a');
    a.href = mp4Url; a.download = `${content.title.slice(0, 12) || 'video'}.mp4`; a.click();
  }, [mp4Url, content.title]);

  const handleDownloadWebm = useCallback(() => {
    if (!webmUrl) return;
    const a = document.createElement('a');
    a.href = webmUrl; a.download = `${content.title.slice(0, 12) || 'video'}.webm`; a.click();
  }, [webmUrl, content.title]);

  const handleReset = useCallback(() => {
    ws().webmUrl = ''; ws().mp4Url = ''; ws().convError = '';
    setWebmUrl(''); setMp4Url(''); setConvError('');
    setRecordState('idle'); setProgress(0);
  }, []);

  const handleClose = useCallback(() => {
    // Reset persisted phase so next open starts from cover
    ws().phase = 'cover';
    ws().webmUrl = ''; ws().mp4Url = ''; ws().convError = '';
    onClose();
  }, [onClose]);

  const showControls = !isBusy;

  return (
    <div className="fixed inset-0" style={{ zIndex: isBusy ? 100 : 50 }}>
      {/* Dimmed background */}
      <div className="absolute inset-0 transition-all duration-500"
        style={{ background: isRecording ? '#000' : 'rgba(0,0,0,0.88)', backdropFilter: isRecording ? 'none' : 'blur(6px)' }} />

      {/* ── Cover phase ─────────────────────────────────────────────────── */}
      {phase === 'cover' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto py-8" style={{ zIndex: 10 }}>
          <div className="w-full max-w-sm px-4">
            <CoverPreview
              content={content} natureContent={natureContent ?? null}
              style={style} coverIndex={coverIndex}
              chineseOptions={chineseOptions} petCoverConfig={petCoverConfig}
              onContinue={handleContinue} onBack={handleClose}
            />
          </div>
          <button onClick={handleClose}
            className="absolute top-5 right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
      )}

      {/* ── Animation canvas ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{ zIndex: 1, visibility: phase === 'video' ? 'visible' : 'hidden' }}>
        <div style={isRecording ? {
          position: 'relative', overflow: 'hidden',
          width: `max(100vw, calc(100vh * ${aspect}))`,
          height: `max(100vh, calc(100vw / ${aspect}))`,
        } : {
          position: 'relative', width: previewW, height: previewH,
          borderRadius: '1rem', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {!engineReady && !initError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
              <Loader2 size={28} className="animate-spin text-white/50 mb-2" />
              <span className="text-sm text-white/40">加载中…</span>
            </div>
          )}
          {initError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 p-4 gap-3">
              <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
              <span className="text-xs text-amber-200 text-center leading-relaxed">{initError}</span>
              <button onClick={() => setInitError('')}
                className="px-4 py-1.5 rounded-full text-xs"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                关闭
              </button>
            </div>
          )}
          <canvas ref={canvasRef} width={cvW} height={cvH} style={{
            display: 'block',
            width: isRecording ? `max(100vw, calc(100vh * ${aspect}))` : previewW,
            height: isRecording ? `max(100vh, calc(100vw / ${aspect}))` : previewH,
          }} />
          {isRecording && (
            <>
              <div className="absolute top-5 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white/80 text-sm font-medium tabular-nums">REC {Math.round(progress)}%</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: accent }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Generating audio overlay ─────────────────────────────────────── */}
      {isGeneratingAudio && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ zIndex: 2 }}>
          <div className="flex items-center justify-center w-14 h-14 rounded-full"
            style={{ background: `${accent}22`, border: `1.5px solid ${accent}55` }}>
            {mangaOptions?.rapMode
              ? <Music size={24} style={{ color: accent }} className="animate-pulse" />
              : <Mic  size={24} style={{ color: accent }} className="animate-pulse" />}
          </div>
          <p className="text-white/90 text-base font-medium">
            {mangaOptions?.rapMode ? '正在加载 RAP 音频…' : '正在生成语音…'}
          </p>
          {!mangaOptions?.rapMode && (
            <p className="text-white/40 text-sm tabular-nums">{ttsStep.done} / {ttsStep.total} 段</p>
          )}
          <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: accent }} />
          </div>
        </div>
      )}

      {/* ── Converting overlay (WebM already available) ──────────────────── */}
      {isConverting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5" style={{ zIndex: 2 }}>
          <Loader2 size={36} className="animate-spin" style={{ color: accent }} />
          <div className="text-center">
            <p className="text-white/80 text-base font-medium">正在转换为 MP4…</p>
            <p className="text-white/30 text-xs mt-1">高清视频转换需要 1-3 分钟，请耐心等待</p>
          </div>
          <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: accent }} />
          </div>
          {/* WebM available immediately — no need to wait for MP4 */}
          {webmUrl && (
            <button onClick={handleDownloadWebm}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium mt-1"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.75)' }}>
              <FileVideo size={15} />不等了，先下载 WebM
            </button>
          )}
        </div>
      )}

      {/* ── Controls (video phase) ───────────────────────────────────────── */}
      {phase === 'video' && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 pointer-events-none"
          style={{ zIndex: 2, display: showControls ? 'flex' : 'none' }}>

          <button onClick={handleClose}
            className="absolute top-5 right-6 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors pointer-events-auto">
            <X size={18} />
          </button>

          {/* Download section */}
          {isDone && (
            <div className="flex flex-col items-center gap-2 pointer-events-auto mb-5">
              {/* MP4 conversion error notice */}
              {convError && (
                <div className="flex items-start gap-2 px-4 py-2.5 rounded-xl max-w-xs mb-1"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300 leading-relaxed">MP4 转换失败，可下载 WebM 格式</p>
                </div>
              )}
              {mp4Url && (
                <button onClick={handleDownloadMp4}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', boxShadow: '0 4px 20px #22c55e50' }}>
                  <Download size={16} />下载 MP4（推荐）
                </button>
              )}
              {webmUrl && (
                <button onClick={handleDownloadWebm}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.65)' }}>
                  <FileVideo size={14} />{mp4Url ? '也可下载 WebM' : '下载 WebM（立即可用）'}
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <button onClick={handlePreview} disabled={!engineReady}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }}>
              <Play size={15} />预览{rapBlobUrlRef.current || ttsRawMp3sRef.current?.some(Boolean) ? ' ♪' : ''}
            </button>
            {isDone ? (
              <button onClick={handleRecord} disabled={!engineReady}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-white/10 text-white/50 hover:text-white/70 transition-colors disabled:opacity-40 pointer-events-auto">
                <RotateCcw size={14} />重录
              </button>
            ) : (
              <button onClick={handleRecord} disabled={!engineReady}
                className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg,${accent},${accent}bb)`, color: '#fff', boxShadow: `0 4px 24px ${accent}55` }}>
                {(style === 'manga' || style === 'cat3d' || style === 'zen' || style === 'elite') && mangaOptions?.ttsEnabled
                  ? <Mic size={15} /> : <Video size={15} />}
                {(style === 'manga' || style === 'cat3d' || style === 'zen' || style === 'elite') && mangaOptions?.ttsEnabled
                  ? (mangaOptions?.rapMode ? 'RAP 配音录制' : '配音录制视频')
                  : '全屏录制视频'}
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-white/20 pointer-events-none">
            录制完成立即可下载 WebM · MP4 需等待后台转换
          </p>
        </div>
      )}
    </div>
  );
}
