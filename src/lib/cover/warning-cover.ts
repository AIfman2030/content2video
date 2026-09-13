import {
  COVER_H, COVER_W, type CoverOpts, drawRainbowBorder,
  neonGrad, registerCover, seededRandCover,
} from './registry';
import { parseWarningTitle } from '../warningTitle';

const W = COVER_W;
const H = COVER_H;
const FONT = '"Noto Sans SC", "PingFang SC", sans-serif';
const PALETTES: Array<[string, string]> = [
  ['#00d9ff', '#8b00ff'], ['#ff2fb3', '#ff9d00'], ['#65ff7b', '#00a8ff'],
  ['#ffe13b', '#ff3d77'], ['#8a7dff', '#00ffd5'], ['#ff6838', '#b8ff36'],
  ['#37c8ff', '#ff45e6'], ['#f6ff45', '#00dca8'],
];

function drawTitle(ctx: CanvasRenderingContext2D, title: string, c1: string, c2: string) {
  const { kicker, headline } = parseWarningTitle(title);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = c1;
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#fff';
  ctx.font = `900 122px ${FONT}`;
  ctx.fillText(kicker, W / 2, 135);
  ctx.shadowColor = '#f4dc70';
  ctx.fillStyle = '#f4dc70';
  ctx.font = `900 88px ${FONT}`;
  ctx.fillText(headline, W / 2, 300);
  ctx.shadowBlur = 0;
  const ruleY = 430;
  ctx.strokeStyle = neonGrad(ctx, 170, ruleY, W - 170, ruleY, c1, c2);
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(170, ruleY); ctx.lineTo(W - 170, ruleY); ctx.stroke();
  ctx.restore();
}

function polygon(ctx: CanvasRenderingContext2D, sides: number, radius: number, rotation: number) {
  ctx.beginPath();
  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + index * Math.PI * 2 / sides;
    const x = W / 2 + Math.cos(angle) * radius;
    const y = H * 0.69 + Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawPattern(ctx: CanvasRenderingContext2D, coverIndex: number, c1: string, c2: string) {
  const rand = seededRandCover(coverIndex * 7919 + 41);
  const sides = [3, 4, 5, 6, 8][coverIndex % 5];
  const rotation = rand() * Math.PI;
  const cy = H * 0.69;

  const glow = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, 390);
  glow.addColorStop(0, `${c1}38`);
  glow.addColorStop(0.48, `${c2}18`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow; ctx.fillRect(90, cy - 410, W - 180, 820);

  ctx.save();
  ctx.shadowColor = c1; ctx.shadowBlur = 38;
  ctx.strokeStyle = neonGrad(ctx, 220, cy, 860, cy, c1, c2);
  ctx.lineWidth = 9;
  polygon(ctx, sides, 230, rotation); ctx.stroke();
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 4;
  polygon(ctx, sides, 160, -rotation * 0.7); ctx.stroke();
  ctx.globalAlpha = 0.46;
  ctx.beginPath(); ctx.arc(W / 2, cy, 300, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  for (let index = 0; index < sides * 2; index += 1) {
    const angle = rotation + index * Math.PI / sides;
    const radius = index % 2 ? 325 : 300;
    const x = W / 2 + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    ctx.save();
    ctx.shadowColor = index % 2 ? c2 : c1; ctx.shadowBlur = 28;
    ctx.fillStyle = index % 2 ? c2 : c1;
    ctx.beginPath(); ctx.arc(x, y, 12 + (index % 3) * 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = c1;
  ctx.beginPath(); ctx.arc(W / 2, cy, 22, 0, Math.PI * 2); ctx.fill();
}

function drawWarningCover(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const palette = PALETTES[((opts.coverIndex % PALETTES.length) + PALETTES.length) % PALETTES.length];
  const [c1, c2] = opts.coverIndex % 2 ? palette : [palette[1], palette[0]];
  ctx.fillStyle = '#020205'; ctx.fillRect(0, 0, W, H);
  drawRainbowBorder(ctx, W, H, 14, 14, 15, 34);
  drawTitle(ctx, opts.title, c1, c2);
  drawPattern(ctx, opts.coverIndex, c1, c2);
}

registerCover('warning', drawWarningCover);
