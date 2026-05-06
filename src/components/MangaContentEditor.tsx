// MangaContentEditor.tsx
// Editable list of manga segments (text + scene + image thumbnail).
import type { CSSProperties, FocusEvent } from 'react';
import { RotateCcw, RefreshCw } from 'lucide-react';
import type { MangaContent, MangaSegment } from '../types/video';

interface Props {
  content: MangaContent;
  onChange: (c: MangaContent) => void;
  onReset: () => void;
  onRegenerateImage?: (index: number) => void;
  regeneratingIndexes?: Set<number>;
}

const ACCENT = '#f59e0b';

function FieldInput({
  label, value, onChange, multiline = false, placeholder = '',
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string;
}) {
  const base: CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    fontFamily: '"Noto Sans SC","PingFang SC",sans-serif',
    lineHeight: 1.5,
    padding: '5px 8px',
    outline: 'none',
    resize: 'none' as const,
    transition: 'border-color 0.15s',
  };

  const focus = (e: FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = `${ACCENT}66`;
  };
  const blur = (e: FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)';
  };

  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      {multiline ? (
        <textarea rows={2} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} style={base} onFocus={focus} onBlur={blur} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} style={base} onFocus={focus} onBlur={blur} />
      )}
    </div>
  );
}

function SegmentCard({
  segment, index, onChange, onRegenerateImage, isRegenerating,
}: {
  segment: MangaSegment; index: number;
  onChange: (s: MangaSegment) => void;
  onRegenerateImage?: (i: number) => void;
  isRegenerating?: boolean;
}) {
  const upd = (patch: Partial<MangaSegment>) => onChange({ ...segment, ...patch });

  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header: index + image thumbnail */}
      <div className="flex items-start gap-2.5">
        <span
          className="text-[11px] font-bold tabular-nums flex-shrink-0 mt-0.5"
          style={{ color: ACCENT, textShadow: `0 0 8px ${ACCENT}80` }}
        >
          {index + 1}
        </span>

        {/* Image thumbnail */}
        <div
          className="relative flex-shrink-0 rounded-lg overflow-hidden"
          style={{ width: 64, height: 36, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {segment.imageUrl ? (
            <img
              src={segment.imageUrl}
              alt={`segment ${index + 1}`}
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>无图</span>
            </div>
          )}

          {/* Regenerate image button */}
          {onRegenerateImage && (
            <button
              onClick={() => onRegenerateImage(index)}
              disabled={isRegenerating}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
              title="重新生成图片"
            >
              <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} style={{ color: '#fff' }} />
            </button>
          )}
        </div>

        {/* Subtitle text */}
        <div className="flex-1 min-w-0">
          <FieldInput
            label="字幕"
            value={segment.text}
            onChange={v => upd({ text: v })}
            placeholder="字幕内容…"
          />
        </div>
      </div>

      {/* Scene description */}
      <FieldInput
        label="画面描述（英文，影响图片生成）"
        value={segment.scene}
        onChange={v => upd({ scene: v })}
        multiline
        placeholder="anime manga style, scene description in English…"
      />
    </div>
  );
}

export default function MangaContentEditor({
  content, onChange, onReset, onRegenerateImage, regeneratingIndexes = new Set(),
}: Props) {
  const updSegment = (i: number, s: MangaSegment) => {
    const segments = content.segments.map((seg, idx) => idx === i ? s : seg);
    onChange({ ...content, segments });
  };

  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-white/8"
          style={{ color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <RotateCcw size={11} />
          重新生成
        </button>
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {content.segments.length} 段 · 点击图片可重新生成
        </span>
      </div>

      {/* Segments */}
      <div className="space-y-2">
        {content.segments.map((seg, i) => (
          <SegmentCard
            key={i}
            segment={seg}
            index={i}
            onChange={s => updSegment(i, s)}
            onRegenerateImage={onRegenerateImage}
            isRegenerating={regeneratingIndexes.has(i)}
          />
        ))}
      </div>
    </div>
  );
}
