import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import type { GeneratedContent, StyleType, ChineseOptions, AIOptions, NatureContent, SubtitleOptions, CityOptions, MangaContent, MangaOptions, AItechOptions, NatureOptions } from '../types/video';
import { createAnimEngine, CW, CH, type AnimEngine } from '../lib/canvasEngine';

interface Props {
  content: GeneratedContent | null;
  style: StyleType;
  coverIndex: number;
  chineseOptions: ChineseOptions;
  aiOptions: AIOptions;
  natureContent: NatureContent | null;
  accent: string;
  subtitleOptions: SubtitleOptions;
  accentOverride?: string;
  cityOptions?: CityOptions;
  mangaContent?: MangaContent;
  mangaOptions?: MangaOptions;
  aitechOptions?: AItechOptions;
  natureOptions?: NatureOptions;
}

function fmtMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function StudioCanvas({
  content, style, coverIndex, chineseOptions, aiOptions, natureContent, accent,
  subtitleOptions, accentOverride, cityOptions, mangaContent, mangaOptions, aitechOptions, natureOptions,
}: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const engineRef   = useRef<AnimEngine | null>(null);
  const syncRafRef  = useRef<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isReady, setIsReady]     = useState(false);
  const [initError, setInitError] = useState('');
  const [playing, setPlaying]     = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [totalMs, setTotalMs]     = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // ── Sync loop ──────────────────────────────────────────────────────────────
  const startSync = useCallback(() => {
    cancelAnimationFrame(syncRafRef.current);
    const loop = () => {
      const eng = engineRef.current;
      if (!eng) return;
      setCurrentMs(eng.getElapsed());
      if (!eng.isRunning()) { setPlaying(false); return; }
      syncRafRef.current = requestAnimationFrame(loop);
    };
    syncRafRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Build engine ───────────────────────────────────────────────────────────
  const buildEngine = useCallback((
    canvas: HTMLCanvasElement,
    c: GeneratedContent,
    sty: StyleType,
    ci: number,
    cho: ChineseOptions,
    aio: AIOptions,
    nat: NatureContent | null,
    subOpts: SubtitleOptions,
    accOverride: string | undefined,
    onDone: (eng: AnimEngine) => void,
    onFail: (e: string) => void,
    cito?: CityOptions,
    mangaCnt?: MangaContent,
    mangaOpts?: MangaOptions,
    aitechOpts?: AItechOptions,
    natOpts?: NatureOptions,
  ) => {
    let cancelled = false;
    createAnimEngine(canvas, c, sty, ci, cho, aio, nat ?? undefined, undefined, subOpts, accOverride, cito, mangaCnt, mangaOpts, aitechOpts, natOpts)
      .then(eng => { if (cancelled) { eng.stop(); return; } onDone(eng); })
      .catch(err => { if (!cancelled) onFail(String(err)); });
    return () => { cancelled = true; };
  }, []);

  // ── Re-init immediately when content changes ───────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !content) return;
    setIsReady(false);
    setInitError('');
    setCurrentMs(0);
    setPlaying(false);
    cancelAnimationFrame(syncRafRef.current);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    engineRef.current?.stop();
    engineRef.current = null;

    const cancel = buildEngine(
      canvasRef.current, content, style, coverIndex, chineseOptions, aiOptions, natureContent,
      subtitleOptions, accentOverride,
      (eng) => {
        engineRef.current = eng;
        setTotalMs(eng.getTotalMs());
        setIsReady(true);
        setRefreshing(false);
        eng.start();
        setPlaying(true);
        startSync();
      },
      (err) => { setInitError(err); setRefreshing(false); },
      cityOptions, mangaContent, mangaOptions, aitechOptions, natureOptions,
    );
    return cancel;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // ── Re-init (debounced 400ms) when options change ──────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !content) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setRefreshing(true);

    debounceRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas || !content) return;
      cancelAnimationFrame(syncRafRef.current);
      engineRef.current?.stop();
      engineRef.current = null;

      buildEngine(
        canvas, content, style, coverIndex, chineseOptions, aiOptions, natureContent,
        subtitleOptions, accentOverride,
        (eng) => {
          engineRef.current = eng;
          setTotalMs(eng.getTotalMs());
          setIsReady(true);
          setRefreshing(false);
          setCurrentMs(0);
          eng.start();
          setPlaying(true);
          startSync();
        },
        (err) => { setInitError(err); setRefreshing(false); },
        cityOptions, mangaContent, mangaOptions, aitechOptions, natureOptions,
      );
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverIndex, chineseOptions, aiOptions, style, subtitleOptions, accentOverride, cityOptions, mangaContent, mangaOptions, aitechOptions, natureOptions]);

  // ── Play / Pause ───────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    if (eng.isRunning()) {
      eng.stop(); setPlaying(false); cancelAnimationFrame(syncRafRef.current);
    } else {
      if (eng.getElapsed() >= eng.getTotalMs() - 100) eng.restart(); else eng.start();
      setPlaying(true); startSync();
    }
  }, [startSync]);

  // ── Restart ────────────────────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.restart(); setPlaying(true); setCurrentMs(0); startSync();
  }, [startSync]);

  // ── Seek ───────────────────────────────────────────────────────────────────
  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = Number(e.target.value);
    setCurrentMs(ms);
    cancelAnimationFrame(syncRafRef.current);
    engineRef.current?.seekTo(ms);
    setPlaying(false);
  }, []);

  const progress = totalMs > 0 ? currentMs / totalMs : 0;
  const displayAccent = accentOverride ?? accent;

  return (
    <div className="flex flex-col items-center gap-4 w-full h-full">

      {/* ── Canvas area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0">
        {!content ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{
              height: 'min(100%, calc(100vh - 200px))',
              aspectRatio: `${CW} / ${CH}`,
              maxWidth: '100%',
              background: 'rgba(10,10,20,0.7)',
              border: '1px dashed rgba(255,255,255,0.1)',
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: `${displayAccent}18`, border: `1.5px solid ${displayAccent}50` }}
            >
              <Play size={20} style={{ color: displayAccent }} />
            </div>
            <p className="text-sm text-center px-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
              填写内容并点击生成<br />即可实时预览动画
            </p>
          </div>
        ) : (
          <div
            style={{
              position: 'relative',
              height: 'min(100%, calc(100vh - 200px))',
              aspectRatio: `${CW} / ${CH}`,
              maxWidth: '100%',
              borderRadius: '0.875rem',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            {(!isReady || refreshing) && !initError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10"
                style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
                <Loader2 size={22} className="animate-spin" style={{ color: displayAccent }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {refreshing ? '更新预览…' : '加载动画资源…'}
                </span>
              </div>
            )}
            {initError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-4">
                <span className="text-xs text-red-400 text-center">{initError}</span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
          </div>
        )}
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      {content && (
        <div className="w-full max-w-sm space-y-2">
          <div className="space-y-1">
            <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
                style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${displayAccent}bb, ${displayAccent})` }}
              />
              <input
                type="range" min={0} max={totalMs || 1} step={50} value={currentMs}
                onChange={handleSeekChange}
                disabled={!isReady || refreshing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
                style={{ margin: 0 }}
              />
            </div>
            <div className="flex justify-between text-[10px] tabular-nums" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span>{fmtMs(currentMs)}</span>
              <span>{fmtMs(totalMs)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button onClick={handleRestart} disabled={!isReady || refreshing} title="从头播放"
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-white/10 disabled:opacity-30"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <RotateCcw size={13} style={{ color: 'rgba(255,255,255,0.5)' }} />
            </button>
            <button onClick={handlePlayPause} disabled={!isReady || refreshing} title={playing ? '暂停' : '播放'}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
              style={{ background: `linear-gradient(135deg, ${displayAccent}, ${displayAccent}cc)`, boxShadow: `0 4px 16px ${displayAccent}55` }}>
              {playing
                ? <Pause size={15} className="text-white" />
                : <Play  size={15} className="text-white ml-0.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
