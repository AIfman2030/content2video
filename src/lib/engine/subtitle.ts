// subtitle.ts – Movie-caption style: text slides up from bottom, per-slide bright colours,
//              particle sparkle background, "小福分享舍" top-left account tag.

import type { GeneratedContent } from '../../types/video';
import { CW, CH, clamp, easeOutCubic, seededRandom, wrapText } from './helpers';

// ─── Timing constants ─────────────────────────────────────────────────────────
const PRE_ROLL    = 800;   // account name fades in
const SLIDE_ENTER = 600;   // text slides up from +80 px
const SLIDE_HOLD  = 3000;  // hold visible
const SLIDE_EXIT  = 450;   // fade out
export const SLIDE_DUR = SLIDE_ENTER + SLIDE_HOLD + SLIDE_EXIT; // 4050 ms

/** Total animation duration for n slides (ms). */
export function subtitleTotalMs(n: number): number {
  return PRE_ROLL + n * SLIDE_DUR + 1600; // 1600 ms post-roll
}

// ─── Colour palettes ──────────────────────────────────────────────────────────
// Label colour → complementary short colour
const LABEL_COLORS = ['#ffd700', '#ff4d4d', '#00ff88', '#00d4ff', '#ff88ff', '#ff9944'];
const SHORT_COLORS = ['#00d4ff', '#ffd700', '#ff9944', '#00ff88', '#ff4d4d', '#a78bfa'];

// ─── Particle system ──────────────────────────────────────────────────────────
export interface SubParticle {
  x0: number; y0: number;
  vx: number; vy: number;   // px/s
  r: number;
  phase: number; freq: number;
  color: string;
}

const P_COLORS = [
  '#ffd70080', '#ff4d4d80', '#00ff8880', '#00d4ff80',
  '#ff88ff80', '#ffffff99', '#ffffff80', '#ffffffaa',
];

export function initSubtitleParticles(rand: () => number): SubParticle[] {
  return Array.from({ length: 95 }, () => ({
    x0:    rand() * CW,
    y0:    rand() * CH,
    vx:    (rand() - 0.5) * 22,
    vy:    (rand() - 0.5) * 22,
    r:     1.2 + rand() * 3.2,
    phase: rand() * Math.PI * 2,
    freq:  0.4 + rand() * 1.8,
    color: P_COLORS[Math.floor(rand() * P_COLORS.length)],
  }));
}

// ─── Internal helpers ─────────────────────────────────────────────────────────
function drawBg(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createRadialGradient(CW / 2, CH / 2, 0, CW / 2, CH / 2, CH * 0.75);
  grad.addColorStop(0, '#0a0a12');
  grad.addColorStop(1, '#020204');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  ps: SubParticle[],
  elapsed: number,
) {
  const t = elapsed / 1000;
  for (const p of ps) {
    const x = ((p.x0 + p.vx * t) % CW + CW) % CW;
    const y = ((p.y0 + p.vy * t) % CH + CH) % CH;
    const a = 0.08 + 0.5 * (0.5 + 0.5 * Math.sin(t * p.freq + p.phase));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = p.r * 6;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(x, y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Subtle scan-line / horizontal grid overlay for atmosphere. */
function drawScanlines(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.025;
  ctx.fillStyle   = '#ffffff';
  for (let y = 0; y < CH; y += 6) {
    ctx.fillRect(0, y, CW, 1);
  }
  ctx.restore();
}

function drawAccountName(ctx: CanvasRenderingContext2D, elapsed: number) {
  const a = clamp(elapsed / 600, 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;

  // Gold accent bar
  ctx.fillStyle   = '#ffd700';
  ctx.shadowColor = '#ffd70090';
  ctx.shadowBlur  = 10;
  ctx.fillRect(52, 46, 5, 58);
  ctx.shadowBlur  = 0;

  // Account text
  ctx.font         = `700 42px "Noto Sans SC", sans-serif`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#ffffff';
  ctx.shadowColor  = '#ffd70060';
  ctx.shadowBlur   = 16;
  ctx.fillText('小福分享舍', 68, 75);
  ctx.shadowBlur  = 0;

  // Tiny subtitle below
  ctx.font         = `400 24px "Noto Sans SC", sans-serif`;
  ctx.fillStyle    = 'rgba(255,255,255,0.45)';
  ctx.fillText('知识分享 · 每日更新', 68, 106);

  ctx.restore();
}

// Rounded rect helper (draws path only – caller fills/strokes)
function rrPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

// ─── Draw one subtitle slide ──────────────────────────────────────────────────
function drawSlide(
  ctx: CanvasRenderingContext2D,
  te: number,        // elapsed time within this slide
  label: string,
  short: string,
  desc: string,
  idx: number,
) {
  if (te <= 0 || te >= SLIDE_DUR) return;

  // Compute alpha + y-offset
  let alpha: number;
  let yOff: number;

  if (te <= SLIDE_ENTER) {
    const t = easeOutCubic(te / SLIDE_ENTER);
    alpha = clamp(te / 280, 0, 1);
    yOff  = (1 - t) * 80;
  } else if (te <= SLIDE_ENTER + SLIDE_HOLD) {
    alpha = 1;
    yOff  = 0;
  } else {
    alpha = clamp(1 - (te - SLIDE_ENTER - SLIDE_HOLD) / SLIDE_EXIT, 0, 1);
    yOff  = 0;
  }
  if (alpha <= 0) return;

  const lColor = LABEL_COLORS[idx % LABEL_COLORS.length];
  const sColor = SHORT_COLORS[idx % SHORT_COLORS.length];

  const lFsz  = 92;
  const sFsz  = 68;
  const dFsz  = 52;
  const lgap  = 16;

  // Wrap desc to ≤ 3 lines at a comfortable width
  ctx.font = `400 ${dFsz}px "Noto Sans SC", sans-serif`;
  const dLines = wrapText(ctx, desc, 1080).slice(0, 3);

  // Block total height
  const blockH = lFsz + lgap + sFsz + lgap + dLines.length * (dFsz + 10);

  // Block centre Y = lower third
  const centerY  = CH * 0.70;
  const blockTopY = centerY - blockH / 2 + yOff;

  // Backdrop
  const bPadX = 80, bPadY = 36;
  const bW    = 1280;
  const bH    = blockH + bPadY * 2;
  const bX    = CW / 2 - bW / 2;
  const bY    = blockTopY - bPadY;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Dark glass backdrop
  rrPath(ctx, bX, bY, bW, bH, 24);
  ctx.fillStyle = 'rgba(2, 2, 10, 0.80)';
  ctx.fill();

  // Coloured left accent bar
  ctx.fillStyle   = lColor;
  ctx.shadowColor = lColor;
  ctx.shadowBlur  = 14;
  ctx.fillRect(bX + 24, bY + 18, 5, bH - 36);
  ctx.shadowBlur  = 0;

  // Subtle top highlight line
  ctx.strokeStyle = `rgba(255,255,255,0.06)`;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(bX + 50, bY + 1);
  ctx.lineTo(bX + bW - 50, bY + 1);
  ctx.stroke();

  // Bottom separator line
  ctx.strokeStyle = `${lColor}50`;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(bX + 55, bY + bH - 18);
  ctx.lineTo(bX + bW - 55, bY + bH - 18);
  ctx.stroke();

  // ── label ──────────────────────────────────────────────────────────────
  let y = blockTopY;
  ctx.font         = `700 ${lFsz}px "Noto Sans SC", sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle    = lColor;
  ctx.shadowColor  = lColor;
  ctx.shadowBlur   = 28;
  ctx.fillText(label, CW / 2, y);
  ctx.shadowBlur   = 0;
  y += lFsz + lgap;

  // ── short ──────────────────────────────────────────────────────────────
  ctx.font         = `600 ${sFsz}px "Noto Sans SC", sans-serif`;
  ctx.fillStyle    = sColor;
  ctx.shadowColor  = sColor;
  ctx.shadowBlur   = 18;
  ctx.fillText(short, CW / 2, y);
  ctx.shadowBlur   = 0;
  y += sFsz + lgap;

  // ── desc lines ─────────────────────────────────────────────────────────
  ctx.font      = `400 ${dFsz}px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.91)';
  for (const line of dLines) {
    ctx.fillText(line, CW / 2, y);
    y += dFsz + 10;
  }

  // Slide index badge (bottom-right of backdrop)
  const badgeR = 28;
  const bdX = bX + bW - badgeR - 24;
  const bdY = bY + bH - badgeR - 18;
  ctx.beginPath();
  ctx.arc(bdX, bdY, badgeR, 0, Math.PI * 2);
  ctx.fillStyle = `${lColor}30`;
  ctx.fill();
  ctx.strokeStyle = `${lColor}90`;
  ctx.lineWidth   = 2;
  ctx.stroke();
  ctx.font         = `700 26px "Noto Sans SC", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = lColor;
  ctx.fillText(`${idx + 1}`, bdX, bdY);

  ctx.restore();
}

// ─── Main draw entry ──────────────────────────────────────────────────────────
export function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  particles: SubParticle[],
) {
  drawBg(ctx);
  drawParticles(ctx, particles, elapsed);
  drawScanlines(ctx);
  drawAccountName(ctx, elapsed);

  const n = content.points.length;
  for (let i = 0; i < n; i++) {
    const te = elapsed - (PRE_ROLL + i * SLIDE_DUR);
    const pt = content.points[i];
    drawSlide(ctx, te, pt.label, pt.short, pt.desc, i);
  }

  // Post-roll: fade to black
  const fadeStart = PRE_ROLL + n * SLIDE_DUR;
  if (elapsed > fadeStart) {
    const a = clamp((elapsed - fadeStart) / 1600, 0, 1);
    ctx.fillStyle = `rgba(0,0,0,${a * 0.96})`;
    ctx.fillRect(0, 0, CW, CH);
  }
}
