import type { StyleType } from '../types/video';

interface Props {
  selected: StyleType;
  onChange: (s: StyleType) => void;
  compact?: boolean;
}

const STYLES: { key: StyleType; name: string; desc: string; tag: string; bg: string; accent: string }[] = [
  {
    key: 'chinese',
    name: '中国风',
    desc: '水墨意境 · 东方美学',
    tag: '24种古典纹样',
    bg: 'linear-gradient(135deg,#0a0a14,#1a1a2e)',
    accent: '#e74c3c',
  },
  {
    key: 'city',
    name: '十二生肖',
    desc: '夜色繁华 · 都市天际',
    tag: '12生肖',
    bg: 'linear-gradient(135deg,#0d1b2a,#1a2a4a)',
    accent: '#f5d87a',
  },
  {
    key: 'aitech',
    name: 'AI 科技',
    desc: '数字未来 · 智能前沿',
    tag: '24种AI品牌',
    bg: 'linear-gradient(135deg,#080c14,#1e1b4b)',
    accent: '#a855f7',
  },
  {
    key: 'nature',
    name: '山川河海',
    desc: '天地自然 · 对比之道',
    tag: '6处名山胜水',
    bg: 'linear-gradient(135deg,#060e06,#1a3020)',
    accent: '#4ade80',
  },
  {
    key: 'subtitle',
    name: '电影字幕',
    desc: '光影流动 · 影视字幕',
    tag: '荧光多彩字幕',
    bg: 'linear-gradient(135deg,#020204,#0a0a14)',
    accent: '#ffd700',
  },
  {
    key: 'translation',
    name: '中英翻译',
    desc: '双语字幕 · 暖调红韵',
    tag: '收到扣1系列',
    bg: 'linear-gradient(135deg,#190404,#631414)',
    accent: '#ffe44d',
  },
  {
    key: 'manga',
    name: '漫画字幕',
    desc: 'AI插画 · 短视频字幕',
    tag: 'Seedream 4.5 生成',
    bg: 'linear-gradient(135deg,#1a0a2e,#2d1b4e)',
    accent: '#f59e0b',
  },
];

export default function StyleSelector({ selected, onChange, compact = false }: Props) {
  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {STYLES.map(s => (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className="relative overflow-hidden rounded-xl border text-left transition-all duration-200 hover:scale-[1.02] active:scale-100"
            style={{
              background: s.bg,
              borderColor: selected === s.key ? s.accent : 'rgba(255,255,255,0.1)',
              boxShadow: selected === s.key
                ? `0 0 0 1px ${s.accent}, 0 0 12px ${s.accent}40`
                : '0 1px 6px rgba(0,0,0,0.3)',
            }}
          >
            {selected === s.key && (
              <div className="absolute inset-0 rounded-xl opacity-15 animate-pulse" style={{ background: s.accent }} />
            )}
            <div className="relative p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.accent }} />
                <div className="text-xs font-bold text-white truncate">{s.name}</div>
              </div>
              <div className="text-[10px] leading-tight" style={{ color: `${s.accent}cc` }}>{s.desc}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STYLES.map(s => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className="relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] active:scale-100"
          style={{
            background: s.bg,
            borderColor: selected === s.key ? s.accent : 'rgba(255,255,255,0.1)',
            boxShadow: selected === s.key
              ? `0 0 0 1px ${s.accent}, 0 0 24px ${s.accent}40`
              : '0 2px 12px rgba(0,0,0,0.3)',
          }}
        >
          {/* Selected ring pulse */}
          {selected === s.key && (
            <div
              className="absolute inset-0 rounded-2xl opacity-20 animate-pulse"
              style={{ background: s.accent }}
            />
          )}

          <div className="relative p-5">
            {/* Accent dot */}
            <div
              className="mb-3 h-10 w-10 rounded-full flex items-center justify-center"
              style={{ background: `${s.accent}22`, border: `1.5px solid ${s.accent}80` }}
            >
              <div className="h-3 w-3 rounded-full" style={{ background: s.accent }} />
            </div>

            <div className="text-xl font-bold text-white mb-1">{s.name}</div>
            <div className="text-sm text-white/60 mb-3">{s.desc}</div>

            <span
              className="inline-block rounded-full px-3 py-0.5 text-xs font-medium"
              style={{ background: `${s.accent}22`, color: s.accent }}
            >
              {s.tag}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
