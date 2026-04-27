// subtitle.ts – Movie-caption style: lines appear one-by-one with reading pacing,
//              adaptive font size (no truncation), 2-colour scheme per slide.

import type { GeneratedContent } from '../../types/video';
import { CW, CH, clamp, easeOutCubic, seededRandom, wrapText } from './helpers';

// ─── Timing ───────────────────────────────────────────────────────────────────
const PRE_ROLL      = 800;
const LINE_STAGGER  = 1500; // ms between each line — comfortable reading pace
const LINE_ENTER    = 500;  // ms for each line's slide-up animation
const LINE_YOFF     = 70;   // px each line starts below final position
const MIN_HOLD      = 1500; // ms hold after ALL lines are visible
const SLIDE_EXIT    = 600;  // ms fade-out
const POST_ROLL     = 1600;

/** Duration for one slide given its visual line count. */
function slideDur(nLines: number): number {
  const n = Math.max(nLines, 1);
  return (n - 1) * LINE_STAGGER + LINE_ENTER + MIN_HOLD + SLIDE_EXIT;
}

/**
 * Total animation length — depends on per-slide line counts.
 * Pass full GeneratedContent so we can count actual lines.
 */
export function subtitleTotalMs(content: GeneratedContent): number {
  let total = PRE_ROLL;
  for (const pt of content.points) {
    const nLines = pt.desc.split('\n').filter(l => l.trim().length > 0).length;
    total += slideDur(Math.max(nLines, 1));
  }
  return total + POST_ROLL;
}

// ─── Two-colour scheme ────────────────────────────────────────────────────────
// Each slide gets one accent colour (from a small rotating palette).
// Even-indexed visual lines → accent  |  Odd-indexed → white
const ACCENT_PALETTE = ['#ffd700', '#00ff88', '#00d4ff'];
const NORMAL_COLOR   = 'rgba(255,255,255,0.92)';

// ─── Particles ────────────────────────────────────────────────────────────────
export interface SubParticle {
  x0: number; y0: number;
  vx: number; vy: number;
  r: number; phase: number; freq: number; color: string;
}

const P_COLORS = [
  '#ffd70070', '#00ff8870', '#00d4ff70',
  '#ffffff90', '#ffffff70', '#ffffffa0',
];

export function initSubtitleParticles(rand: () => number): SubParticle[] {
  return Array.from({ length: 80 }, () => ({
    x0:    rand() * CW,
    y0:    rand() * CH,
    vx:    (rand() - 0.5) * 18,
    vy:    (rand() - 0.5) * 18,
    r:     1.2 + rand() * 3,
    phase: rand() * Math.PI * 2,
    freq:  0.4 + rand() * 1.6,
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
    const a = 0.07 + 0.45 * (0.5 + 0.5 * Math.sin(t * p.freq + p.phase));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = p.r * 5;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(x, y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawScanlines(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.022;
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

// ─── Adaptive font + layout computation ──────────────────────────────────────
interface SlideLayout {
  fsz: number;
  lines: string[];
  blockH: number;
}

function computeLayout(ctx: CanvasRenderingContext2D, rawLines: string[]): SlideLayout {
  const MAX_FSZ  = 88;
  const MIN_FSZ  = 32;
  const GAP      = 40;
  const MAX_W    = 1100;
  // Account name takes ~130px at top; leave padding at bottom too
  const AVAIL_H  = CH - 260;

  for (let fsz = MAX_FSZ; fsz >= MIN_FSZ; fsz -= 4) {
    ctx.font = `600 ${fsz}px "Noto Sans SC", sans-serif`;
    const lines: string[] = [];
    for (const raw of rawLines) {
      lines.push(...wrapText(ctx, raw, MAX_W));
    }
    const blockH = lines.length * fsz + (lines.length - 1) * GAP;
    if (blockH <= AVAIL_H) {
      return { fsz, lines, blockH };
    }
  }
  // MIN_FSZ fallback — still show everything, may slightly overflow
  ctx.font = `600 ${MIN_FSZ}px "Noto Sans SC", sans-serif`;
  const lines: string[] = [];
  for (const raw of rawLines) lines.push(...wrapText(ctx, raw, MAX_W));
  const blockH = lines.length * MIN_FSZ + (lines.length - 1) * GAP;
  return { fsz: MIN_FSZ, lines, blockH };
}

// ─── One subtitle slide ───────────────────────────────────────────────────────
function drawSlide(
  ctx: CanvasRenderingContext2D,
  te: number,
  layout: SlideLayout,
  idx: number,
  dur: number,       // pre-computed slide duration (based on raw line count)
) {
  const { fsz, lines, blockH } = layout;
  const nLines = lines.length;
  const GAP    = 40;

  if (te <= 0 || te >= dur) return;

  const accentC  = ACCENT_PALETTE[idx % ACCENT_PALETTE.length];
  const exitStart = dur - SLIDE_EXIT;

  // Exit alpha
  const exitAlpha = te >= exitStart
    ? clamp(1 - (te - exitStart) / SLIDE_EXIT, 0, 1) : 1;
  if (exitAlpha <= 0) return;

  // Block centred vertically
  const blockTopY = CH / 2 - blockH / 2;

  // Pre-compute each line's final Y
  const lineY: number[] = [];
  for (let i = 0; i < nLines; i++) lineY.push(blockTopY + i * (fsz + GAP));

  // Backdrop (fades in quickly, exits with all lines)
  const bPadY = 44, bW = 1280;
  const bH    = blockH + bPadY * 2;
  const bX    = CW / 2 - bW / 2;
  const bY    = blockTopY - bPadY;

  const bgAlpha = clamp(te / 280, 0, 1) * exitAlpha;
  ctx.save();
  ctx.globalAlpha = bgAlpha;

  rrPath(ctx, bX, bY, bW, bH, 24);
  ctx.fillStyle = 'rgba(2, 2, 10, 0.82)';
  ctx.fill();

  // Left accent bar
  ctx.fillStyle   = accentC;
  ctx.shadowColor = accentC;
  ctx.shadowBlur  = 12;
  ctx.fillRect(bX + 24, bY + 18, 5, bH - 36);
  ctx.shadowBlur  = 0;

  // Top subtle line
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(bX + 55, bY + 1);
  ctx.lineTo(bX + bW - 55, bY + 1);
  ctx.stroke();

  // Bottom accent line
  ctx.strokeStyle = `${accentC}50`;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(bX + 55, bY + bH - 18);
  ctx.lineTo(bX + bW - 55, bY + bH - 18);
  ctx.stroke();

  // Slide badge (bottom-right)
  const bdR = 26;
  const bdX = bX + bW - bdR - 24;
  const bdY = bY + bH - bdR - 14;
  ctx.beginPath();
  ctx.arc(bdX, bdY, bdR, 0, Math.PI * 2);
  ctx.fillStyle   = `${accentC}25`;
  ctx.fill();
  ctx.strokeStyle = `${accentC}80`;
  ctx.lineWidth   = 2;
  ctx.stroke();
  ctx.font         = `700 24px "Noto Sans SC", sans-serif`;
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
      const t   = easeOutCubic(lineTe / LINE_ENTER);
      lineAlpha = clamp(lineTe / 200, 0, 1);
      yOff      = (1 - t) * LINE_YOFF;
    } else {
      lineAlpha = 1;
      yOff      = 0;
    }

    const finalAlpha = lineAlpha * exitAlpha;
    if (finalAlpha <= 0) continue;

    // 2 colours: even = accent, odd = white
    const lc  = i % 2 === 0 ? accentC : NORMAL_COLOR;
    const glow = i % 2 === 0; // glow only on accent lines

    ctx.save();
    ctx.globalAlpha  = finalAlpha;
    ctx.font         = `600 ${fsz}px "Noto Sans SC", sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle    = lc;
    if (glow) {
      ctx.shadowColor = lc;
      ctx.shadowBlur  = 20;
    }
    ctx.fillText(lines[i], CW / 2, lineY[i] + yOff);
    ctx.shadowBlur = 0;
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
  let slideStart = PRE_ROLL;

  for (let i = 0; i < n; i++) {
    const rawLines = content.points[i].desc
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Compute layout (font size + visual lines) for this slide
    const layout = computeLayout(ctx, rawLines);
    // ⚠ Use rawLines.length for timing — consistent with subtitleTotalMs
    const dur    = slideDur(rawLines.length);
    const te     = elapsed - slideStart;

    // Only draw if within visible window (small buffer each side)
    if (te > -100 && te < dur + 100) {
      drawSlide(ctx, te, layout, i, dur);
    }

    slideStart += dur;
  }

  // Post-roll: fade to black
  const fadeStart = slideStart; // = PRE_ROLL + sum of all slideDurs
  if (elapsed > fadeStart) {
    const a = clamp((elapsed - fadeStart) / POST_ROLL, 0, 1);
    ctx.fillStyle = `rgba(0,0,0,${a * 0.96})`;
    ctx.fillRect(0, 0, CW, CH);
  }
}
