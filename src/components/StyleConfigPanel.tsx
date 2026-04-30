// StyleConfigPanel.tsx
// Per-style live configuration panel with colour pickers, selectors, and sliders.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, X } from 'lucide-react';
import type {
  StyleType, ChineseOptions, AIOptions,
  SubtitleOptions, SubtitleEnterAnim,
  ColorScheme, AnimMode, PolyShape,
} from '../types/video';
import CoverPicker from './CoverPicker';

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  style: StyleType;
  accent: string;
  // cover selection (chinese / city / aitech / nature)
  coverIndex: number;
  onCoverIndexChange: (v: number) => void;
  // Chinese
  chineseOptions: ChineseOptions;
  onChineseOptionsChange: (v: ChineseOptions) => void;
  // AI Tech polyShape (legacy, kept for VideoGenerator compat)
  aiOptions: AIOptions;
  onAiOptionsChange: (v: AIOptions) => void;
  // Subtitle
  subtitleOptions: SubtitleOptions;
  onSubtitleOptionsChange: (v: SubtitleOptions) => void;
  // Per-style accent colour override (city / aitech / nature / translation)
  accentOverrides: Partial<Record<StyleType, string>>;
  onAccentOverrideChange: (sty: StyleType, color: string) => void;
}

// ─── Shared colour presets ─────────────────────────────────────────────────────
const COLOR_PRESETS: { name: string; value: string }[] = [
  { name: '黄金', value: '#ffd700' },
  { name: '绿光', value: '#00ff88' },
  { name: '青蓝', value: '#00d4ff' },
  { name: '玫红', value: '#ff44aa' },
  { name: '橙色', value: '#ff8c00' },
  { name: '白色', value: '#ffffff' },
  { name: '紫晶', value: '#a855f7' },
  { name: '朱红', value: '#ff3b30' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-wider uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
      {children}
    </p>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

/** A set of colour swatches + custom colour input */
function ColorPicker({
  label, value, onChange, accent,
}: { label: string; value: string; onChange: (c: string) => void; accent: string }) {
  return (
    <Row>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5 items-center">
        {COLOR_PRESETS.map(p => {
          const active = value === p.value;
          return (
            <button
              key={p.value}
              title={p.name}
              onClick={() => onChange(p.value)}
              className="relative w-6 h-6 rounded-full transition-transform hover:scale-110"
              style={{
                background: p.value,
                boxShadow: active ? `0 0 0 2px ${accent}, 0 0 0 4px ${p.value}55` : '0 0 0 1px rgba(255,255,255,0.15)',
                outline: 'none',
              }}
            >
              {active && (
                <span
                  className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                  style={{ color: '#000', textShadow: 'none' }}
                >✓</span>
              )}
            </button>
          );
        })}
        {/* Custom colour */}
        <label
          className="relative w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 overflow-hidden"
          title="自定义颜色"
          style={{
            background: 'conic-gradient(#ff4444, #ffcc00, #44ff88, #44ccff, #8844ff, #ff44cc, #ff4444)',
            boxShadow: !COLOR_PRESETS.some(p => p.value === value)
              ? `0 0 0 2px ${accent}` : '0 0 0 1px rgba(255,255,255,0.15)',
          }}
        >
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
          {!COLOR_PRESETS.some(p => p.value === value) && (
            <div className="absolute inset-0.5 rounded-full" style={{ background: value }} />
          )}
        </label>
      </div>
    </Row>
  );
}

/** Pills selector */
function PillSelect<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <Row>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </Row>
  );
}

/** 1-4 step slider */
function StepSlider({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <Row>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-[11px] mb-1.5 tabular-nums" style={{ color: 'rgba(255,255,255,0.35)' }}>{value}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className="flex-1 h-6 rounded text-[10px] font-semibold transition-all"
            style={{
              background: value === v ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${value === v ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
              color: value === v ? '#fff' : 'rgba(255,255,255,0.35)',
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </Row>
  );
}

/** Text input */
function TextInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <Row>
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-white/25 outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
      />
    </Row>
  );
}

// ─── Per-style panels ──────────────────────────────────────────────────────────

function ChinesePanel({ options, onChange, accent, coverIndex, onCoverIndexChange, style }: {
  options: ChineseOptions; onChange: (v: ChineseOptions) => void;
  accent: string; coverIndex: number; onCoverIndexChange: (v: number) => void;
  style: StyleType;
}) {
  const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
    { value: 'cinnabar', label: '朱砂' },
    { value: 'gold',     label: '金墨' },
    { value: 'jade',     label: '青玉' },
    { value: 'ink',      label: '水墨' },
    { value: 'porcelain',label: '青花' },
  ];
  const ANIM_MODES: { value: AnimMode; label: string }[] = [
    { value: 'single', label: '单句呈现' },
    { value: 'grid',   label: '九宫格' },
  ];
  return (
    <div className="space-y-4">
      <Row>
        <Label>封面图案</Label>
        <CoverPicker style={style} value={coverIndex} onChange={onCoverIndexChange} />
      </Row>
      <PillSelect label="配色方案" value={options.colorScheme} onChange={cs => onChange({ ...options, colorScheme: cs as ColorScheme })} options={COLOR_SCHEMES} />
      <StepSlider label="边框宽度" value={options.borderWidth} min={1} max={4} onChange={v => onChange({ ...options, borderWidth: v as 1|2|3|4 })} />
      <StepSlider label="线条宽度" value={options.lineWidth}   min={1} max={4} onChange={v => onChange({ ...options, lineWidth:   v as 1|2|3|4 })} />
      <PillSelect label="动画模式" value={options.animMode}    onChange={am => onChange({ ...options, animMode: am as AnimMode })} options={ANIM_MODES} />
    </div>
  );
}

function CityPanel({ coverIndex, onCoverIndexChange, accentColor, onAccentColorChange, style }: {
  coverIndex: number; onCoverIndexChange: (v: number) => void;
  accentColor: string; onAccentColorChange: (c: string) => void;
  style: StyleType;
}) {
  return (
    <div className="space-y-4">
      <Row>
        <Label>封面图案</Label>
        <CoverPicker style={style} value={coverIndex} onChange={onCoverIndexChange} />
      </Row>
      <ColorPicker label="强调色" value={accentColor} onChange={onAccentColorChange} accent={accentColor} />
      <div className="text-[10px] px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }}>
        强调色影响背景光效、标题装饰和形状颜色
      </div>
    </div>
  );
}

function AItechPanel({ coverIndex, onCoverIndexChange, aiOptions, onAiOptionsChange, accentColor, onAccentColorChange, style }: {
  coverIndex: number; onCoverIndexChange: (v: number) => void;
  aiOptions: AIOptions; onAiOptionsChange: (v: AIOptions) => void;
  accentColor: string; onAccentColorChange: (c: string) => void;
  style: StyleType;
}) {
  const SHAPES: { value: PolyShape; label: string }[] = [
    { value: 'triangle',  label: '三角' },
    { value: 'quad',      label: '四边' },
    { value: 'pentagon',  label: '五边' },
    { value: 'hexagon',   label: '六边' },
    { value: 'octagon',   label: '八边' },
    { value: 'star5',     label: '五星' },
    { value: 'decagon',   label: '十边' },
  ];
  return (
    <div className="space-y-4">
      <Row>
        <Label>封面图案</Label>
        <CoverPicker style={style} value={coverIndex} onChange={onCoverIndexChange} />
      </Row>
      <PillSelect label="几何形状" value={aiOptions.polyShape} onChange={ps => onAiOptionsChange({ ...aiOptions, polyShape: ps as PolyShape })} options={SHAPES} />
      <ColorPicker label="科技主色" value={accentColor} onChange={onAccentColorChange} accent={accentColor} />
    </div>
  );
}

function NaturePanel({ coverIndex, onCoverIndexChange, accentColor, onAccentColorChange, style }: {
  coverIndex: number; onCoverIndexChange: (v: number) => void;
  accentColor: string; onAccentColorChange: (c: string) => void;
  style: StyleType;
}) {
  return (
    <div className="space-y-4">
      <Row>
        <Label>场景选择</Label>
        <CoverPicker style={style} value={coverIndex} onChange={onCoverIndexChange} />
      </Row>
      <ColorPicker label="强调色" value={accentColor} onChange={onAccentColorChange} accent={accentColor} />
    </div>
  );
}

const ENTER_ANIMS: { value: SubtitleEnterAnim; label: string; desc: string }[] = [
  { value: 'slideUp',    label: '上滑进入', desc: '从下向上' },
  { value: 'slideLeft',  label: '左侧进入', desc: '从左滑入' },
  { value: 'slideRight', label: '右侧进入', desc: '从右滑入' },
  { value: 'typewriter', label: '打字机',   desc: '逐字显示' },
  { value: 'fadeIn',     label: '淡入',     desc: '渐变显现' },
];

const FONT_SIZES: { value: SubtitleOptions['fontSize']; label: string; sub: string }[] = [
  { value: 'auto', label: '自适应', sub: '自动' },
  { value: 'sm',   label: '小字',   sub: '52px' },
  { value: 'md',   label: '中字',   sub: '68px' },
  { value: 'lg',   label: '大字',   sub: '88px' },
];

const LINES_PER_SLIDE = [1, 2, 3, 4, 5, 6] as const;

function SubtitlePanel({ opts, onChange, accentColor, onAccentColorChange }: {
  opts: SubtitleOptions;
  onChange: (v: SubtitleOptions) => void;
  accentColor: string;
  onAccentColorChange: (c: string) => void;
}) {
  const u = (patch: Partial<SubtitleOptions>) => onChange({ ...opts, ...patch });

  // ── Keyword highlight add form local state ──────────────────────────────
  const [hlText,  setHlText]  = useState('');
  const [hlColor, setHlColor] = useState('#ff4488');

  const highlights = opts.highlights ?? [];

  const addHighlight = () => {
    const t = hlText.trim();
    if (!t) return;
    // Avoid duplicates
    if (highlights.some(h => h.text === t)) { setHlText(''); return; }
    u({ highlights: [...highlights, { text: t, color: hlColor }] });
    setHlText('');
  };

  const removeHighlight = (i: number) => {
    u({ highlights: highlights.filter((_, idx) => idx !== i) });
  };

  const updateHighlightColor = (i: number, color: string) => {
    const next = highlights.map((h, idx) => idx === i ? { ...h, color } : h);
    u({ highlights: next });
  };

  return (
    <div className="space-y-4">

      {/* Title */}
      <TextInput label="账号 / 标题名称" value={opts.titleText} onChange={v => u({ titleText: v })} placeholder="例：小福分享舍" />

      {/* Title colour */}
      <ColorPicker label="标题色 / 左侧装饰条" value={opts.titleColor} onChange={c => u({ titleColor: c })} accent={opts.accentColor} />

      {/* Accent colour (even lines) */}
      <ColorPicker label="高亮文字色（偶数行）" value={opts.accentColor} onChange={c => u({ accentColor: c })} accent={opts.accentColor} />

      {/* Default text colour */}
      <ColorPicker label="正文颜色（奇数行）" value={opts.defaultTextColor} onChange={c => u({ defaultTextColor: c })} accent={opts.accentColor} />

      {/* Font size */}
      <Row>
        <Label>字体大小</Label>
        <div className="grid grid-cols-4 gap-1">
          {FONT_SIZES.map(fs => {
            const active = opts.fontSize === fs.value;
            return (
              <button
                key={fs.value}
                onClick={() => u({ fontSize: fs.value })}
                className="flex flex-col items-center py-1.5 rounded-lg transition-all"
                style={{
                  background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <span className="text-[11px] font-semibold" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.4)' }}>{fs.label}</span>
                <span className="text-[9px]" style={{ color: active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>{fs.sub}</span>
              </button>
            );
          })}
        </div>
      </Row>

      {/* Enter animation */}
      <Row>
        <Label>字幕出场方式</Label>
        <div className="grid grid-cols-1 gap-1">
          {ENTER_ANIMS.map(a => {
            const active = opts.enterAnim === a.value;
            return (
              <button
                key={a.value}
                onClick={() => u({ enterAnim: a.value })}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left"
                style={{
                  background: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                  style={{ background: active ? opts.accentColor : 'rgba(255,255,255,0.2)' }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.45)' }}>
                    {a.label}
                  </span>
                  <span className="ml-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{a.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Row>

      {/* Lines per slide */}
      <Row>
        <div className="flex items-center justify-between">
          <Label>每页最多行数</Label>
          <span className="text-[11px] mb-1.5" style={{ color: opts.accentColor }}>
            {opts.linesPerSlide} 行
          </span>
        </div>
        <div className="flex gap-1">
          {LINES_PER_SLIDE.map(n => {
            const active = opts.linesPerSlide === n;
            return (
              <button
                key={n}
                onClick={() => u({ linesPerSlide: n })}
                className="flex-1 h-7 rounded text-xs font-semibold transition-all"
                style={{
                  background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? opts.accentColor + '80' : 'rgba(255,255,255,0.07)'}`,
                  color: active ? '#fff' : 'rgba(255,255,255,0.3)',
                  boxShadow: active ? `0 0 8px ${opts.accentColor}30` : 'none',
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
          超过此行数自动分页到下一画面
        </p>
      </Row>

      {/* ── Keyword highlights ─────────────────────────────────────────────── */}
      <Row>
        <Label>关键词高亮</Label>

        {/* Existing highlight pills */}
        {highlights.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-2">
            {highlights.map((hl, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: `${hl.color}18`, border: `1px solid ${hl.color}45` }}
              >
                {/* Inline colour dot / tiny picker */}
                <label className="relative w-4 h-4 rounded-full cursor-pointer flex-shrink-0 overflow-hidden"
                  style={{ background: hl.color }}>
                  <input
                    type="color"
                    value={hl.color}
                    onChange={e => updateHighlightColor(i, e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
                <span className="flex-1 text-xs font-medium truncate" style={{ color: hl.color }}>
                  {hl.text}
                </span>
                <button
                  onClick={() => removeHighlight(i)}
                  className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new keyword form */}
        <div className="flex gap-1.5 items-center">
          <input
            type="text"
            value={hlText}
            onChange={e => setHlText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addHighlight()}
            placeholder="输入关键词…"
            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-white/25 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          {/* Colour dot picker */}
          <label
            className="relative w-7 h-7 rounded-lg cursor-pointer flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{ background: hlColor, border: '1px solid rgba(255,255,255,0.2)' }}
            title="选择颜色"
          >
            <input
              type="color"
              value={hlColor}
              onChange={e => setHlColor(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
          {/* Add button */}
          <button
            onClick={addHighlight}
            disabled={!hlText.trim()}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
            style={{ background: opts.accentColor, boxShadow: `0 0 10px ${opts.accentColor}50` }}
          >
            <Plus size={13} className="text-black" />
          </button>
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
          匹配到的关键词将用指定颜色高亮，点击色块可修改颜色
        </p>
      </Row>

    </div>
  );
}

function TranslationPanel({ accentColor, onAccentColorChange }: {
  accentColor: string; onAccentColorChange: (c: string) => void;
}) {
  return (
    <div className="space-y-4">
      <ColorPicker label="高亮色（收到扣1）" value={accentColor} onChange={onAccentColorChange} accent={accentColor} />
      <div className="text-[10px] px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }}>
        高亮色用于"收到，扣1"互动文字和卡片装饰线
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function StyleConfigPanel({
  style, accent,
  coverIndex, onCoverIndexChange,
  chineseOptions, onChineseOptionsChange,
  aiOptions, onAiOptionsChange,
  subtitleOptions, onSubtitleOptionsChange,
  accentOverrides, onAccentOverrideChange,
}: Props) {
  const ov = accentOverrides[style];

  switch (style) {
    case 'chinese':
      return (
        <ChinesePanel
          options={chineseOptions}
          onChange={onChineseOptionsChange}
          accent={accent}
          coverIndex={coverIndex}
          onCoverIndexChange={onCoverIndexChange}
          style={style}
        />
      );

    case 'city':
      return (
        <CityPanel
          coverIndex={coverIndex}
          onCoverIndexChange={onCoverIndexChange}
          accentColor={ov ?? '#ff8c00'}
          onAccentColorChange={c => onAccentOverrideChange('city', c)}
          style={style}
        />
      );

    case 'aitech':
      return (
        <AItechPanel
          coverIndex={coverIndex}
          onCoverIndexChange={onCoverIndexChange}
          aiOptions={aiOptions}
          onAiOptionsChange={onAiOptionsChange}
          accentColor={ov ?? '#a855f7'}
          onAccentColorChange={c => onAccentOverrideChange('aitech', c)}
          style={style}
        />
      );

    case 'nature':
      return (
        <NaturePanel
          coverIndex={coverIndex}
          onCoverIndexChange={onCoverIndexChange}
          accentColor={ov ?? '#4ade80'}
          onAccentColorChange={c => onAccentOverrideChange('nature', c)}
          style={style}
        />
      );

    case 'subtitle':
      return (
        <SubtitlePanel
          opts={subtitleOptions}
          onChange={onSubtitleOptionsChange}
          accentColor={subtitleOptions.accentColor}
          onAccentColorChange={c => onAccentOverrideChange('subtitle', c)}
        />
      );

    case 'translation':
      return (
        <TranslationPanel
          accentColor={ov ?? '#ffe44d'}
          onAccentColorChange={c => onAccentOverrideChange('translation', c)}
        />
      );

    default:
      return null;
  }
}
