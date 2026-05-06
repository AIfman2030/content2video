import { useState, type ReactNode } from 'react';
import { Film, Key, Video } from 'lucide-react';
import type { StyleType, ChineseOptions, AIOptions, NatureContent, GeneratedContent, SubtitleOptions, CityOptions } from '../types/video';
import { DEFAULT_SUBTITLE_OPTIONS, DEFAULT_CITY_OPTIONS } from '../types/video';
import StyleSelector from '../components/StyleSelector';
import ContentForm from '../components/ContentForm';
import ContentEditor from '../components/ContentEditor';
import StyleConfigPanel from '../components/StyleConfigPanel';
import VideoGenerator from '../components/VideoGenerator';
import ApiKeyDialog from '../components/ApiKeyDialog';
import StudioCanvas from '../components/StudioCanvas';
import { extractContent, extractNatureContent, translateSentence, getStoredApiKey } from '../services/deepseek';

// ─── Subtitle: parse numbered items from raw text (no AI) ─────────────────────
function parseSubtitleContent(text: string): GeneratedContent {
  const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const groups: string[][] = [];
  let current: string[] = [];

  for (const line of rawLines) {
    if (/^\d{1,2}[.、）)]\s*/.test(line)) {
      if (current.length > 0) groups.push(current);
      const content = line.replace(/^\d{1,2}[.、）)]\s*/, '').trim();
      current = content ? [content] : [];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) groups.push(current);

  if (groups.length === 0) {
    const sentences: string[] = [];
    for (const line of rawLines) {
      const parts = line.split(/((?:[。！？!?]+))/);
      for (let j = 0; j < parts.length; j += 2) {
        const sentence = (parts[j] + (parts[j + 1] ?? '')).trim();
        if (sentence) sentences.push(sentence);
      }
    }
    const items = sentences.length > 0 ? sentences : rawLines;
    for (const item of items) groups.push([item]);
  }

  return {
    title: '字幕视频',
    points: groups.map((lines, i) => ({
      label: `${i + 1}`, short: '', desc: lines.join('\n'), formatted: lines.join(' '),
    })),
  };
}

const BG_BY_STYLE: Record<StyleType, string> = {
  chinese:     'linear-gradient(160deg, #0a0a14 0%, #12121f 50%, #1a1a2e 100%)',
  city:        'linear-gradient(160deg, #0d1b2a 0%, #1a2a4a 50%, #0f1c30 100%)',
  aitech:      'linear-gradient(160deg, #080c14 0%, #0f172a 50%, #1e1b4b 100%)',
  nature:      'linear-gradient(160deg, #060e06 0%, #0d1a0e 50%, #111f12 100%)',
  subtitle:    'linear-gradient(160deg, #020204 0%, #07070f 50%, #0a0a12 100%)',
  translation: 'linear-gradient(160deg, #190404 0%, #3b0c0c 50%, #631414 100%)',
};

const ACCENT_BY_STYLE: Record<StyleType, string> = {
  chinese:     '#e74c3c',
  city:        '#f5d87a',
  aitech:      '#a855f7',
  nature:      '#4ade80',
  subtitle:    '#ffd700',
  translation: '#ffe44d',
};

export default function Index() {
  const [style, setStyle] = useState<StyleType>('chinese');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [natureContent, setNatureContent] = useState<NatureContent | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);

  // ── Live config state (lifted from ContentForm) ───────────────────────────
  const [coverIndex, setCoverIndex] = useState(0);
  const [chineseOptions, setChineseOptions] = useState<ChineseOptions>({
    colorScheme: 'cinnabar', borderWidth: 2, lineWidth: 2, animMode: 'single',
  });
  const [aiOptions, setAiOptions] = useState<AIOptions>({ polyShape: 'hexagon' });
  const [subtitleOptions, setSubtitleOptions] = useState<SubtitleOptions>(DEFAULT_SUBTITLE_OPTIONS);
  const [cityOptions, setCityOptions] = useState<CityOptions>(DEFAULT_CITY_OPTIONS);
  const [accentOverrides, setAccentOverrides] = useState<Partial<Record<StyleType, string>>>({});

  const accent = style === 'subtitle'
    ? subtitleOptions.accentColor
    : (accentOverrides[style] ?? ACCENT_BY_STYLE[style]);
  const bg = BG_BY_STYLE[style];

  // ── When style changes, reset content + config ───────────────────────────
  const handleStyleChange = (s: StyleType) => {
    setStyle(s);
    setContent(null);
    setNatureContent(null);
    setError('');
    setCoverIndex(0);
  };

  // ── Generate ─────────────────────────────────────────────────────────────
  const handleGenerate = async (text: string) => {
    setError('');
    setIsLoading(true);
    try {
      if (style === 'subtitle') {
        const result = parseSubtitleContent(text);
        setContent(result);
        setNatureContent(null);
      } else if (style === 'translation') {
        const englishText = await translateSentence(text.trim());
        const result: GeneratedContent = {
          title: text.trim(),
          points: [{ label: '', short: '', desc: englishText, formatted: text.trim() }],
        };
        setContent(result);
        setNatureContent(null);
      } else if (style === 'nature') {
        const nc = await extractNatureContent(text);
        setNatureContent(nc);
        setContent({ title: nc.title, points: [] });
      } else {
        const result = await extractContent(text);
        setContent(result);
        setNatureContent(null);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '生成失败，请重试';
      if (msg === 'NO_API_KEY') setApiKeyOpen(true);
      else setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Manual entry: create blank content skeleton ─────────────────────────
  const handleManual = () => {
    const blank: GeneratedContent = {
      title: '',
      points: [{ label: '', short: '', desc: '', formatted: '' }],
    };
    setContent(blank);
    setNatureContent(null);
    setError('');
  };

  // ── Live content editing (from ContentEditor) ────────────────────────────
  const handleContentChange = (c: GeneratedContent) => setContent(c);

  return (
    <div className="flex flex-col h-screen overflow-hidden transition-all duration-700" style={{ background: bg }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: `${accent}22`, border: `1px solid ${accent}50` }}>
            <Film size={14} style={{ color: accent }} />
          </div>
          <span className="text-sm font-bold text-white">小福 · 视频生成器</span>
        </div>
        <div className="flex items-center gap-2">
          {content && (
            <button
              onClick={() => setShowRecorder(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: '#fff', boxShadow: `0 2px 12px ${accent}55` }}
            >
              <Video size={12} />录制视频
            </button>
          )}
          <button
            onClick={() => setApiKeyOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:border-white/20"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: getStoredApiKey() ? accent : 'rgba(255,255,255,0.4)' }}
          >
            <Key size={11} />
            {getStoredApiKey() ? 'API Key ✓' : '设置 API Key'}
          </button>
        </div>
      </header>

      {/* ── Studio Body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT: Config Panel (scrollable) */}
        <aside
          className="flex-shrink-0 overflow-y-auto border-r"
          style={{ width: 360, borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.25)' }}
        >
          <div className="p-4 space-y-5">

            {/* ① 风格选择 */}
            <section className="space-y-2">
              <SectionTitle>选择风格</SectionTitle>
              <StyleSelector selected={style} onChange={handleStyleChange} compact />
            </section>

            <Divider />

            {/* ② 风格配置（实时预览） */}
            <section className="space-y-2">
              <SectionTitle>
                风格配置
                <span className="ml-1.5 text-[9px] font-normal px-1.5 py-0.5 rounded-full" style={{ background: `${accent}22`, color: accent }}>
                  实时
                </span>
              </SectionTitle>
              <StyleConfigPanel
                style={style}
                accent={accent}
                coverIndex={coverIndex}
                onCoverIndexChange={setCoverIndex}
                chineseOptions={chineseOptions}
                onChineseOptionsChange={setChineseOptions}
                aiOptions={aiOptions}
                onAiOptionsChange={setAiOptions}
                subtitleOptions={subtitleOptions}
                onSubtitleOptionsChange={setSubtitleOptions}
                cityOptions={cityOptions}
                onCityOptionsChange={setCityOptions}
                accentOverrides={accentOverrides}
                onAccentOverrideChange={(sty, color) =>
                  setAccentOverrides(prev => ({ ...prev, [sty]: color }))
                }
              />
            </section>

            <Divider />

            {/* ③ 内容输入 + 生成 */}
            <section className="space-y-2">
              <SectionTitle>
                内容配置
                {content && (
                  <span className="ml-1.5 text-[9px] font-normal px-1.5 py-0.5 rounded-full" style={{ background: `${accent}22`, color: accent }}>
                    编辑中
                  </span>
                )}
              </SectionTitle>
              {content ? (
                <ContentEditor
                  content={content}
                  style={style}
                  onChange={handleContentChange}
                  onReset={() => { setContent(null); setNatureContent(null); setError(''); }}
                />
              ) : (
                <ContentForm
                  style={style}
                  onGenerate={handleGenerate}
                  isLoading={isLoading}
                  error={error}
                  onManual={handleManual}
                />
              )}
            </section>

          </div>
        </aside>

        {/* RIGHT: Live Preview */}
        <main className="flex-1 min-w-0 flex flex-col items-center justify-center p-6 overflow-hidden">
          <StudioCanvas
            content={content}
            style={style}
            coverIndex={coverIndex}
            chineseOptions={chineseOptions}
            aiOptions={aiOptions}
            natureContent={natureContent}
            accent={accent}
            subtitleOptions={subtitleOptions}
            accentOverride={accentOverrides[style]}
            cityOptions={cityOptions}
          />
        </main>
      </div>

      {/* ── Full-screen Recording Overlay ───────────────────────────────────── */}
      {showRecorder && content && (
        <VideoGenerator
          content={content}
          style={style}
          coverIndex={coverIndex}
          chineseOptions={chineseOptions}
          aiOptions={aiOptions}
          natureContent={natureContent}
          onClose={() => setShowRecorder(false)}
          subtitleOptions={subtitleOptions}
          accentOverride={accentOverrides[style]}
          cityOptions={cityOptions}
        />
      )}

      {/* ── API Key Dialog ───────────────────────────────────────────────────── */}
      <ApiKeyDialog
        open={apiKeyOpen}
        onClose={() => setApiKeyOpen(false)}
        accent={accent}
      />
    </div>
  );
}

// ─── Micro components ──────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {children}
      </p>
    </div>
  );
}

function Divider() {
  return <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />;
}
