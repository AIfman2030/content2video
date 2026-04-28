import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import type { GeneratedContent, StyleType, ChineseOptions, AIOptions, NatureContent } from '../types/video';
import { createAnimEngine, CW, CH, type AnimEngine } from '../lib/canvasEngine';

interface Props {
  content: GeneratedContent | null;
  style: StyleType;
  coverIndex: number;
  chineseOptions: ChineseOptions;
  aiOptions: AIOptions;
  natureContent: NatureContent | null;
  accent: string;
}

function fmtMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function StudioCanvas({
  content, style, coverIndex, chineseOptions, aiOptions, natureContent, accent,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AnimEngine | null>(null);
  const syncRafRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [totalMs, setTotalMs] = useState(0);

  // ── Sync loop: polls engine elapsed to keep slider in sync ──────────────────
  const startSync = useCallback(() => {
    cancelAnimationFrame(syncRafRef.current);
    const loop = () => {
      const eng = engineRef.current;
      if (!eng) return;
      setCurrentMs(eng.getElapsed());
      if (!eng.isRunning()) {
        setPlaying(false);
        return;
      }
      syncRafRef.current = requestAnimationFrame(loop);
    };
    syncRafRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Re-create engine whenever content changes ────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !content) return;

    setIsReady(false);
    setInitError('');
    setCurrentMs(0);
    setPlaying(false);
    cancelAnimationFrame(syncRafRef.current);
    engineRef.current?.stop();
    engineRef.current = null;

    let cancelled = false;
    createAnimEngine(
      canvasRef.current, content, style, coverIndex,
      chineseOptions, aiOptions, natureContent ?? undefined,
    ).then(eng => {
      if (cancelled) { eng.stop(); return; }
      engineRef.current = eng;
      setTotalMs(eng.getTotalMs());
      setIsReady(true);
      eng.start();
      setPlaying(true);
      startSync();
    }).catch(err => {
      if (!cancelled) setInitError(String(err));
    });

    return () => {
      cancelled = true;
      engineRef.current?.stop();
      cancelAnimationFrame(syncRafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // ── Play / Pause ────────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    if (eng.isRunning()) {
      eng.stop();
      setPlaying(false);
      cancelAnimationFrame(syncRafRef.current);
    } else {
      if (eng.getElapsed() >= eng.getTotalMs() - 100) {
        eng.restart();
      } else {
        eng.start();
      }
      setPlaying(true);
      startSync();
    }
  }, [startSync]);

  // ── Restart ──────────────────────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.restart();
    setPlaying(true);
    setCurrentMs(0);
    startSync();
  }, [startSync]);

  // ── Seek ────────────────────────────────────────────────────────────────────
  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = Number(e.target.value);
    setCurrentMs(ms);
    cancelAnimationFrame(syncRafRef.current);
    engineRef.current?.seekTo(ms);
    setPlaying(false);
  }, []);

  const progress = totalMs > 0 ? currentMs / totalMs : 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full h-full">

      {/* ── Canvas area ── */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0">
        {!content ? (
          /* Placeholder when no content */
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{
              // Portrait placeholder that matches canvas aspect
              height: 'min(100%, calc(100vh - 200px))',
              aspectRatio: `${CW} / ${CH}`,
              maxWidth: '100%',
              background: 'rgba(10,10,20,0.7)',
              border: '1px dashed rgba(255,255,255,0.1)',
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: `${accent}18`, border: `1.5px solid ${accent}50` }}
            >
              <Play size={20} style={{ color: accent }} />
            </div>
            <p className="text-sm text-center px-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
              填写内容并点击生成<br />即可实时预览动画
            </p>
          </div>
        ) : (
          /* Canvas wrapper — portrait, fills available height */
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
            {/* Loading overlay */}
            {!isReady && !initError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 z-10">
                <Loader2 size={22} className="animate-spin" style={{ color: accent }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>加载动画资源…</span>
              </div>
            )}
            {/* Error overlay */}
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

      {/* ── Timeline + playback controls (shown once content loaded) ── */}
      {content && (
        <div className="w-full max-w-sm space-y-2">
          {/* Progress bar + scrubber */}
          <div className="space-y-1">
            <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              {/* Filled bar */}
              <div
                className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
                style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${accent}bb, ${accent})` }}
              />
              {/* Transparent range input on top */}
              <input
                type="range"
                min={0}
                max={totalMs || 1}
                step={50}
                value={currentMs}
                onChange={handleSeekChange}
                disabled={!isReady}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
                style={{ margin: 0 }}
              />
            </div>
            {/* Time labels */}
            <div className="flex justify-between text-[10px] tabular-nums" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span>{fmtMs(currentMs)}</span>
              <span>{fmtMs(totalMs)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              disabled={!isReady}
              title="从头播放"
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-white/10 disabled:opacity-30"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <RotateCcw size={13} style={{ color: 'rgba(255,255,255,0.5)' }} />
            </button>

            <button
              onClick={handlePlayPause}
              disabled={!isReady}
              title={playing ? '暂停' : '播放'}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                boxShadow: `0 4px 16px ${accent}55`,
              }}
            >
              {playing
                ? <Pause size={15} className="text-white" />
                : <Play size={15} className="text-white ml-0.5" />
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
