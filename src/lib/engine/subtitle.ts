// subtitle.ts – Movie-caption style: lines appear one-by-one, uniform font size,
//              particle sparkle background, "小福分享舍" top-left account tag.

import type { GeneratedContent } from '../../types/video';
import { CW, CH, clamp, easeOutCubic, seededRandom, wrapText } from './helpers';

// ─── Timing ───────────────────────────────────────────────────────────────────
const PRE_ROLL         = 800;
const LINE_STAGGER     = 380;  // ms between each successive line entering
const LINE_ENTER       = 440;  // ms for each line to slide up
const LINE_YOFF        = 72;   // px: starting offset below final position
export const SLIDE_DUR = 5200; // fixed per-slide (ms)
const SLIDE_EXIT_START = SLIDE_DUR - 540;
const SLIDE_EXIT       = 540;
const POST_ROLL        = 1600;

export function subtitleTotalMs(n: number): number {
  return PRE_ROLL + n * SLIDE_DUR + POST_ROLL;
}

// ─── Colours (one per line, cycling) ─────────────────────────────────────────
const LINE_COLORS = ['#ffd700', '#ff4d4d', '#00ff88', '#00d4ff', '#ff88ff', '#ff9944', '#a78bfa', '#4ade80'];

// ─── Particles ────────────────────────────────────────────────────────────────
export interface SubParticle {
  x0: number; y0: number;
  vx: number; vy: number;
  r: number; phase: number; freq: number; color: string;
}

const P_COLORS = [
  '#ffd70070', '#ff4d4d70', '#00ff8870', '#00d4ff70',
  '#ff88ff70', '#ffffff90', '#ffffff70', '#ffffffa0',
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

// ─── Background & overlays ────────────────────────────────────────────────────
function drawBg(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(CW / 2, CH / 2, 0, CW / 2, CH / 2, CH * 0.75);
  g.addColorStop(0, '#0a0a12');
  g.addColorStop(1, '#020204');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
}

function drawParticles(ctx: CanvasRenderingContext2D, ps: SubParticle[], elapsed: number) {
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

function drawScanlines(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.025;
  ctx.fillStyle   = '#ffffff';
  for (let y = 0; y < CH; y += 6) ctx.fillRect(0, y, CW, 1);
  ctx.restore();
}

function drawAccountName(ctx: CanvasRenderingContext2D, elapsed: number) {
  const a = clamp(elapsed / 600, 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle   = '#ffd700';
  ctx.shadowColor = '#ffd70090';
  ctx.shadowBlur  = 10;
  ctx.fillRect(52, 46, 5, 58);
  ctx.shadowBlur  = 0;
  ctx.font         = `700 42px "Noto Sans SC", sans-serif`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#ffffff';
  ctx.shadowColor  = '#ffd70060';
  ctx.shadowBlur   = 16;
  ctx.fillText('小福分享舍', 68, 75);
  ctx.shadowBlur   = 0;
  ctx.font         = `400 24px "Noto Sans SC", sans-serif`;
  ctx.fillStyle    = 'rgba(255,255,255,0.45)';
  ctx.fillText('知识分享 · 每日更新', 68, 106);
  ctx.restore();
}

function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

// ─── One slide: accepts array of plain text lines ────────────────────────────
function drawSlide(
  ctx: CanvasRenderingContext2D,
  te: number,
  rawLines: string[],   // content lines for this slide
  idx: number,          // slide index (for accent colour)
) {
  if (te <= 0 || te >= SLIDE_DUR) return;

  // ── Uniform font for ALL lines ──────────────────────────────────────────
  const FSZ = 72;       // same size every line
  const GAP = 40;       // gap between lines
  const MAX_LINE_W = 1100;

  // Wrap each raw line independently, keep ≤ 6 visual lines total
  ctx.font = `600 ${FSZ}px "Noto Sans SC", sans-serif`;
  const lines: string[] = [];
  for (const raw of rawLines) {
    const wrapped = wrapText(ctx, raw, MAX_LINE_W);
    for (const wl of wrapped) {
      lines.push(wl);
      if (lines.length >= 6) break;
    }
    if (lines.length >= 6) break;
  }

  const nLines = lines.length;
  if (nLines === 0) return;

  const blockH   = nLines * FSZ + (nLines - 1) * GAP;
  // ── Vertically centred at CH / 2 ────────────────────────────────────────
  const blockTopY = CH / 2 - blockH / 2;

  // Pre-compute final Y for each line
  const lineY: number[] = [];
  for (let i = 0; i < nLines; i++) lineY.push(blockTopY + i * (FSZ + GAP));

  // ── Exit: all lines fade together ───────────────────────────────────────
  const exitAlpha = te >= SLIDE_EXIT_START
    ? clamp(1 - (te - SLIDE_EXIT_START) / SLIDE_EXIT, 0, 1) : 1;
  if (exitAlpha <= 0) return;

  // ── Backdrop ─────────────────────────────────────────────────────────────
  const bPadX = 80, bPadY = 44;
  const bW    = 1280;
  const bH    = blockH + bPadY * 2;
  const bX    = CW / 2 - bW / 2;
  const bY    = blockTopY - bPadY;
  const accentC = LINE_COLORS[idx % LINE_COLORS.length];

  const bgAlpha = clamp(te / 300, 0, 1) * exitAlpha;
  ctx.save();
  ctx.globalAlpha = bgAlpha;

  rrPath(ctx, bX, bY, bW, bH, 24);
  ctx.fillStyle = 'rgba(2, 2, 10, 0.82)';
  ctx.fill();

  // Left accent bar (accent colour = slide's first-line colour)
  ctx.fillStyle   = accentC;
  ctx.shadowColor = accentC;
  ctx.shadowBlur  = 14;
  ctx.fillRect(bX + 24, bY + 18, 5, bH - 36);
  ctx.shadowBlur  = 0;

  // Top highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(bX + 55, bY + 1);
  ctx.lineTo(bX + bW - 55, bY + 1);
  ctx.stroke();

  // Bottom accent line
  ctx.strokeStyle = `${accentC}55`;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(bX + 55, bY + bH - 18);
  ctx.lineTo(bX + bW - 55, bY + bH - 18);
  ctx.stroke();

  // Slide index badge (bottom-right)
  const bdR = 28;
  const bdX = bX + bW - bdR - 24;
  const bdY = bY + bH - bdR - 16;
  ctx.beginPath();
  ctx.arc(bdX, bdY, bdR, 0, Math.PI * 2);
  ctx.fillStyle   = `${accentC}28`;
  ctx.fill();
  ctx.strokeStyle = `${accentC}88`;
  ctx.lineWidth   = 2;
  ctx.stroke();
  ctx.font         = `700 26px "Noto Sans SC", sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = accentC;
  ctx.fillText(`${idx + 1}`, bdX, bdY);

  ctx.restore();

  // ── Draw each line with staggered slide-up ───────────────────────────────
  for (let i = 0; i < nLines; i++) {
    const lineTe = te - i * LINE_STAGGER;
    if (lineTe <= 0) continue;

    let lineAlpha: number;
    let yOff: number;

    if (lineTe <= LINE_ENTER) {
      const t  = easeOutCubic(lineTe / LINE_ENTER);
      lineAlpha = clamp(lineTe / 220, 0, 1);
      yOff      = (1 - t) * LINE_YOFF;
    } else {
      lineAlpha = 1;
      yOff      = 0;
    }

    const finalAlpha = lineAlpha * exitAlpha;
    if (finalAlpha <= 0) continue;

    // Each line gets its own cycling bright colour
    const lc = LINE_COLORS[(idx + i) % LINE_COLORS.length];

    ctx.save();
    ctx.globalAlpha  = finalAlpha;
    ctx.font         = `600 ${FSZ}px "Noto Sans SC", sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle    = lc;
    ctx.shadowColor  = lc;
    ctx.shadowBlur   = 22;
    ctx.fillText(lines[i], CW / 2, lineY[i] + yOff);
    ctx.shadowBlur   = 0;
    ctx.restore();
  }
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
    const te   = elapsed - (PRE_ROLL + i * SLIDE_DUR);
    const pt   = content.points[i];
    // desc holds newline-separated lines (set by parseSubtitleContent)
    const lines = pt.desc.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    drawSlide(ctx, te, lines, i);
  }

  const fadeStart = PRE_ROLL + n * SLIDE_DUR;
  if (elapsed > fadeStart) {
    const a = clamp((elapsed - fadeStart) / POST_ROLL, 0, 1);
    ctx.fillStyle = `rgba(0,0,0,${a * 0.96})`;
    ctx.fillRect(0, 0, CW, CH);
  }
}
