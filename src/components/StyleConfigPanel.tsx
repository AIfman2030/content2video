import type { ReactNode } from 'react';
import type { StyleType, ChineseOptions, ColorScheme, AIOptions, PolyShape } from '../types/video';
import CoverPicker from './CoverPicker';

interface Props {
  style: StyleType;
  accent: string;
  coverIndex: number;
  onCoverIndexChange: (v: number) => void;
  chineseOptions: ChineseOptions;
  onChineseOptionsChange: (v: ChineseOptions) => void;
  aiOptions: AIOptions;
  onAiOptionsChange: (v: AIOptions) => void;
}

const COLOR_SCHEME_OPTIONS: { id: ColorScheme; name: string; colors: string[] }[] = [
  { id: 'ink',       name: '水墨',  colors: ['#c0c0c0', '#8b8b8b', '#4a4a4a'] },
  { id: 'cinnabar',  name: '朱砂',  colors: ['#e74c3c', '#f39c12', '#c0392b'] },
  { id: 'jade',      name: '玉色',  colors: ['#1abc9c', '#27ae60', '#16a085'] },
  { id: 'gold',      name: '鎏金',  colors: ['#f0c040', '#d4a017', '#8b6914'] },
  { id: 'porcelain', name: '青花',  colors: ['#2980b9', '#ecf0f1', '#2c3e50'] },
];

const POLY_SHAPE_OPTIONS: { id: PolyShape; name: string }[] = [
  { id: 'triangle', name: '三角' },
  { id: 'quad',     name: '四边' },
  { id: 'pentagon', name: '五边' },
  { id: 'hexagon',  name: '六边' },
  { id: 'octagon',  name: '八边' },
  { id: 'star5',    name: '五角星' },
  { id: 'decagon',  name: '十边' },
];

// Pill-style option button
function PillBtn({
  active, accent, onClick, children,
}: { active: boolean; accent: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg px-3 py-1.5 text-xs transition-all border"
      style={{
        background:   active ? `${accent}22` : 'rgba(255,255,255,0.05)',
        borderColor:  active ? accent        : 'rgba(255,255,255,0.1)',
        color:        active ? accent        : 'rgba(255,255,255,0.45)',
      }}
    >
      {children}
    </button>
  );
}

// Small section label
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
      {children}
    </p>
  );
}

export default function StyleConfigPanel({
  style, accent,
  coverIndex, onCoverIndexChange,
  chineseOptions, onChineseOptionsChange,
  aiOptions, onAiOptionsChange,
}: Props) {
  const hasCover = style !== 'subtitle' && style !== 'translation';

  return (
    <div className="space-y-5">

      {/* ── 封面 / 图案 ── */}
      {hasCover && (
        <div className="space-y-2">
          <SectionLabel>封面图案</SectionLabel>
          <CoverPicker style={style} selected={coverIndex} onChange={onCoverIndexChange} />
        </div>
      )}

      {/* ── 中国风：配色 + 线条 + 动画方式 ── */}
      {style === 'chinese' && (
        <>
          <div className="space-y-2">
            <SectionLabel>配色方案</SectionLabel>
            <div className="flex gap-2 flex-wrap">
              {COLOR_SCHEME_OPTIONS.map(sc => (
                <button
                  key={sc.id}
                  onClick={() => onChineseOptionsChange({ ...chineseOptions, colorScheme: sc.id })}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all border"
                  style={{
                    background:  chineseOptions.colorScheme === sc.id ? `${sc.colors[0]}22` : 'rgba(255,255,255,0.05)',
                    borderColor: chineseOptions.colorScheme === sc.id ? sc.colors[0]        : 'rgba(255,255,255,0.1)',
                    color:       chineseOptions.colorScheme === sc.id ? sc.colors[0]        : 'rgba(255,255,255,0.45)',
                  }}
                >
                  <span className="flex gap-0.5">
                    {sc.colors.map(c => <span key={c} className="block h-3 w-3 rounded-full" style={{ background: c }} />)}
                  </span>
                  {sc.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <SectionLabel>粗细</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>边框</p>
                <div className="flex gap-1">
                  {([1, 2, 3, 4] as const).map(v => (
                    <PillBtn key={v} active={chineseOptions.borderWidth === v} accent={accent}
                      onClick={() => onChineseOptionsChange({ ...chineseOptions, borderWidth: v })}>
                      {v}
                    </PillBtn>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>线条</p>
                <div className="flex gap-1">
                  {([1, 2, 3, 4] as const).map(v => (
                    <PillBtn key={v} active={chineseOptions.lineWidth === v} accent={accent}
                      onClick={() => onChineseOptionsChange({ ...chineseOptions, lineWidth: v })}>
                      {v}
                    </PillBtn>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <SectionLabel>动画方式</SectionLabel>
            <div className="flex gap-2">
              {(['single', 'grid'] as const).map(mode => (
                <PillBtn key={mode} active={chineseOptions.animMode === mode} accent={accent}
                  onClick={() => onChineseOptionsChange({ ...chineseOptions, animMode: mode })}>
                  {mode === 'single' ? '单卡片' : '网格卡片'}
                </PillBtn>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── AI 科技：几何图形 ── */}
      {style === 'aitech' && (
        <div className="space-y-2">
          <SectionLabel>几何图形</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {POLY_SHAPE_OPTIONS.map(opt => (
              <PillBtn key={opt.id} active={aiOptions.polyShape === opt.id} accent={accent}
                onClick={() => onAiOptionsChange({ polyShape: opt.id })}>
                {opt.name}
              </PillBtn>
            ))}
          </div>
        </div>
      )}

      {/* ── 字幕 / 翻译：暂无额外参数提示 ── */}
      {(style === 'subtitle' || style === 'translation') && (
        <p className="text-[11px] text-center py-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
          此风格暂无额外配置项
        </p>
      )}
    </div>
  );
}
