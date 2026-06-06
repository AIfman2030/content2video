/**
 * keyword-cover.ts
 * Cover for the "关键词排列" style.
 * Dark background + large center keyword + floating mini keywords + geometric accent.
 */

import { registerCover, type CoverOpts } from './registry';

type DC = CanvasRenderingContext2D;
const CW = 1920, CH = 1080, CX = CW / 2, CY = CH / 2;

function sf(s: number) { return (((Math.sin(s * 0.9999) * 43758.5) % 1) + 1) % 1; }

async function drawKeywordCover(ctx: DC, opts: CoverOpts) {
  const { accent, accent2 = '#ffffff', title = '', items = [] } = opts;

  // ── Background ──────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, CW, CH);
  bg.addColorStop(0,   '#030510');
  bg.addColorStop(0.5, '#080c1a');
  bg.addColorStop(1,   '#040508');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);

  // ── Subtle radial glow from center ──────────────────────────────────────────
  const glow = ctx.createRadialGradient(CX, CY, 0, CX, CY, 700);
  glow.addColorStop(0,   `${accent}22`);
  glow.addColorStop(0.5, `${accent}08`);
  glow.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CW, CH);

  // ── Floating mini-keyword decorations ───────────────────────────────────────
  const decorWords = items.length > 0
    ? items
    : ['专注', '成长', '价值', '影响', '创造', '突破', '深度', '系统', '持续', '坚持'];

  ctx.save();
  for (let i = 0; i < Math.min(decorWords.length, 16); i++) {
    const angle  = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const radius = 300 + sf(i * 3.1) * 200;
    const x      = CX + Math.cos(angle) * radius * 1.55;
    const y      = CY + Math.sin(angle) * radius;
    const fsz    = 28 + Math.round(sf(i * 2.7) * 28);
    const alpha  = 0.12 + sf(i * 4.3) * 0.18;
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${fsz}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = i % 2 === 0 ? accent : accent2;
    ctx.fillText(decorWords[i % decorWords.length], x, y);
  }
  ctx.restore();

  // ── Concentric dashed circles ────────────────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = accent; ctx.setLineDash([6, 14]);
  for (let ring = 1; ring <= 3; ring++) {
    ctx.globalAlpha = 0.08 + ring * 0.03;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(CX, CY, ring * 220, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.setLineDash([]); ctx.restore();

  // ── Center keyword (title IS the center theme word) ──────────────────────────
  const centerWord = title || (items[0] ?? '词云');
  ctx.save();
  ctx.font = `800 180px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = accent; ctx.shadowBlur = 80;
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.9;
  ctx.fillText(centerWord, CX, CY);
  ctx.shadowBlur = 0;
  ctx.restore();

  // ── Title text at bottom ─────────────────────────────────────────────────────
  if (title) {
    ctx.save();
    ctx.font = `600 52px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.globalAlpha = 0.8;
    ctx.fillText(title, CX, CH - 110);
    ctx.restore();
  }
}

registerCover('keyword', drawKeywordCover);
