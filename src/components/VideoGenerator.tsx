import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Video, Download, RotateCcw, Loader2, Mic, Music, AlertCircle, FileVideo } from 'lucide-react';
import type { GeneratedContent, StyleType, ChineseOptions, AIOptions, NatureContent, SubtitleOptions, CityOptions, MangaContent, MangaOptions, AItechOptions, PetCoverConfig, NatureOptions, TitleOptions, KeywordOptions } from '../types/video';
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
}

const PREVIEW_W = 512;
const PREVIEW_H = Math.round(512 * CH / CW);
type RecordState = 'idle' | 'generating_audio' | 'recording' | 'converting' | 'done';

// ── Module-level store: survives React hot-reload (HMR) ─────────────────────
// Without this, a code change during FFmpeg conversion resets all useState,
// losing the download URL even if conversion succeeded.
const _store = {
  webmUrl: '',          // Immediate download (available right after recording)
  mp4Url: '',           // Available after FFmpeg conversion
  webmBlob: null as Blob | null,
  title: '',
  phase: 'cover' as 'cover' | 'video',
  convError: '',
};

export default function VideoGenerator({
  content, style, coverIndex, chineseOptions, aiOptions, natureContent, onClose,
  subtitleOptions, accentOverride, cityOptions, mangaContent, mangaOptions, aitechOptions,
  petCoverConfig, natureOptions, titleOptions, keywordOptions,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'cover' | 'video'>(_store.phase);
  const [engineReady, setEngineReady] = useState(false);
  const [recordState, setRecordState] = useState<RecordState>(_store.mp4Url ? 'done' : 'idle');
  const [progress, setProgress] = useState(0);
  const [ttsStep, setTtsStep] = useState({ done: 0, total: 0 });
  const [webmUrl, setWebmUrl] = useState(_store.webmUrl);   // instant download
  const [mp4Url, setMp4Url] = useState(_store.mp4Url);      // after FFmpeg
  const [initError, setInitError] = useState('');
  const [convError, setConvError] = useState(_store.convError);
  const engineRef = useRef<Awaited<ReturnType<typeof createAnimEngine>> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Audio cache (for preview playback) ───────────────────────────────────
  const audioElRef    = useRef<HTMLAudioElement | null>(null);
  const rapBlobUrlRef = useRef<string | null>(null);
  const ttsRawMp3sRef = useRef<(ArrayBuffer | null)[] | null>(null);
  const ttsStopRef    = useRef<(() => void) | null>(null);

  // Latest opts/content accessible in async callbacks (avoid stale closure)
  const mangaOptionsRef = useRef(mangaOptions);
  mangaOptionsRef.current = mangaOptions;
  const mangaContentRef = useRef(mangaContent);
  mangaContentRef.current = mangaContent;

  const isGeneratingAudio = recordState === 'generating_audio';
  const isRecording       = recordState === 'recording';
  const isConverting      = recordState === 'converting';
  const isDone            = recordState === 'done';
  const isBusy            = isGeneratingAudio || isRecording || isConverting;
  const aspect            = CW / CH;

  const accent = style === 'chinese' ? '#e74c3c'
    : style === 'city' ? '#f5d87a'
    : style === 'nature' ? '#4ade80' : '#a855f7';

  // Init engine once on mount
  useEffect(() => {
    if (!canvasRef.current) return;
    setEngineReady(false); setInitError('');
    createAnimEngine(
      canvasRef.current, content, style, coverIndex,
      chineseOptions, aiOptions, natureContent, undefined,
      subtitleOptions, accentOverride, cityOptions,
      mangaContent, mangaOptions, aitechOptions,
      natureOptions, titleOptions, keywordOptions,
    )
      .then(engine => { engineRef.current = engine; setEngineReady(true); engine.start(); })
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
    _store.phase = 'video';
    setPhase('video');
    engineRef.current?.restart();
  }, []);

  // ── Preview: restart animation + play cached audio ────────────────────────
  const handlePreview = useCallback(async () => {
    stopAllAudio();
    engineRef.current?.stop(); engineRef.current?.start();
    setRecordState(prevState => prevState === 'done' ? 'done' : 'idle');
    setProgress(0); setInitError(''); setConvError(''); _store.convError = '';

    const mc   = mangaContentRef.current;
    const opts = mangaOptionsRef.current;

    // RAP mode: play Suno audio if available
    if (opts?.rapMode) {
      if (!mc?.rapAudioUrl) {
        setInitError('RAP 音乐尚未生成（Suno API 需要有效认证）。请检查 suno-api 部署配置。');
        return;
      }
      if (!rapBlobUrlRef.current) {
        try {
          const buf = await fetchAudioAsBuffer(mc.rapAudioUrl);
          rapBlobUrlRef.current = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
        } catch (e) {
          console.warn('Preview RAP audio fetch failed:', e);
          setInitError('RAP 音频加载失败，请检查网络连接。');
          return;
        }
      }
      const audio = new Audio(rapBlobUrlRef.current);
      audioElRef.current = audio;
      audio.play().catch(e => console.warn('Audio play failed:', e));
      return;
    }

    // TTS mode: play cached mp3 segments via AudioContext
    const cachedMp3s = ttsRawMp3sRef.current;
    if (cachedMp3s?.some(b => b !== null) && opts) {
      const slideDurationSec = (opts.slideDurationMs ?? 4000) / 1000;
      type ACtx = typeof AudioContext;
      const CtxCls: ACtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: ACtx }).webkitAudioContext;
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
          } catch { /* ignore segment decode error */ }
        }
        offset += slideDurationSec;
      }
      ttsStopRef.current = () => {
        sources.forEach(s => { try { s.stop(); } catch { /* already stopped */ } });
        ctx.close().catch(() => {});
      };
    }
  }, [stopAllAudio]);

  const handleRecord = useCallback(async () => {
    const canvas = canvasRef.current, engine = engineRef.current;
    if (!canvas || !engine) return;

    stopAllAudio();
    // Reset state
    setInitError(''); setConvError(''); _store.convError = '';
    setWebmUrl(''); setMp4Url(''); _store.webmUrl = ''; _store.mp4Url = '';
    setRecordState('idle');
    chunksRef.current = [];

    const opts = mangaOptionsRef.current;
    const mc   = mangaContentRef.current;
    const isRapMode  = style === 'manga' && (opts?.rapMode ?? false) && !!mc?.rapAudioUrl;
    const isMangaTts = style === 'manga' && !!opts?.ttsEnabled && !!mc?.segments?.length && !isRapMode;

    // ── Phase A-RAP: Fetch Suno RAP audio ──────────────────────────────────
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
        console.warn('RAP audio fetch failed:', e);
        setInitError('RAP 音频下载失败，将录制无声视频。');
      }
    }

    // ── Phase A-TTS: Generate TTS audio ────────────────────────────────────
    const rawMp3s: (ArrayBuffer | null)[] = [];
    let hasTtsAudio = false;
    let ttsVolume = 80;

    if (isMangaTts) {
      const segments = mc!.segments;
      const voice = opts!.ttsCustomVoice?.trim() || opts!.ttsVoice || 'longxiaochun';
      const rate = opts!.ttsRate ?? 1.0;
      ttsVolume  = opts!.ttsVolume ?? 80;

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

    // ── Phase B: Canvas recording ───────────────────────────────────────────
    setRecordState('recording'); setProgress(0);

    const videoStream = canvas.captureStream(30);
    // Prefer VP8 — better FFmpeg WASM compatibility than VP9
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';

    const recorder = new MediaRecorder(videoStream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

    recorder.onstop = async () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      const videoBlob = new Blob(chunksRef.current, { type: mimeType });
      console.log('[VideoGenerator] Recording done. Blob size:', videoBlob.size, 'bytes, mimeType:', mimeType);

      // ── Step 1: Offer immediate WebM download (no conversion needed) ──────
      const immediateWebmUrl = URL.createObjectURL(videoBlob);
      _store.webmUrl  = immediateWebmUrl;
      _store.webmBlob = videoBlob;
      _store.title    = content.title;
      setWebmUrl(immediateWebmUrl);
      setRecordState('converting');
      setProgress(0);

      // ── Step 2: Convert to MP4 in background ──────────────────────────────
      try {
        let mp4: Blob;
        if (rapAudioBuffer) {
          mp4 = await webmToMp4WithAudio(
            videoBlob, [{ mp3: rapAudioBuffer, startMs: 0 }],
            r => setProgress(Math.round(r * 100)), opts?.ttsVolume ?? 85,
          );
        } else if (hasTtsAudio) {
          const slideDurationMs = opts!.slideDurationMs ?? 4000;
          const audioSegs = rawMp3s.map((mp3, i) => mp3 ? { mp3, startMs: i * slideDurationMs } : null);
          mp4 = await webmToMp4WithAudio(
            videoBlob, audioSegs,
            r => setProgress(Math.round(r * 100)), ttsVolume,
          );
        } else {
          mp4 = await webmToMp4(videoBlob, r => setProgress(Math.round(r * 100)));
        }
        const url = URL.createObjectURL(mp4);
        _store.mp4Url = url;
        setMp4Url(url);
        setProgress(100);
        setRecordState('done');
        console.log('[VideoGenerator] MP4 ready, size:', mp4.size);
      } catch (err) {
        console.error('[VideoGenerator] MP4 conversion failed:', err);
        const msg = `MP4 转换失败: ${err instanceof Error ? err.message : String(err)}`;
        _store.convError = msg;
        setConvError(msg);
        setRecordState('done'); // still done — WebM is available
      }
    };

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
  }, [style, content.title, stopAllAudio]);

  const handleDownloadMp4 = useCallback(() => {
    if (!mp4Url) return;
    const a = document.createElement('a');
    a.href = mp4Url;
    a.download = `${content.title.slice(0, 12) || 'video'}.mp4`;
    a.click();
  }, [mp4Url, content.title]);

  const handleDownloadWebm = useCallback(() => {
    if (!webmUrl) return;
    const a = document.createElement('a');
    a.href = webmUrl;
    a.download = `${content.title.slice(0, 12) || 'video'}.webm`;
    a.click();
  }, [webmUrl, content.title]);

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
              content={content} natureContent={natureContent ?? null}
              style={style} coverIndex={coverIndex}
              chineseOptions={chineseOptions} petCoverConfig={petCoverConfig}
              onContinue={handleContinue} onBack={onClose}
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
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300 text-center leading-relaxed">{initError}</span>
              <button onClick={() => setInitError('')}
                className="px-4 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
                关闭
              </button>
            </div>
          )}
          <canvas ref={canvasRef} width={CW} height={CH} style={{
            display: 'block',
            width: isRecording ? `max(100vw, calc(100vh * ${aspect}))` : PREVIEW_W,
            height: isRecording ? `max(100vh, calc(100vw / ${aspect}))` : PREVIEW_H,
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

      {/* Generating audio overlay */}
      {isGeneratingAudio && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ zIndex: 2 }}>
          <div className="flex items-center justify-center w-14 h-14 rounded-full"
            style={{ background: `${accent}22`, border: `1.5px solid ${accent}55` }}>
            {mangaOptions?.rapMode ? <Music size={24} style={{ color: accent }} className="animate-pulse" />
              : <Mic size={24} style={{ color: accent }} className="animate-pulse" />}
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

      {/* Converting overlay — shown while FFmpeg runs, but WebM is already available */}
      {isConverting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5" style={{ zIndex: 2 }}>
          <Loader2 size={36} className="animate-spin" style={{ color: accent }} />
          <div className="text-center">
            <p className="text-white/80 text-base font-medium">正在转换为 MP4…</p>
            <p className="text-white/30 text-xs mt-1">高清视频转换需要 1-3 分钟</p>
          </div>
          <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: accent }} />
          </div>
          {/* WebM is available immediately — offer it while MP4 converts */}
          {webmUrl && (
            <button onClick={handleDownloadWebm}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium mt-2"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>
              <FileVideo size={15} />先下载 WebM（立即可用）
            </button>
          )}
        </div>
      )}

      {/* MP4 conversion error (shown alongside download buttons when done) */}
      {convError && isDone && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 max-w-sm w-full px-4">
          <div className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-300 leading-relaxed">{convError}</p>
              <p className="text-xs text-white/30 mt-1">WebM 文件仍可下载</p>
            </div>
            <button onClick={() => { setConvError(''); _store.convError = ''; }}
              className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Controls (video phase) */}
      {phase === 'video' && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 pointer-events-none"
          style={{ zIndex: 2, display: showControls ? 'flex' : 'none' }}>
          <button onClick={onClose}
            className="absolute top-5 right-6 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors pointer-events-auto">
            <X size={18} />
          </button>

          {/* Download buttons when done */}
          {isDone && (
            <div className="flex flex-col items-center gap-3 pointer-events-auto mb-4">
              {mp4Url && (
                <button onClick={handleDownloadMp4}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 4px 20px #22c55e50' }}>
                  <Download size={16} />下载 MP4（推荐）
                </button>
              )}
              {webmUrl && (
                <button onClick={handleDownloadWebm}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.7)' }}>
                  <FileVideo size={14} />下载 WebM
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <button onClick={handlePreview} disabled={!engineReady}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }}>
              <Play size={15} />预览
            </button>
            {isDone ? (
              <button onClick={handleRecord} disabled={!engineReady}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm text-white/50 hover:text-white/70 transition-colors border border-white/10 disabled:opacity-40 pointer-events-auto">
                <RotateCcw size={14} />重录
              </button>
            ) : (
              <button onClick={handleRecord} disabled={!engineReady}
                className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)`, color: '#fff', boxShadow: `0 4px 24px ${accent}55` }}>
                {style === 'manga' && mangaOptions?.ttsEnabled ? <Mic size={15} /> : <Video size={15} />}
                {style === 'manga' && mangaOptions?.ttsEnabled
                  ? (mangaOptions?.rapMode ? 'RAP 配音录制' : '配音录制视频')
                  : '全屏录制视频'}
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-white/25 pointer-events-none">
            录制完成后立即可下载 WebM · MP4 转换在后台进行
          </p>
        </div>
      )}
    </div>
  );
}
