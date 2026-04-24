import React, { useEffect, useRef, useState } from 'react';
import { Download, Play, Loader2 } from 'lucide-react';
import { drawCover, COVER_W, COVER_H, DrawCoverParams } from '../lib/coverEngine';

interface CoverPreviewProps extends Omit<DrawCoverParams, 'canvas'> {
  onContinue: () => void;
  onBack: () => void;
}

export const CoverPreview: React.FC<CoverPreviewProps> = ({
  onContinue, onBack, style, coverIndex, content, natureContent, chineseOptions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    setLoading(true);
    setError(null);
    drawCover({ canvas: canvasRef.current, style, coverIndex, content, natureContent: natureContent ?? null, chineseOptions })
      .then(() => setLoading(false))
      .catch(e => { setError('封面生成失败'); setLoading(false); console.error(e); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, coverIndex, content, natureContent]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = `cover-${Date.now()}.png`; a.click();
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-white text-xl font-bold mb-1">封面预览</h3>
        <p className="text-white/50 text-sm">9:16 竖版封面图 · 1080 × 1920 px</p>
      </div>

      {/* Canvas container */}
      <div className="relative" style={{ maxHeight: '65vh', aspectRatio: '9/16' }}>
        <canvas
          ref={canvasRef}
          width={COVER_W}
          height={COVER_H}
          className="rounded-2xl shadow-2xl"
          style={{
            height: '65vh',
            width: 'auto',
            display: loading ? 'none' : 'block',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        />
        {loading && (
          <div
            className="flex items-center justify-center rounded-2xl bg-white/5"
            style={{ height: '65vh', aspectRatio: '9/16' }}
          >
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-red-900/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 w-full max-w-sm">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     bg-white/10 hover:bg-white/20 text-white font-medium
                     transition-all disabled:opacity-40 border border-white/10"
        >
          <Download className="w-4 h-4" />
          下载封面
        </button>
        <button
          onClick={onContinue}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     bg-gradient-to-r from-purple-600 to-blue-600
                     hover:from-purple-500 hover:to-blue-500
                     text-white font-medium transition-all disabled:opacity-40
                     shadow-lg shadow-purple-900/30"
        >
          <Play className="w-4 h-4" />
          生成视频
        </button>
      </div>

      {/* Back link */}
      <button
        onClick={onBack}
        className="text-white/30 hover:text-white/60 text-sm transition-colors"
      >
        ← 返回修改内容
      </button>
    </div>
  );
};
