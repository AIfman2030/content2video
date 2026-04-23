import { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, ExternalLink, Check } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/deepseek';

interface Props {
  open: boolean;
  onClose: () => void;
  accent?: string;
}

export default function ApiKeyDialog({ open, onClose, accent = '#a855f7' }: Props) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(getStoredApiKey());
      setSaved(false);
      setShow(false);
    }
  }, [open]);

  const handleSave = () => {
    setStoredApiKey(value);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  const handleClear = () => {
    setValue('');
    setStoredApiKey('');
  };

  if (!open) return null;

  const hasKey = value.trim().length > 0;
  const storedKey = getStoredApiKey();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #0f1120, #18162a)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/50 hover:bg-white/15 hover:text-white transition-colors"
        >
          <X size={15} />
        </button>

        {/* Icon + title */}
        <div className="mb-5 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: `${accent}22`, border: `1px solid ${accent}40` }}
          >
            <Key size={18} style={{ color: accent }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">DeepSeek API Key</h2>
            <p className="text-xs text-white/40">仅存储在本地浏览器，不上传服务器</p>
          </div>
        </div>

        {/* Input */}
        <div className="relative mb-3">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors font-mono"
          />
          <button
            onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Status */}
        {storedKey && !saved && (
          <p className="mb-3 text-xs text-green-400/70 flex items-center gap-1.5">
            <Check size={12} />
            已设置 API Key（{storedKey.slice(0, 6)}…{storedKey.slice(-4)}）
          </p>
        )}

        {/* Get key link */}
        <a
          href="https://platform.deepseek.com/api_keys"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-5 flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: accent }}
        >
          <ExternalLink size={12} />
          前往 DeepSeek 获取 API Key
        </a>

        {/* Buttons */}
        <div className="flex gap-2">
          {storedKey && (
            <button
              onClick={handleClear}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              清除
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasKey}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-30"
            style={{
              background: hasKey ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : accent,
              color: '#fff',
              boxShadow: hasKey ? `0 4px 16px ${accent}40` : 'none',
            }}
          >
            {saved ? <><Check size={15} /> 已保存</> : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
