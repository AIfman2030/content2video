import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import type { StyleType, ChineseOptions, ColorScheme, AIOptions, PolyShape } from '../types/video';
import CoverPicker from './CoverPicker';

interface Props {
  style: StyleType;
  onGenerate: (text: string, coverIndex: number, chineseOptions: ChineseOptions, aiOptions: AIOptions) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

const COLOR_SCHEME_OPTIONS: { id: ColorScheme; name: string; colors: string[] }[] = [
  { id: 'ink', name: '水墨', colors: ['#c0c0c0', '#8b8b8b', '#4a4a4a'] },
  { id: 'cinnabar', name: '朱砂', colors: ['#e74c3c', '#f39c12', '#c0392b'] },
  { id: 'jade', name: '玉色', colors: ['#1abc9c', '#27ae60', '#16a085'] },
  { id: 'gold', name: '鎏金', colors: ['#f0c040', '#d4a017', '#8b6914'] },
  { id: 'porcelain', name: '青花', colors: ['#2980b9', '#ecf0f1', '#2c3e50'] },
];

const POLY_SHAPE_OPTIONS: { id: PolyShape; name: string; sides: number }[] = [
  { id: 'triangle', name: '三角形', sides: 3 },
  { id: 'quad', name: '四边形', sides: 4 },
  { id: 'pentagon', name: '五边形', sides: 5 },
  { id: 'hexagon', name: '六边形', sides: 6 },
  { id: 'octagon', name: '八边形', sides: 8 },
  { id: 'star5', name: '五角星', sides: 5 },
  { id: 'decagon', name: '十边形', sides: 10 },
];

const ACCENT_BY_STYLE: Record<StyleType, string> = {
  chinese:  '#e74c3c',
  city:     '#f5d87a',
  aitech:   '#a855f7',
  nature:   '#4ade80',
  subtitle: '#ffd700',
};

const PLACEHOLDER = `粘贴你的文章内容，或者直接输入任何文字…

示例：
自媒体创作者要想突破，需要掌握6大核心能力：
1. 选题策略——找到用户真正关心的话题
2. 内容结构——让观众看得下去
3. 视觉设计——第一眼就抓住注意力
4. 数据分析——用数据指导创作
5. 变现逻辑——把流量变成收入
6. 持续更新——保持创作节奏`;

export default function ContentForm({ style, onGenerate, isLoading, error }: Props) {
  const [text, setText] = useState('');
  const [coverIndex, setCoverIndex] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [chineseOptions, setChineseOptions] = useState<ChineseOptions>({
    colorScheme: 'cinnabar',
    borderWidth: 2,
    lineWidth: 2,
    animMode: 'single',
  });
  const [aiOptions, setAiOptions] = useState<AIOptions>({ polyShape: 'hexagon' });

  const accent = ACCENT_BY_STYLE[style];
  const charCount = text.length;
  const isValid = charCount >= 20 && charCount <= 8000;

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;
    await onGenerate(text, coverIndex, chineseOptions, aiOptions);
  };

  return (
    <div className="space-y-5">
      {/* Text area */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/70">粘贴文章内容</label>
        <div className="relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={8}
            className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/90 placeholder-white/25 outline-none transition-colors focus:border-white/30 focus:bg-white/8"
            style={{ fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif', lineHeight: 1.7 }}
          />
          <div className={`absolute bottom-3 right-3 text-xs ${
            charCount < 20 ? 'text-white/30'
              : charCount > 8000 ? 'text-red-400'
              : 'text-white/40'
          }`}>
            {charCount} / 8000
          </div>
        </div>
        {charCount > 0 && charCount < 20 && (
          <p className="text-xs text-amber-400/80">至少输入20个字符</p>
        )}
      </div>

      {/* Cover picker — not used for subtitle style */}
      {style !== 'subtitle' && (
        <div
          className="rounded-xl border border-white/10 p-4"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <CoverPicker
            style={style}
            selected={coverIndex}
            onChange={setCoverIndex}
          />
        </div>
      )}

      {/* AI polygon selector (AI tech only) */}
      {style === 'aitech' && (
        <div
          className="rounded-xl border border-white/10 p-4 space-y-3"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <label className="text-xs text-white/50">AI 几何图形</label>
          <div className="flex gap-2 flex-wrap">
            {POLY_SHAPE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setAiOptions({ polyShape: opt.id })}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-all border"
                style={{
                  background: aiOptions.polyShape === opt.id ? `${accent}22` : 'rgba(255,255,255,0.05)',
                  borderColor: aiOptions.polyShape === opt.id ? accent : 'rgba(255,255,255,0.1)',
                  color: aiOptions.polyShape === opt.id ? accent : 'rgba(255,255,255,0.5)',
                }}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced options (Chinese only) */}
      {style === 'chinese' && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm text-white/60 hover:text-white/80 transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <span>高级选项</span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvanced && (
            <div className="p-4 space-y-4 border-t border-white/10">
              {/* Color scheme */}
              <div className="space-y-2">
                <label className="text-xs text-white/50">配色方案</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_SCHEME_OPTIONS.map(scheme => (
                    <button
                      key={scheme.id}
                      onClick={() => setChineseOptions(p => ({ ...p, colorScheme: scheme.id }))}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all border"
                      style={{
                        background: chineseOptions.colorScheme === scheme.id ? `${scheme.colors[0]}22` : 'rgba(255,255,255,0.05)',
                        borderColor: chineseOptions.colorScheme === scheme.id ? scheme.colors[0] : 'rgba(255,255,255,0.1)',
                        color: chineseOptions.colorScheme === scheme.id ? scheme.colors[0] : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <div className="flex gap-0.5">
                        {scheme.colors.map(c => (
                          <div key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
                        ))}
                      </div>
                      {scheme.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border width */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">边框粗细</label>
                  <div className="flex gap-1.5">
                    {([1, 2, 3, 4] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setChineseOptions(p => ({ ...p, borderWidth: v }))}
                        className="flex-1 rounded-md py-1 text-xs transition-colors border"
                        style={{
                          background: chineseOptions.borderWidth === v ? `${accent}22` : 'rgba(255,255,255,0.05)',
                          borderColor: chineseOptions.borderWidth === v ? accent : 'rgba(255,255,255,0.1)',
                          color: chineseOptions.borderWidth === v ? accent : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {v}px
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">线条粗细</label>
                  <div className="flex gap-1.5">
                    {([1, 2, 3, 4] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setChineseOptions(p => ({ ...p, lineWidth: v }))}
                        className="flex-1 rounded-md py-1 text-xs transition-colors border"
                        style={{
                          background: chineseOptions.lineWidth === v ? `${accent}22` : 'rgba(255,255,255,0.05)',
                          borderColor: chineseOptions.lineWidth === v ? accent : 'rgba(255,255,255,0.1)',
                          color: chineseOptions.lineWidth === v ? accent : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {v}px
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Anim mode */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/50">动画方式</label>
                <div className="flex gap-2">
                  {(['single', 'grid'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setChineseOptions(p => ({ ...p, animMode: mode }))}
                      className="flex-1 rounded-lg py-2 text-xs transition-colors border"
                      style={{
                        background: chineseOptions.animMode === mode ? `${accent}22` : 'rgba(255,255,255,0.05)',
                        borderColor: chineseOptions.animMode === mode ? accent : 'rgba(255,255,255,0.1)',
                        color: chineseOptions.animMode === mode ? accent : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {mode === 'single' ? '单卡片' : '网格卡片'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-base font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
        style={{
          background: isValid && !isLoading
            ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
            : `${accent}44`,
          color: '#fff',
          boxShadow: isValid && !isLoading ? `0 4px 24px ${accent}50` : 'none',
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            AI 提炼中…
          </>
        ) : (
          <>
            <Sparkles size={18} />
            生成并录制视频
          </>
        )}
      </button>
    </div>
  );
}
