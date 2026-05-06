// MangaGenerationProgress.tsx
// Shows the two-phase generation progress: script extraction + per-segment image generation.
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { GenerationProgress } from '../services/mangaGenerator';

interface Props {
  progress: GenerationProgress;
}

const ACCENT = '#f59e0b'; // amber

export default function MangaGenerationProgress({ progress }: Props) {
  const { phase, total, done, segments } = progress;

  return (
    <div className="space-y-4">
      {/* Phase indicator */}
      <div className="flex items-center gap-2.5">
        <Loader2 size={15} className="animate-spin flex-shrink-0" style={{ color: ACCENT }} />
        <div>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {phase === 'script' ? 'AI 正在优化文案脚本…' : `正在生成插画 ${done} / ${total}`}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {phase === 'script' ? '将你的文字重写为短视频字幕' : 'Seedream 4.5 · 16:9 · 漫画风格'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {phase === 'images' && total > 0 && (
        <div className="space-y-1.5">
          <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
              style={{
                width: `${(done / total) * 100}%`,
                background: `linear-gradient(90deg, ${ACCENT}bb, ${ACCENT})`,
              }}
            />
          </div>
          <div className="flex justify-between text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <span>{done} 张完成</span>
            <span>{total - done} 张生成中</span>
          </div>
        </div>
      )}

      {/* Per-segment status grid */}
      {segments.length > 0 && (
        <div className="grid grid-cols-1 gap-1.5">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2"
              style={{
                background: seg.status === 'done'
                  ? 'rgba(34,197,94,0.08)'
                  : seg.status === 'error'
                    ? 'rgba(239,68,68,0.08)'
                    : 'rgba(255,255,255,0.04)',
                border: `1px solid ${
                  seg.status === 'done'
                    ? 'rgba(34,197,94,0.2)'
                    : seg.status === 'error'
                      ? 'rgba(239,68,68,0.2)'
                      : 'rgba(255,255,255,0.07)'
                }`,
              }}
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {seg.status === 'done' ? (
                  seg.imageUrl ? (
                    <img
                      src={seg.imageUrl}
                      alt=""
                      crossOrigin="anonymous"
                      className="w-8 h-5 object-cover rounded"
                      style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  ) : (
                    <CheckCircle size={14} style={{ color: '#22c55e' }} />
                  )
                ) : seg.status === 'error' ? (
                  <XCircle size={14} style={{ color: '#ef4444' }} />
                ) : seg.status === 'generating' ? (
                  <Loader2 size={14} className="animate-spin" style={{ color: ACCENT }} />
                ) : (
                  <Clock size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs truncate"
                  style={{
                    color: seg.status === 'done'
                      ? 'rgba(255,255,255,0.85)'
                      : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {seg.text || '…'}
                </p>
                <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {seg.status === 'done' ? '插画生成完成'
                    : seg.status === 'error' ? '生成失败'
                    : seg.status === 'generating' ? '生成中…'
                    : '等待中'}
                </p>
              </div>

              {/* Index */}
              <span
                className="flex-shrink-0 text-[10px] font-bold tabular-nums"
                style={{ color: `${ACCENT}66` }}
              >
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
