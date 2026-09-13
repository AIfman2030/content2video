import {
  COVER_H, COVER_W, type CoverOpts, drawRainbowBorder,
  neonGrad, registerCover, seededRandCover,
} from './registry';

const W = COVER_W;
const H = COVER_H;
const FONT = '"Noto Sans SC", "PingFang SC", sans-serif';
const PALETTES: Array<[string, string]> = [
  ['#00d9ff', '#8b00ff'], ['#ff2fb3', '#ff9d00'], ['#65ff7b', '#00a8ff'],
  ['#ffe13b', '#ff3d77'], ['#8a7dff', '#00ffd5'], ['#ff6838', '#b8ff36'],
  ['#37c8ff', '#ff45e6'], ['#f6ff45', '#00dca8'],
];

function splitTitle(ctx: CanvasRenderingContext2D, title: string): string[] {
  const chars = Array.from(title.trim() || '困住普通人的四大陷阱');
  const lines: string[] = [];
  let line = '';
  for (const char of chars) {
    const next = line + char;
    if (line && ctx.measureText(next).width > 850) {
      lines.push(line);
      line = char;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string, c1: string, c2: string) {
  let size = 112;
  let lines: string[] = [];
  while (size >= 72) {
    ctx.font = `900 ${size}px ${FONT}`;
    lines = splitTitle(ctx, title);
    if (lines.length <= 2) break;
    size -= 6;
  }
  const y = 150;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.shadowColor = c1;
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#fff';
  lines.forEach((line, index) => ctx.fillText(line, W / 2, y + index * (size + 22)));
  ctx.shadowBlur = 0;
  const ruleY = y + lines.length * (size + 22) + 20;
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
