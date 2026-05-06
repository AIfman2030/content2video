import { useState } from 'react';
import { Loader2, Sparkles, PencilLine } from 'lucide-react';
import type { StyleType } from '../types/video';

interface Props {
  style: StyleType;
  onGenerate: (text: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
  onManual?: () => void;
}

const ACCENT_BY_STYLE: Record<StyleType, string> = {
  chinese:     '#e74c3c',
  city:        '#f5d87a',
  aitech:      '#a855f7',
  nature:      '#4ade80',
  subtitle:    '#ffd700',
  translation: '#ffe44d',
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

const SUBTITLE_PLACEHOLDER = `直接输入字幕内容，每个序号是一组字幕：

1. 自媒体创作，首先要找准定位
持续输出，积累忠实粉丝
2. 选题是核心，要抓住用户痛点
深挖细节，才能脱颖而出
3. 好内容不够，还要会推广
标题封面，决定点击率的关键
4. 数据驱动创作
分析每条视频，找出爆款规律`;

const TRANSLATION_PLACEHOLDER = `输入一句中文话语，自动生成英文翻译版视频

示例：
当着外人的面贬低你，实际上是在测试你的底线。`;

export default function ContentForm({ style, onGenerate, isLoading, error, onManual }: Props) {
  const [text, setText] = useState('');

  const accent = ACCENT_BY_STYLE[style];
  const charCount = text.length;
  const minChars = style === 'translation' ? 4 : 20;
  const isValid = charCount >= minChars && charCount <= 8000;

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;
    await onGenerate(text);
  };

  return (
    <div className="space-y-4">
      {/* Text area */}
      <div className="space-y-2">
        <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {style === 'subtitle'    ? '输入字幕内容（按序号分组）'
           : style === 'translation' ? '输入一句中文话语'
           : '粘贴文章内容'}
        </label>
        <div className="relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={
              style === 'subtitle'    ? SUBTITLE_PLACEHOLDER
              : style === 'translation' ? TRANSLATION_PLACEHOLDER
              : PLACEHOLDER
            }
            rows={7}
            className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.9)',
              fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif',
              lineHeight: 1.7,
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
          <div
            className="absolute bottom-3 right-3 text-xs tabular-nums"
            style={{ color: charCount > 8000 ? '#f87171' : 'rgba(255,255,255,0.3)' }}
          >
            {charCount} / 8000
          </div>
        </div>
        {charCount > 0 && charCount < minChars && (
          <p className="text-xs" style={{ color: 'rgba(251,191,36,0.8)' }}>
            至少输入 {minChars} 个字符
          </p>
        )}
      </div>

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
        className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
        style={{
          background: isValid && !isLoading
            ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
            : `${accent}44`,
          color: '#fff',
          boxShadow: isValid && !isLoading ? `0 4px 20px ${accent}50` : 'none',
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {style === 'subtitle'    ? '生成中…'
             : style === 'translation' ? '翻译中…'
             : 'AI 提炼中…'}
          </>
        ) : (
          <>
            <Sparkles size={16} />
            {style === 'subtitle'    ? '生成字幕视频'
             : style === 'translation' ? '生成翻译视频'
             : '生成视频'}
          </>
        )}
      </button>

      {/* Manual entry link */}
      {onManual && (
        <button
          onClick={onManual}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs transition-colors hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid transparent' }}
        >
          <PencilLine size={12} />
          手动填写内容
        </button>
      )}
    </div>
  );
}
