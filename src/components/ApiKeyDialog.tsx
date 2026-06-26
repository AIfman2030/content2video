import { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, ExternalLink, Check } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/deepseek';
import { getStoredArkKey, setStoredArkKey } from '../services/ark';

interface Props {
  open: boolean;
  onClose: () => void;
  accent?: string;
}

interface FieldProps {
  label: string;
  sub: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  show: boolean;
  onToggleShow: () => void;
  stored: string;
  onClear: () => void;
  link: string;
  linkLabel: string;
  accent: string;
}

function KeyField({ label, sub, value, onChange, placeholder, show, onToggleShow, stored, onClear, link, linkLabel, accent }: FieldProps) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-white/40">{sub}</p>
        </div>
        {stored && (
          <button onClick={onClear} className="text-xs text-white/30 hover:text-white/60 transition-colors">清除</button>
        )}
      </div>

      <div className="relative mb-2">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors font-mono"
        />
        <button
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {stored && (
        <p className="mb-1 text-xs text-green-400/70 flex items-center gap-1.5">
          <Check size={12} />
          已设置（{stored.slice(0, 8)}…{stored.slice(-4)}）
        </p>
      )}

      <a href={link} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: accent }}>
        <ExternalLink size={11} />{linkLabel}
      </a>
    </div>
  );
}

export default function ApiKeyDialog({ open, onClose, accent = '#a855f7' }: Props) {
  const [deepseekVal, setDsVal] = useState('');
  const [arkVal, setArkVal] = useState('');
  const [showDs, setShowDs] = useState(false);
  const [showArk, setShowArk] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setDsVal(getStoredApiKey());
      setArkVal(getStoredArkKey());
      setSaved(false);
      setShowDs(false);
      setShowArk(false);
    }
  }, [open]);

  const handleSave = () => {
    if (deepseekVal.trim()) setStoredApiKey(deepseekVal.trim());
    if (arkVal.trim()) setStoredArkKey(arkVal.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  if (!open) return null;

  const hasAny = deepseekVal.trim().length > 0 || arkVal.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #0f1120, #18162a)' }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/50 hover:bg-white/15 hover:text-white transition-colors"
        >
          <X size={15} />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${accent}22`, border: `1px solid ${accent}40` }}>
            <Key size={18} style={{ color: accent }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">API Key 配置</h2>
            <p className="text-xs text-white/40">仅存储在本地浏览器，不上传服务器</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-4 h-px bg-white/8" />

        <KeyField
          label="DeepSeek API Key"
          sub="用于文案提炼 / 字幕脚本生成"
          value={deepseekVal}
          onChange={setDsVal}
          placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
          show={showDs}
          onToggleShow={() => setShowDs(v => !v)}
          stored={getStoredApiKey()}
          onClear={() => { setDsVal(''); setStoredApiKey(''); }}
          link="https://platform.deepseek.com/api_keys"
          linkLabel="前往 DeepSeek 获取 API Key"
          accent={accent}
        />

        <KeyField
          label="Ark API Key（豆包 / 即梦）"
          sub="用于漫画字幕风格生成 AI 插画"
          value={arkVal}
          onChange={setArkVal}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          show={showArk}
          onToggleShow={() => setShowArk(v => !v)}
          stored={getStoredArkKey()}
          onClear={() => { setArkVal(''); setStoredArkKey(''); }}
          link="https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey"
          linkLabel="前往火山方舟获取 API Key"
          accent={accent}
        />

        <button
          onClick={handleSave}
          disabled={!hasAny}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-30"
          style={{
            background: hasAny ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : accent,
            color: '#fff',
            boxShadow: hasAny ? `0 4px 16px ${accent}40` : 'none',
          }}
        >
          {saved ? <><Check size={15} /> 已保存</> : '保存'}
        </button>
      </div>
    </div>
  );
}
