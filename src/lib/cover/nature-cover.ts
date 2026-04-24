import { COVER_W, COVER_H, ICON_CX, ICON_CY, CoverOpts,
  hex2rgbaCover, neonGrad, drawRainbowBorder, registerCover } from './registry';
import { SPOT_PAIRS } from '../engine/nature-spots';

const W = COVER_W, H = COVER_H;
const GOLD = '#fbbf24';

// High-contrast vivid color pairs — no two in a pair should look similar
const CONTRAST_PAIRS: [string, string][] = [
  ['#ff2200', '#00ccff'],  // red     × cyan
  ['#ffbb00', '#7700ff'],  // amber   × purple
  ['#00ff88', '#ff0088'],  // green   × pink
  ['#ff6600', '#0055ff'],  // orange  × blue
  ['#ff00dd', '#00ffaa'],  // magenta × teal
  ['#ffee00', '#0044ff'],  // yellow  × navy
  ['#ff4444', '#44ffcc'],  // coral   × mint
  ['#cc00ff', '#ffcc00'],  // violet  × gold
];

// Doubled circle layout (ICON_R = 300 but we use absolute sizes here)
const LR   = 210;   // circle radius — about double the previous ~126
const SEP  = 280;   // center offset from ICON_CX  (gap = SEP*2 - LR*2 = 140px)

function drawBg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W/2, H*0.6, 0, W/2, H*0.6, W*0.8);
  g.addColorStop(0, 'rgba(0,20,5,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function drawDualSpots(
  ctx: CanvasRenderingContext2D, cx: number, cy: number,
  c1: string, c2: string, coverIndex: number,
) {
  const pair = SPOT_PAIRS[coverIndex % SPOT_PAIRS.length];
  const lx = cx - SEP;
  const rx = cx + SEP;

  // Left circle
  ctx.save();
  ctx.shadowColor = c1; ctx.shadowBlur = 28;
  ctx.strokeStyle = neonGrad(ctx, lx - LR, cy, lx + LR, cy, c1, hex2rgbaCover(c1, 0.4));
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(lx, cy, LR, 0, Math.PI * 2); ctx.stroke();
  const lg = ctx.createRadialGradient(lx, cy, 0, lx, cy, LR);
  lg.addColorStop(0, hex2rgbaCover(c1, 0.18)); lg.addColorStop(1, 'transparent');
  ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, cy, LR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(lx, cy, LR, 0, Math.PI * 2); ctx.clip();
  ctx.globalAlpha = 0.88; pair.left(ctx, lx, cy, LR * 0.6, c1);
  ctx.restore();

  // Right circle
  ctx.save();
  ctx.shadowColor = c2; ctx.shadowBlur = 28;
  ctx.strokeStyle = neonGrad(ctx, rx - LR, cy, rx + LR, cy, c2, hex2rgbaCover(c2, 0.4));
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(rx, cy, LR, 0, Math.PI * 2); ctx.stroke();
  const rg = ctx.createRadialGradient(rx, cy, 0, rx, cy, LR);
  rg.addColorStop(0, hex2rgbaCover(c2, 0.18)); rg.addColorStop(1, 'transparent');
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(rx, cy, LR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(rx, cy, LR, 0, Math.PI * 2); ctx.clip();
  ctx.globalAlpha = 0.88; pair.right(ctx, rx, cy, LR * 0.6, c2);
  ctx.restore();

  // VS label between circles
  ctx.save();
  ctx.shadowColor = GOLD; ctx.shadowBlur = 18;
  ctx.fillStyle = GOLD; ctx.font = `900 52px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('VS', cx, cy);
  ctx.shadowBlur = 0; ctx.restore();

  // Dashed connector
  ctx.save(); ctx.setLineDash([8, 12]);
  ctx.strokeStyle = hex2rgbaCover(GOLD, 0.4); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(lx + LR + 10, cy); ctx.lineTo(rx - LR - 10, cy); ctx.stroke();
  ctx.setLineDash([]); ctx.restore();
}

function drawNature(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { coverIndex } = opts;
  const [c1, c2] = CONTRAST_PAIRS[coverIndex % CONTRAST_PAIRS.length];
  drawBg(ctx);
  drawRainbowBorder(ctx, W, H);
  drawDualSpots(ctx, ICON_CX, ICON_CY, c1, c2, coverIndex);
}

registerCover('nature', drawNature);
