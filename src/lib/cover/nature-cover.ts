import { COVER_W, COVER_H, ICON_CX, ICON_CY, ICON_R, CoverOpts,
  hex2rgbaCover, neonGrad, drawRainbowBorder, registerCover } from './registry';
import { SPOT_PAIRS } from '../engine/nature-spots';

const W = COVER_W, H = COVER_H;
const GOLD = '#fbbf24';

function drawBg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  // Subtle deep green tint
  const g = ctx.createRadialGradient(W/2, H*0.6, 0, W/2, H*0.6, W*0.8);
  g.addColorStop(0, 'rgba(0,20,5,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function drawDualSpots(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  c1: string, c2: string, coverIndex: number,
) {
  const pair = SPOT_PAIRS[coverIndex % SPOT_PAIRS.length];
  const lr = r * 0.42;   // circle radius
  const lx = cx - r*0.54; // left center X
  const rx = cx + r*0.54; // right center X

  // Left circle
  ctx.save();
  ctx.shadowColor = c1; ctx.shadowBlur = 22;
  ctx.strokeStyle = neonGrad(ctx, lx-lr, cy, lx+lr, cy, c1, hex2rgbaCover(c1, 0.4));
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(lx, cy, lr, 0, Math.PI*2); ctx.stroke();
  const lg = ctx.createRadialGradient(lx, cy, 0, lx, cy, lr);
  lg.addColorStop(0, hex2rgbaCover(c1, 0.15)); lg.addColorStop(1, 'transparent');
  ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, cy, lr, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(lx, cy, lr, 0, Math.PI*2); ctx.clip();
  ctx.globalAlpha = 0.85; pair.left(ctx, lx, cy, lr * 0.6, c1);
  ctx.restore();

  // Right circle
  ctx.save();
  ctx.shadowColor = c2; ctx.shadowBlur = 22;
  ctx.strokeStyle = neonGrad(ctx, rx-lr, cy, rx+lr, cy, c2, hex2rgbaCover(c2, 0.4));
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(rx, cy, lr, 0, Math.PI*2); ctx.stroke();
  const rg = ctx.createRadialGradient(rx, cy, 0, rx, cy, lr);
  rg.addColorStop(0, hex2rgbaCover(c2, 0.15)); rg.addColorStop(1, 'transparent');
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(rx, cy, lr, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(rx, cy, lr, 0, Math.PI*2); ctx.clip();
  ctx.globalAlpha = 0.85; pair.right(ctx, rx, cy, lr * 0.6, c2);
  ctx.restore();

  // VS label between circles
  ctx.save();
  ctx.shadowColor = GOLD; ctx.shadowBlur = 14;
  ctx.fillStyle = GOLD; ctx.font = `700 ${r*0.14}px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('VS', cx, cy);
  ctx.shadowBlur = 0; ctx.restore();

  // Dashed connector
  ctx.save(); ctx.setLineDash([6, 10]);
  ctx.strokeStyle = hex2rgbaCover(GOLD, 0.35); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(lx + lr + 8, cy); ctx.lineTo(rx - lr - 8, cy); ctx.stroke();
  ctx.setLineDash([]); ctx.restore();
}

function drawNature(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { accent, accent2, coverIndex } = opts;
  drawBg(ctx);
  drawRainbowBorder(ctx, W, H);
  drawDualSpots(ctx, ICON_CX, ICON_CY, ICON_R, accent, accent2, coverIndex);
}

registerCover('nature', drawNature);
