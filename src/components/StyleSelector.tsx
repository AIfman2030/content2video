import type { StyleType } from '../types/video';

interface Props {
  selected: StyleType;
  onChange: (s: StyleType) => void;
  compact?: boolean;
}

const STYLES: { key: StyleType; name: string; desc: string; tag: string; bg: string; accent: string }[] = [
  {
    key: 'city',
    name: '知识动画',
    desc: '主题图形 · 动态讲解',
    tag: '封面智能匹配',
    bg: 'linear-gradient(135deg,#0d1b2a,#1a2a4a)',
    accent: '#f5d87a',
  },
];

export default function StyleSelector({ selected, onChange, compact = false }: Props) {
  if (compact) {
    return (
      <div className="grid grid-cols-1 gap-1.5">
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
