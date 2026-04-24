import { COVER_W, COVER_H, CoverOpts, hex2rgbaCover, drawRoundRect, registerCover } from './registry';
import { SPOT_PAIRS } from '../engine/nature-spots';

const W = COVER_W, H = COVER_H;
const GOLD = '#fbbf24';

function drawNatureBg(ctx: CanvasRenderingContext2D, accent: string) {
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#040a04'); bg.addColorStop(0.4, '#0a1a0a'); bg.addColorStop(1, '#040a04');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // Subtle mountain silhouette at bottom
  ctx.save(); ctx.fillStyle = hex2rgbaCover(accent, 0.06);
  ctx.beginPath(); ctx.moveTo(0, H);
  const pts = [0.05,0.11,0.08,0.16,0.1,0.18,0.07,0.15,0.06,0.12,0.05];
  pts.forEach((h, i) => ctx.lineTo((i / (pts.length - 1)) * W, H - h * H * 0.28));
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  ctx.restore();
  // Center vertical glow
  const vg = ctx.createLinearGradient(0, 0, 0, H);
  vg.addColorStop(0, hex2rgbaCover(accent, 0.08)); vg.addColorStop(0.5, 'transparent'); vg.addColorStop(1, 'transparent');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

function drawCirclePair(
  ctx: CanvasRenderingContext2D,
  coverIndex: number, accent: string, accent2: string,
) {
  const pair = SPOT_PAIRS[coverIndex % SPOT_PAIRS.length];
  const r = 200, lx = 260, rx = W - 260, cy = 620;
  // Left circle
  ctx.save(); ctx.strokeStyle = hex2rgbaCover(accent, 0.5); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(lx, cy, r, 0, Math.PI * 2); ctx.stroke();
  const lg = ctx.createRadialGradient(lx, cy, 0, lx, cy, r);
  lg.addColorStop(0, hex2rgbaCover(accent, 0.15)); lg.addColorStop(1, 'transparent');
  ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(lx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.globalAlpha = 0.8; pair.left(ctx, lx, cy, 75, accent);
  ctx.restore();
  // Right circle
  ctx.save(); ctx.strokeStyle = hex2rgbaCover(accent2, 0.5); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(rx, cy, r, 0, Math.PI * 2); ctx.stroke();
  const rg = ctx.createRadialGradient(rx, cy, 0, rx, cy, r);
  rg.addColorStop(0, hex2rgbaCover(accent2, 0.15)); rg.addColorStop(1, 'transparent');
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(rx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(rx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.globalAlpha = 0.8; pair.right(ctx, rx, cy, 75, accent2);
  ctx.restore();
  // Center VS / OR dashed connector
  ctx.save(); ctx.setLineDash([4, 8]);
  ctx.strokeStyle = hex2rgbaCover(GOLD, 0.4); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(lx + r + 4, cy); ctx.lineTo(rx - r - 4, cy); ctx.stroke();
  ctx.setLineDash([]); ctx.restore();
  ctx.save(); ctx.font = `700 32px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = GOLD; ctx.fillText('VS', W / 2, cy);
  ctx.restore();
}

function drawNatureItems(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { items = [], commonItems = [], accent, accent2 } = opts;
  const startY = 1050;
  const leftList = items.slice(0, 3);
  const rightList = commonItems.slice(0, 3);
  // Two columns
  const colW = (W - 160) / 2;
  // Left items
  leftList.forEach((item, i) => {
    const y = startY + i * 88;
    ctx.save(); ctx.fillStyle = hex2rgbaCover(accent, 0.12);
    drawRoundRect(ctx, 60, y - 26, colW - 20, 62, 8); ctx.fill();
    ctx.strokeStyle = hex2rgbaCover(accent, 0.35); ctx.lineWidth = 1;
    drawRoundRect(ctx, 60, y - 26, colW - 20, 62, 8); ctx.stroke();
    ctx.font = `600 34px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = hex2rgbaCover(accent, 1); ctx.fillText(item, 60 + (colW - 20) / 2, y + 5);
    ctx.restore();
  });
  // Right items
  rightList.forEach((item, i) => {
    const y = startY + i * 88;
    const rx = 60 + colW + 40;
    ctx.save(); ctx.fillStyle = hex2rgbaCover(accent2, 0.12);
    drawRoundRect(ctx, rx, y - 26, colW - 20, 62, 8); ctx.fill();
    ctx.strokeStyle = hex2rgbaCover(accent2, 0.35); ctx.lineWidth = 1;
    drawRoundRect(ctx, rx, y - 26, colW - 20, 62, 8); ctx.stroke();
    ctx.font = `600 34px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = hex2rgbaCover(accent2, 1); ctx.fillText(item, rx + (colW - 20) / 2, y + 5);
    ctx.restore();
  });
  // If no items yet show placeholder
  if (leftList.length === 0 && rightList.length === 0) {
    ctx.save(); ctx.globalAlpha = 0.3; ctx.font = `400 32px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    ctx.fillText('（内容对比展示区）', W / 2, startY + 44); ctx.restore();
  }
}

function drawNature(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { title, subtitle, accent, accent2, coverIndex } = opts;
  drawNatureBg(ctx, accent);
  // Top label
  ctx.save(); ctx.fillStyle = hex2rgbaCover(accent, 0.12); ctx.fillRect(0, 0, W, 100);
  ctx.font = `400 30px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = hex2rgbaCover(accent, 0.9); ctx.fillText('山 川 河 海 · 对 比 卡', W / 2, 50);
  ctx.restore();
  drawCirclePair(ctx, coverIndex, accent, accent2);
  // Title
  ctx.save(); ctx.font = `900 80px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = accent; ctx.shadowBlur = 28; ctx.fillStyle = '#fff'; ctx.fillText(title, W / 2, 910);
  ctx.shadowBlur = 0; ctx.restore();
  if (subtitle) {
    ctx.save(); ctx.font = `400 36px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = hex2rgbaCover(GOLD, 0.9); ctx.fillText(subtitle, W / 2, 975); ctx.restore();
  }
  const dg = ctx.createLinearGradient(60, 0, W - 60, 0);
  dg.addColorStop(0, 'transparent'); dg.addColorStop(0.4, hex2rgbaCover(accent, 0.8));
  dg.addColorStop(0.6, hex2rgbaCover(accent2, 0.8)); dg.addColorStop(1, 'transparent');
  ctx.save(); ctx.strokeStyle = dg; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, subtitle ? 1020 : 980); ctx.lineTo(W - 60, subtitle ? 1020 : 980); ctx.stroke(); ctx.restore();
  drawNatureItems(ctx, opts);
  ctx.save(); ctx.globalAlpha = 0.2; ctx.font = `300 26px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = accent;
  ctx.fillText('点击查看完整视频', W / 2, H - 60); ctx.restore();
}

registerCover('nature', drawNature);
