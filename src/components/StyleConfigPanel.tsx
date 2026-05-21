// StyleConfigPanel.tsx
// Per-style live configuration panel with colour pickers, selectors, and sliders.
import { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { Plus, X, Mic, MicOff, Play, Square, Loader2, RefreshCw, PawPrint, KeyRound } from 'lucide-react';
import { TTS_VOICES, getVoiceConfig, getStoredBailianKey, setStoredBailianKey, synthesizeFull } from '../services/tts';
import { generateArkImage, buildPetCoverPrompt } from '../services/ark';
import type {
  StyleType, ChineseOptions, AIOptions,
  SubtitleOptions, SubtitleEnterAnim,
  ColorScheme, AnimMode, PolyShape, CityOptions, MangaOptions, AItechOptions,
  PetCoverConfig,
} from '../types/video';
import CoverPicker from './CoverPicker';

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  style: StyleType;
  accent: string;
  coverIndex: number;
  onCoverIndexChange: (v: number) => void;
  chineseOptions: ChineseOptions;
  onChineseOptionsChange: (v: ChineseOptions) => void;
  aiOptions: AIOptions;
  onAiOptionsChange: (v: AIOptions) => void;
  aitechOptions: AItechOptions;
  onAitechOptionsChange: (v: AItechOptions) => void;
  subtitleOptions: SubtitleOptions;
  onSubtitleOptionsChange: (v: SubtitleOptions) => void;
  cityOptions: CityOptions;
  onCityOptionsChange: (v: CityOptions) => void;
  mangaOptions: MangaOptions;
  onMangaOptionsChange: (v: MangaOptions) => void;
  accentOverrides: Partial<Record<StyleType, string>>;
  onAccentOverrideChange: (sty: StyleType, color: string) => void;
  // ── Pet cover ──────────────────────────────────────────────────────────────
  petCoverConfig: PetCoverConfig;
  onPetCoverConfigChange: (c: PetCoverConfig) => void;
  titleForPetCover: string;
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

/** Numeric range slider with label + value display */
function NumericSlider({
  label, value, min, max, step = 1, unit = 'px', onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  unit?: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <Row>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-[11px] mb-1.5 tabular-nums font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none outline-none cursor-pointer"
        style={{
          background: `linear-gradient(to right,rgba(255,255,255,0.7) 0%,rgba(255,255,255,0.7) ${pct}%,rgba(255,255,255,0.12) ${pct}%,rgba(255,255,255,0.12) 100%)`,
        }}
      />
      <div className="flex justify-between text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.18)' }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </Row>
  );
}

/** Optional colour picker — allows clearing to "auto/theme default" */
function OptionalColorPicker({
  label, value, placeholder, onChange, accent,
}: {
  label: string; value: string; placeholder: string;
  onChange: (c: string) => void; accent: string;
}) {
  return (
    <Row>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-[10px] mb-1 transition-opacity hover:opacity-100 opacity-40"
            style={{ color: '#fff' }}
          >
            ← 恢复默认
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {/* "Auto" swatch */}
        <button
          onClick={() => onChange('')}
          title={placeholder}
          className="px-2 h-6 rounded-full text-[10px] font-medium transition-all flex-shrink-0"
          style={{
            background: value === '' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${value === '' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: value === '' ? '#fff' : 'rgba(255,255,255,0.35)',
          }}
        >
          默认
        </button>
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
              }}
            >
              {active && (
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: '#000' }}>✓</span>
              )}
            </button>
          );
        })}
        <label
          className="relative w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 overflow-hidden"
          title="自定义颜色"
          style={{
            background: 'conic-gradient(#ff4444,#ffcc00,#44ff88,#44ccff,#8844ff,#ff44cc,#ff4444)',
            boxShadow: value && !COLOR_PRESETS.some(p => p.value === value) ? `0 0 0 2px ${accent}` : '0 0 0 1px rgba(255,255,255,0.15)',
          }}
        >
          <input type="color" value={value || '#ffffff'} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
          {value && !COLOR_PRESETS.some(p => p.value === value) && (
            <div className="absolute inset-0.5 rounded-full" style={{ background: value }} />
          )}
        </label>
      </div>
    </Row>
  );
}

/** Thin divider with label */
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>{title}</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

// ─── PetCoverSection ───────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://spb-t4ngxi6xsx650369.supabase.opentrust.net';
function petProxy(url: string) {
  return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
}

function PetCoverSection({ config, onChange, titleForGen }: {
  config: PetCoverConfig;
  onChange: (c: PetCoverConfig) => void;
  titleForGen: string;
}) {
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState('');

  const handleGenerate = async () => {
    if (!titleForGen) { setGenError('请先填写视频标题'); return; }
    setLoading(true);
    setGenError('');
    try {
      const prompt = buildPetCoverPrompt(titleForGen);
      const url = await generateArkImage(prompt, '1440x1920');
      onChange({ ...config, enabled: true, imageUrl: url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'NO_ARK_KEY') setGenError('请先配置即梦 API Key');
      else setGenError(`生成失败: ${msg.slice(0, 60)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <SectionDivider title="宠物封面" />

      {/* Toggle */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => onChange({ ...config, enabled: !config.enabled })}
      >
        <div className="flex items-center gap-2">
          <PawPrint size={13} style={{ color: config.enabled ? '#f97316' : 'rgba(255,255,255,0.3)' }} />
          <Label>宠物封面</Label>
        </div>
        <div
          className="relative w-9 h-5 rounded-full transition-colors"
          style={{ background: config.enabled ? '#f97316' : 'rgba(255,255,255,0.12)' }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
            style={{ left: config.enabled ? '1.25rem' : '0.125rem' }}
          />
        </div>
      </div>

      {config.enabled && (
        <div className="space-y-2.5">
          {/* Position selector */}
          <PillSelect
            label="宠物位置"
            value={config.position}
            onChange={v => onChange({ ...config, position: v as PetCoverConfig['position'] })}
            options={[
              { value: 'bottom', label: '下半部分' },
              { value: 'center', label: '居中偏下' },
              { value: 'full', label: '全屏展示' },
            ]}
          />

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              border: 'none',
            }}
          >
            {loading
              ? <><Loader2 size={13} className="animate-spin" />AI 生成中…</>
              : <><RefreshCw size={13} />{config.imageUrl ? '重新生成宠物' : '生成宠物形象'}</>
            }
          </button>

          {/* Preview thumbnail */}
          {config.imageUrl && !loading && (
            <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '3/4', background: '#111' }}>
              <img
                src={petProxy(config.imageUrl)}
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
                alt="宠物封面预览"
              />
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#f97316' }}>
                已生成
              </div>
            </div>
          )}

          {genError && (
            <p className="text-[10px] text-red-400">{genError}</p>
          )}

          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            使用即梦 AI 根据标题自动生成匹配气质的柴犬宠物形象封面
          </p>
        </div>
      )}
    </div>
  );
}

function ChinesePanel({ options, onChange, accent, coverIndex, onCoverIndexChange, style, petCoverConfig, onPetCoverConfigChange, titleForPetCover }: {
  options: ChineseOptions; onChange: (v: ChineseOptions) => void;
  accent: string; coverIndex: number; onCoverIndexChange: (v: number) => void;
  style: StyleType;
  petCoverConfig: PetCoverConfig; onPetCoverConfigChange: (c: PetCoverConfig) => void;
  titleForPetCover: string;
}) {
  const upd = (patch: Partial<ChineseOptions>) => onChange({ ...options, ...patch });

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
      {/* ── Cover ─────────────────────────────────────────────────────────── */}
      {!petCoverConfig.enabled && (
        <Row>
          <Label>封面图案</Label>
          <CoverPicker style={style} value={coverIndex} onChange={onCoverIndexChange} />
        </Row>
      )}
      <PetCoverSection config={petCoverConfig} onChange={onPetCoverConfigChange} titleForGen={titleForPetCover} />

      {/* ── Theme & Layout ────────────────────────────────────────────────── */}
      <SectionDivider title="主题 · 布局" />
      <PillSelect
        label="标题入场动画"
        value={options.titleEntranceAnim ?? 'dropsFromSky'}
        onChange={v => upd({ titleEntranceAnim: v as 'dropsFromSky' | 'typewriter' })}
        options={[
          { value: 'dropsFromSky', label: '从天而降' },
          { value: 'typewriter',   label: '打字机' },
        ]}
      />
      <PillSelect label="配色方案" value={options.colorScheme} onChange={cs => upd({ colorScheme: cs as ColorScheme })} options={COLOR_SCHEMES} />
      <StepSlider label="边框宽度" value={options.borderWidth} min={1} max={4} onChange={v => upd({ borderWidth: v as 1|2|3|4 })} />
      <StepSlider label="线条宽度" value={options.lineWidth}   min={1} max={4} onChange={v => upd({ lineWidth:   v as 1|2|3|4 })} />
      <PillSelect label="动画模式" value={options.animMode}    onChange={am => upd({ animMode: am as AnimMode })} options={ANIM_MODES} />

      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <SectionDivider title="标题样式" />
      <div className="px-2 py-1.5 rounded-lg text-[10px]" style={{ background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.35)' }}>
        字号&nbsp;<b style={{color:'rgba(255,255,255,0.55)'}}>{options.titleFontSize ?? 68}px</b>
        &nbsp;·&nbsp;颜色&nbsp;<b style={{color:options.titleColor||accent}}>{options.titleColor||'主题强调色（默认）'}</b>
      </div>
      <NumericSlider label="标题字号" value={options.titleFontSize ?? 68} min={40} max={100} onChange={v => upd({ titleFontSize: v })} />
      <OptionalColorPicker label="标题颜色（空=强调色）" value={options.titleColor ?? ''} placeholder="跟随主题强调色" onChange={c => upd({ titleColor: c })} accent={accent} />

      {/* ── Short / subtitle ──────────────────────────────────────────────── */}
      <SectionDivider title="副标题样式" />
      <div className="px-2 py-1.5 rounded-lg text-[10px]" style={{ background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.35)' }}>
        字号&nbsp;<b style={{color:'rgba(255,255,255,0.55)'}}>{options.shortFontSize ?? 36}px</b>
        &nbsp;·&nbsp;颜色&nbsp;<b style={{color:options.shortColor||'#aaffcc'}}>{options.shortColor||'主题次要色（默认）'}</b>
      </div>
      <NumericSlider label="副标题字号" value={options.shortFontSize ?? 36} min={20} max={60} onChange={v => upd({ shortFontSize: v })} />
      <OptionalColorPicker label="副标题颜色（空=次要色）" value={options.shortColor ?? ''} placeholder="跟随主题次要色" onChange={c => upd({ shortColor: c })} accent={accent} />

      {/* ── Desc ──────────────────────────────────────────────────────────── */}
      <SectionDivider title="辅助说明样式" />
      <div className="px-2 py-1.5 rounded-lg text-[10px]" style={{ background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.35)' }}>
        字号&nbsp;<b style={{color:'rgba(255,255,255,0.55)'}}>{options.descFontSize ?? 32}px</b>
        &nbsp;·&nbsp;颜色&nbsp;<b style={{color:options.descColor||'rgba(255,255,255,0.92)'}}>{options.descColor||'近白色 0.92（默认）'}</b>
      </div>
      <NumericSlider label="辅助说明字号" value={options.descFontSize ?? 32} min={16} max={48} onChange={v => upd({ descFontSize: v })} />
      <OptionalColorPicker label="辅助说明颜色（空=白色）" value={options.descColor ?? ''} placeholder="rgba(255,255,255,0.92)" onChange={c => upd({ descColor: c })} accent={accent} />

      {/* ── Background ────────────────────────────────────────────────────── */}
      <SectionDivider title="背景配色" />
      <div className="px-2 py-1.5 rounded-lg text-[10px]" style={{ background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.25)' }}>
        当前背景为纯黑色，配色方案仅影响文字和装饰元素颜色
      </div>
    </div>
  );
}

function CityPanel({
  coverIndex, onCoverIndexChange,
  accentColor, onAccentColorChange,
  style,
  cityOptions, onCityOptionsChange,
  petCoverConfig, onPetCoverConfigChange, titleForPetCover,
}: {
  coverIndex: number; onCoverIndexChange: (v: number) => void;
  accentColor: string; onAccentColorChange: (c: string) => void;
  style: StyleType;
  cityOptions: CityOptions; onCityOptionsChange: (v: CityOptions) => void;
  petCoverConfig: PetCoverConfig; onPetCoverConfigChange: (c: PetCoverConfig) => void;
  titleForPetCover: string;
}) {
  const upd = (patch: Partial<CityOptions>) => onCityOptionsChange({ ...cityOptions, ...patch });
  return (
    <div className="space-y-4">
      {!petCoverConfig.enabled && (
        <Row>
          <Label>封面图案</Label>
          <CoverPicker style={style} value={coverIndex} onChange={onCoverIndexChange} />
        </Row>
      )}
      <PetCoverSection config={petCoverConfig} onChange={onPetCoverConfigChange} titleForGen={titleForPetCover} />
      <ColorPicker label="强调色" value={accentColor} onChange={onAccentColorChange} accent={accentColor} />

      <SectionDivider title="标题（数字+关键词）" />
      <NumericSlider label="字号" value={cityOptions.labelFontSize ?? 108} min={60} max={140} onChange={v => upd({ labelFontSize: v })} />
      <OptionalColorPicker label="颜色（空=强调色）" value={cityOptions.labelColor ?? ''} placeholder="跟随强调色" onChange={c => upd({ labelColor: c })} accent={accentColor} />

      <SectionDivider title="副标题" />
      <NumericSlider label="字号" value={cityOptions.shortFontSize ?? 64} min={36} max={90} onChange={v => upd({ shortFontSize: v })} />
      <OptionalColorPicker label="颜色（空=白色）" value={cityOptions.shortColor ?? ''} placeholder="rgba(255,255,255,0.95)" onChange={c => upd({ shortColor: c })} accent={accentColor} />

      <SectionDivider title="说明文字" />
      <NumericSlider label="字号" value={cityOptions.descFontSize ?? 40} min={22} max={56} onChange={v => upd({ descFontSize: v })} />
      <OptionalColorPicker label="颜色（空=浅灰）" value={cityOptions.descColor ?? ''} placeholder="rgba(220,220,220,0.92)" onChange={c => upd({ descColor: c })} accent={accentColor} />
    </div>
  );
}

function AItechPanel({ coverIndex, onCoverIndexChange, aitechOptions, onAitechOptionsChange, accentColor, onAccentColorChange, style, petCoverConfig, onPetCoverConfigChange, titleForPetCover }: {
  coverIndex: number; onCoverIndexChange: (v: number) => void;
  aitechOptions: AItechOptions; onAitechOptionsChange: (v: AItechOptions) => void;
  accentColor: string; onAccentColorChange: (c: string) => void;
  style: StyleType;
  petCoverConfig: PetCoverConfig; onPetCoverConfigChange: (c: PetCoverConfig) => void;
  titleForPetCover: string;
}) {
  const upd = (patch: Partial<AItechOptions>) => onAitechOptionsChange({ ...aitechOptions, ...patch });

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
      {!petCoverConfig.enabled && (
        <Row>
          <Label>封面图案</Label>
          <CoverPicker style={style} value={coverIndex} onChange={onCoverIndexChange} />
        </Row>
      )}
      <PetCoverSection config={petCoverConfig} onChange={onPetCoverConfigChange} titleForGen={titleForPetCover} />
      <PillSelect label="几何形状" value={aitechOptions.polyShape} onChange={ps => upd({ polyShape: ps as PolyShape })} options={SHAPES} />
      <ColorPicker label="科技主色" value={accentColor} onChange={onAccentColorChange} accent={accentColor} />

      {/* ── 大标题（Label）样式 ─────────────────────────────────────────── */}
      <SectionDivider title="大标题样式（卡片内数字/关键词）" />
      <div className="px-2 py-1.5 rounded-lg text-[10px]" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}>
        字号&nbsp;<b style={{ color: 'rgba(255,255,255,0.55)' }}>{aitechOptions.labelFontSize ?? 70}px</b>
        &nbsp;·&nbsp;颜色&nbsp;<b style={{ color: aitechOptions.labelColor || '#ffe655' }}>{aitechOptions.labelColor || '金黄色（默认）'}</b>
      </div>
      <NumericSlider label="大标题字号" value={aitechOptions.labelFontSize ?? 70} min={40} max={110} onChange={v => upd({ labelFontSize: v })} />
      <OptionalColorPicker label="大标题颜色（空=金黄）" value={aitechOptions.labelColor ?? ''} placeholder="#ffe655" onChange={c => upd({ labelColor: c })} accent={accentColor} />

      {/* ── 副标题（Short）样式 ────────────────────────────────────────── */}
      <SectionDivider title="副标题样式（卡片内说明词）" />
      <div className="px-2 py-1.5 rounded-lg text-[10px]" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}>
        字号&nbsp;<b style={{ color: 'rgba(255,255,255,0.55)' }}>{aitechOptions.shortFontSize ?? 48}px</b>
        &nbsp;·&nbsp;颜色&nbsp;<b style={{ color: aitechOptions.shortColor || 'rgba(255,255,255,0.98)' }}>{aitechOptions.shortColor || '白色（默认）'}</b>
      </div>
      <NumericSlider label="副标题字号" value={aitechOptions.shortFontSize ?? 48} min={28} max={80} onChange={v => upd({ shortFontSize: v })} />
      <OptionalColorPicker label="副标题颜色（空=白色）" value={aitechOptions.shortColor ?? ''} placeholder="rgba(255,255,255,0.98)" onChange={c => upd({ shortColor: c })} accent={accentColor} />

      {/* ── 描述文字（Desc）样式 ───────────────────────────────────────── */}
      <SectionDivider title="描述文字样式（卡片外补充说明）" />
      <div className="px-2 py-1.5 rounded-lg text-[10px]" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}>
        字号&nbsp;<b style={{ color: 'rgba(255,255,255,0.55)' }}>{aitechOptions.descFontSize ?? 42}px</b>
        &nbsp;·&nbsp;颜色&nbsp;<b style={{ color: aitechOptions.descColor || 'rgba(255,168,48,0.97)' }}>{aitechOptions.descColor || '琥珀色（默认）'}</b>
      </div>
      <NumericSlider label="描述字号" value={aitechOptions.descFontSize ?? 42} min={24} max={68} onChange={v => upd({ descFontSize: v })} />
      <OptionalColorPicker label="描述颜色（空=琥珀色）" value={aitechOptions.descColor ?? ''} placeholder="rgba(255,168,48,0.97)" onChange={c => upd({ descColor: c })} accent={accentColor} />
    </div>
  );
}

function NaturePanel({ coverIndex, onCoverIndexChange, accentColor, onAccentColorChange, style, petCoverConfig, onPetCoverConfigChange, titleForPetCover }: {
  coverIndex: number; onCoverIndexChange: (v: number) => void;
  accentColor: string; onAccentColorChange: (c: string) => void;
  style: StyleType;
  petCoverConfig: PetCoverConfig; onPetCoverConfigChange: (c: PetCoverConfig) => void;
  titleForPetCover: string;
}) {
  return (
    <div className="space-y-4">
      {!petCoverConfig.enabled && (
        <Row>
          <Label>场景选择</Label>
          <CoverPicker style={style} value={coverIndex} onChange={onCoverIndexChange} />
        </Row>
      )}
      <PetCoverSection config={petCoverConfig} onChange={onPetCoverConfigChange} titleForGen={titleForPetCover} />
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
          <Label>同时显示行数（滚动窗口）</Label>
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

function MangaPanel({ opts, onChange }: {
  opts: MangaOptions; onChange: (v: MangaOptions) => void;
}) {
  const u = (patch: Partial<MangaOptions>) => onChange({ ...opts, ...patch });

  // ── Bailian API key (localStorage, not in code) ───────────────────────────
  const [bailianKey, setBailianKey] = useState(() => getStoredBailianKey());
  const handleKeyChange = (val: string) => {
    setBailianKey(val);
    setStoredBailianKey(val);
  };

  // ── Voice preview: use real Bailian TTS (MP3) if key set, else browser TTS ──
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice]       = useState<string | null>(null);
  const [previewError, setPreviewError]        = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPreviewingVoice(null);
    setLoadingVoice(null);
  };

  const previewVoice = async (voiceId: string) => {
    setPreviewError('');
    if (previewingVoice === voiceId || loadingVoice === voiceId) { stopPreview(); return; }
    stopPreview();

    // ── If Bailian key set: fetch real MP3 from Edge Function ──────────────
    if (bailianKey) {
      setLoadingVoice(voiceId);
      try {
        const result = await synthesizeFull('你好，大家好，欢迎使用漫画字幕配音功能。', voiceId, { rate: opts.ttsRate ?? 1.0 });
        // Show warning if falling back to Google TTS (API key not working)
        if (result.source === 'google-fallback') {
          setPreviewError(`API未生效，使用备用语音。错误：${result.errors ?? '请确认API Key是否已开通TTS模型'}`);
        }
        const url = URL.createObjectURL(new Blob([result.data], { type: 'audio/mpeg' }));
        blobUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setPreviewingVoice(null); };
        audio.onerror = () => { setPreviewError('播放失败，请检查 API Key 或网络'); setPreviewingVoice(null); };
        await audio.play();
        setLoadingVoice(null);
        setPreviewingVoice(voiceId);
      } catch (e) {
        setLoadingVoice(null);
        setPreviewError(`试听失败: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }

    // ── Fallback: browser speechSynthesis (all voices sound similar) ───────
    if (!('speechSynthesis' in window)) { setPreviewError('浏览器不支持语音试听'); return; }
    setPreviewingVoice(voiceId);
    const cfg = getVoiceConfig(voiceId);
    const utt = new SpeechSynthesisUtterance('你好，大家好，欢迎使用漫画字幕配音。');
    utt.lang = 'zh-CN';
    utt.rate = cfg.previewRate;
    utt.pitch = cfg.previewPitch;
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh-CN')) ?? voices.find(v => v.lang.startsWith('zh'));
    if (zhVoice) utt.voice = zhVoice;
    utt.onend = () => setPreviewingVoice(null);
    utt.onerror = (e) => {
      setPreviewingVoice(null);
      const err = (e as SpeechSynthesisErrorEvent).error;
      if (err !== 'interrupted') setPreviewError(`试听失败: ${err ?? '请检查音频设备'}`);
    };
    window.speechSynthesis.speak(utt);
  };

  // Effective voice for highlight
  const effectiveVoice = opts.ttsCustomVoice?.trim() || opts.ttsVoice || 'longxiaochun';

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
  };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)');
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)');

  return (
    <div className="space-y-4">
      {/* ── Disclaimer ── */}
      <Row>
        <Label>免责声明文字（顶部）</Label>
        <input
          type="text"
          value={opts.disclaimer}
          onChange={e => u({ disclaimer: e.target.value })}
          placeholder="仅代表个人观点，无任何不良导向"
          className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-white/25 outline-none transition-all"
          style={inputStyle}
          onFocus={inputFocus} onBlur={inputBlur}
        />
      </Row>

      {/* ── Font size + slide duration ── */}
      <NumericSlider label="字幕字号" value={opts.subtitleFontSize} min={48} max={100}
        onChange={v => u({ subtitleFontSize: v })} />
      <NumericSlider label="每段停留时间" value={opts.slideDurationMs / 1000} min={2} max={8}
        step={0.5} unit="s" onChange={v => u({ slideDurationMs: Math.round(v * 1000) })} />

      {/* ── TTS toggle ── */}
      <Row>
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => u({ ttsEnabled: !opts.ttsEnabled })}
        >
          <div className="flex items-center gap-2">
            {opts.ttsEnabled
              ? <Mic size={13} style={{ color: '#a855f7' }} />
              : <MicOff size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />}
            <Label>配音朗读</Label>
          </div>
          <div
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{ background: opts.ttsEnabled ? '#a855f7' : 'rgba(255,255,255,0.12)' }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
              style={{ left: opts.ttsEnabled ? '1.25rem' : '0.125rem' }}
            />
          </div>
        </div>

        {opts.ttsEnabled && (
          <div className="mt-3 space-y-3">

            {/* ── Bailian API Key ── */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <KeyRound size={11} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  阿里百炼 API Key（不提交代码，仅存本地）
                </span>
              </div>
              <input
                type="password"
                value={bailianKey}
                onChange={e => handleKeyChange(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                autoComplete="off"
                className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-white/20 outline-none transition-all font-mono"
                style={inputStyle}
                onFocus={inputFocus} onBlur={inputBlur}
              />
              {!bailianKey && (
                <p className="mt-1 text-[10px]" style={{ color: 'rgba(255,200,100,0.5)' }}>
                  未配置时将使用免费备用语音（Google TTS）
                </p>
              )}
            </div>

            {/* ── Preset voice list ── */}
            <div>
              <p className="mb-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                预设音色 · 点击
                <span className="inline-flex items-center mx-1 px-1 py-0.5 rounded"
                  style={{ background: 'rgba(168,85,247,0.2)', color: '#d8b4fe' }}>
                  <Play size={8} className="mr-0.5" />试听
                </span>
                {bailianKey ? '可播放真实百炼语音' : '（配置 API Key 后可试听真实音色）'}
              </p>
              <div className="flex flex-col gap-1.5">
                {TTS_VOICES.map(v => {
                  const isSelected = effectiveVoice === v.id && !opts.ttsCustomVoice?.trim();
                  const isPlaying  = previewingVoice === v.id;
                  const isLoading  = loadingVoice === v.id;
                  return (
                    <div key={v.id} className="flex items-center gap-1.5">
                      <button
                        onClick={() => u({ ttsVoice: v.id, ttsCustomVoice: '' })}
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] text-left transition-all"
                        style={{
                          background: isSelected ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${isSelected ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)'}`,
                          color: isSelected ? '#d8b4fe' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {v.label}
                      </button>
                      <button
                        onClick={() => previewVoice(v.id)}
                        disabled={isLoading}
                        title={isPlaying ? '停止试听' : isLoading ? '加载中…' : '试听音色'}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                        style={{
                          background: (isPlaying || isLoading)
                            ? 'rgba(168,85,247,0.35)'
                            : 'rgba(255,255,255,0.07)',
                          border: `1px solid ${(isPlaying || isLoading) ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)'}`,
                          opacity: isLoading ? 0.8 : 1,
                        }}
                      >
                        {isLoading ? (
                          <Loader2 size={10} className="animate-spin" style={{ color: '#d8b4fe' }} />
                        ) : isPlaying ? (
                          <Square size={10} style={{ color: '#d8b4fe' }} />
                        ) : (
                          <Play size={10} style={{ color: 'rgba(255,255,255,0.45)' }} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              {previewError && (
                <p className="mt-1 text-[10px] text-red-400">{previewError}</p>
              )}
            </div>

            {/* ── Custom voice ID ── */}
            <div>
              <p className="mb-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                自定义音色 ID（非空时覆盖上方选择）
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={opts.ttsCustomVoice ?? ''}
                  onChange={e => u({ ttsCustomVoice: e.target.value })}
                  placeholder="例如 longxiaobai、longtong …"
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-white/20 outline-none transition-all font-mono"
                  style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur}
                />
                {opts.ttsCustomVoice?.trim() && (
                  <button
                    onClick={() => previewVoice(opts.ttsCustomVoice!.trim())}
                    disabled={loadingVoice === opts.ttsCustomVoice?.trim()}
                    title="试听自定义音色"
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                    style={{
                      background: (previewingVoice === opts.ttsCustomVoice?.trim() || loadingVoice === opts.ttsCustomVoice?.trim())
                        ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${(previewingVoice === opts.ttsCustomVoice?.trim() || loadingVoice === opts.ttsCustomVoice?.trim()) ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    {loadingVoice === opts.ttsCustomVoice?.trim() ? (
                      <Loader2 size={10} className="animate-spin" style={{ color: '#d8b4fe' }} />
                    ) : previewingVoice === opts.ttsCustomVoice?.trim() ? (
                      <Square size={10} style={{ color: '#d8b4fe' }} />
                    ) : (
                      <Play size={10} style={{ color: 'rgba(255,255,255,0.45)' }} />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ── Speech rate ── */}
            <NumericSlider
              label="语速"
              value={opts.ttsRate ?? 1.0}
              min={0.5}
              max={2.0}
              step={0.1}
              unit="x"
              onChange={v => u({ ttsRate: v })}
            />

            {/* ── Volume ── */}
            <NumericSlider
              label="音量"
              value={opts.ttsVolume ?? 80}
              min={0}
              max={100}
              step={5}
              unit="%"
              onChange={v => u({ ttsVolume: v })}
            />

          </div>
        )}
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
  aitechOptions, onAitechOptionsChange,
  subtitleOptions, onSubtitleOptionsChange,
  cityOptions, onCityOptionsChange,
  mangaOptions, onMangaOptionsChange,
  accentOverrides, onAccentOverrideChange,
  petCoverConfig, onPetCoverConfigChange, titleForPetCover,
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
          petCoverConfig={petCoverConfig}
          onPetCoverConfigChange={onPetCoverConfigChange}
          titleForPetCover={titleForPetCover}
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
          cityOptions={cityOptions}
          onCityOptionsChange={onCityOptionsChange}
          petCoverConfig={petCoverConfig}
          onPetCoverConfigChange={onPetCoverConfigChange}
          titleForPetCover={titleForPetCover}
        />
      );

    case 'aitech':
      return (
        <AItechPanel
          coverIndex={coverIndex}
          onCoverIndexChange={onCoverIndexChange}
          aitechOptions={aitechOptions}
          onAitechOptionsChange={(opts) => {
            // Keep legacy aiOptions.polyShape in sync for backward compat
            onAiOptionsChange({ ...aiOptions, polyShape: opts.polyShape });
            onAitechOptionsChange(opts);
          }}
          accentColor={accentOverrides['aitech'] ?? '#a855f7'}
          onAccentColorChange={c => onAccentOverrideChange('aitech', c)}
          style={style}
          petCoverConfig={petCoverConfig}
          onPetCoverConfigChange={onPetCoverConfigChange}
          titleForPetCover={titleForPetCover}
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
          petCoverConfig={petCoverConfig}
          onPetCoverConfigChange={onPetCoverConfigChange}
          titleForPetCover={titleForPetCover}
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

    case 'manga':
      return <MangaPanel opts={mangaOptions} onChange={onMangaOptionsChange} />;

    default:
      return null;
  }
}
