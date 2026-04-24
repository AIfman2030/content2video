import { useState } from 'react';
import { Sparkles, Film, Settings } from 'lucide-react';
import type { StyleType, ChineseOptions, AIOptions, GeneratedContent, GeneratorConfig } from '../types/video';
import StyleSelector from '../components/StyleSelector';
import ContentForm from '../components/ContentForm';
import VideoGenerator from '../components/VideoGenerator';
import ApiKeyDialog from '../components/ApiKeyDialog';
import { extractContent, getStoredApiKey } from '../services/deepseek';

type Step = 'style' | 'form' | 'video';

const STEP_LABELS: Record<Step, string> = {
  style: '选择风格',
  form: '配置内容',
  video: '生成视频',
};

const BG_BY_STYLE: Record<StyleType, string> = {
  chinese: 'linear-gradient(160deg, #0a0a14 0%, #12121f 50%, #1a1a2e 100%)',
  city: 'linear-gradient(160deg, #0d1b2a 0%, #1a2a4a 50%, #0f1c30 100%)',
  aitech: 'linear-gradient(160deg, #080c14 0%, #0f172a 50%, #1e1b4b 100%)',
};

const ACCENT_BY_STYLE: Record<StyleType, string> = {
  chinese: '#e74c3c',
  city: '#f5d87a',
  aitech: '#a855f7',
};

export default function Index() {
  const [step, setStep] = useState<Step>('style');
  const [style, setStyle] = useState<StyleType>('chinese');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<GeneratorConfig | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const accent = ACCENT_BY_STYLE[style];
  const bg = BG_BY_STYLE[style];
  const hasApiKey = !!getStoredApiKey();

  const handleStyleNext = () => setStep('form');

  const handleGenerate = async (
    text: string,
    coverIndex: number,
    chineseOptions: ChineseOptions,
    aiOptions: AIOptions,
  ) => {
    setError('');

    // Check API key first
    if (!getStoredApiKey()) {
      setShowApiKey(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await extractContent(text);
      setContent(result);
      setConfig({ style, coverIndex, text, chineseOptions, aiOptions });
      setStep('video');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '生成失败，请重试';
      if (msg === 'NO_API_KEY') {
        setShowApiKey(true);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setContent(null);
  };

  const steps: Step[] = ['style', 'form', 'video'];

  return (
    <div className="min-h-screen transition-all duration-700" style={{ background: bg }}>
      {/* Header */}
      <header className="border-b border-white/8 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: `${accent}22`, border: `1px solid ${accent}50` }}
            >
              <Film size={16} style={{ color: accent }} />
            </div>
            <span className="text-base font-bold text-white">小福 · 视频生成器</span>
          </div>

          {/* Settings + API key status */}
          <div className="flex items-center gap-3">
            {!hasApiKey && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-amber-400/70">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                未设置 API Key
              </span>
            )}
            <button
              onClick={() => setShowApiKey(true)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
            >
              <Settings size={13} />
              API Key
            </button>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="mx-auto max-w-2xl px-6 pt-6">
        <div className="flex items-center gap-3">
          {steps.filter(s => s !== 'video').map((s, i, arr) => {
            const isActive = s === step;
            const isPast = steps.indexOf(s) < steps.indexOf(step);
            return (
              <div key={s} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all"
                    style={{
                      background: isPast || isActive ? accent : 'rgba(255,255,255,0.1)',
                      color: isPast || isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    className="text-sm transition-colors"
                    style={{ color: isActive ? '#fff' : isPast ? accent : 'rgba(255,255,255,0.3)' }}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div
                    className="h-px w-8 transition-all"
                    style={{ background: isPast ? `${accent}80` : 'rgba(255,255,255,0.1)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
        {step === 'style' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">选择视频风格</h1>
              <p className="text-sm text-white/40">选择一种风格，AI 将按此风格生成动画视频</p>
            </div>

            <StyleSelector selected={style} onChange={s => { setStyle(s); }} />

            <button
              onClick={handleStyleNext}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold transition-all duration-200 active:scale-98"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                color: '#fff',
                boxShadow: `0 4px 24px ${accent}50`,
              }}
            >
              <Sparkles size={18} />
              下一步：配置内容
            </button>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('style')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/50 hover:text-white/70 border border-white/10 transition-colors"
              >
                ← 返回
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">配置内容</h2>
                <p className="text-xs text-white/40">粘贴文章，AI 自动提炼要点</p>
              </div>
            </div>

            <ContentForm
              style={style}
              onGenerate={handleGenerate}
              isLoading={isLoading}
              error={error}
            />
          </div>
        )}
      </main>

      {/* Video Generator overlay */}
      {step === 'video' && content && config && (
        <VideoGenerator
          content={content}
          style={config.style}
          coverIndex={config.coverIndex}
          chineseOptions={config.chineseOptions}
          aiOptions={config.aiOptions}
          onClose={handleClose}
        />
      )}

      {/* API Key dialog */}
      <ApiKeyDialog
        open={showApiKey}
        onClose={() => setShowApiKey(false)}
        accent={accent}
      />
    </div>
  );
}
