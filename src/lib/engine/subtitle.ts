// subtitle.ts – Movie-caption style with full per-user configuration.
//
// Configurable via SubtitleOptions:
//   titleText, titleColor, accentColor, defaultTextColor,
//   fontSize, enterAnim, linesPerSlide

import type { GeneratedContent } from '../../types/video';
import type { SubtitleOptions } from '../../types/video';
import { DEFAULT_SUBTITLE_OPTIONS } from '../../types/video';
import { CW, CH, clamp, easeOutCubic, wrapText } from './helpers';

// ─── Timing ───────────────────────────────────────────────────────────────────
const PRE_ROLL     = 800;
const LINE_STAGGER = 2500;  // ms between each line appearance
const LINE_ENTER   = 500;   // ms for entrance animation
const LINE_YOFF    = 70;    // px starting offset for slideUp
const MIN_HOLD     = 1500;  // ms hold after last line appears
const SLIDE_EXIT   = 600;   // ms fade-out
const POST_ROLL    = 1600;

function slideDur(nLines: number): number {
  const n = Math.max(nLines, 1);
  return (n - 1) * LINE_STAGGER + LINE_ENTER + MIN_HOLD + SLIDE_EXIT;
}

// ─── Max font size by setting ──────────────────────────────────────────────────
function maxFszFor(fontSize: SubtitleOptions['fontSize']): number {
  switch (fontSize) {
    case 'sm': return 52;
    case 'md': return 68;
    case 'lg': return 88;
    default:   return 88;  // 'auto' = adaptive up to 88
  }
}

// ─── Compute layout with max-lines constraint ────────────────────────────────
interface SlideLayout {
  fsz: number;
  lines: string[];
  blockH: number;
}

function computeLayout(
  ctx: CanvasRenderingContext2D,
  rawLines: string[],
  maxFsz: number,
  maxLines: number,
): SlideLayout {
  const MIN_FSZ = 32;
  const GAP     = 40;
  const MAX_W   = 1100;
  const AVAIL_H = CH - 260;

  for (let fsz = maxFsz; fsz >= MIN_FSZ; fsz -= 4) {
    ctx.font = `600 ${fsz}px "Noto Sans SC", sans-serif`;
    const wrapped: string[] = [];
    for (const raw of rawLines) wrapped.push(...wrapText(ctx, raw, MAX_W));

    // Respect linesPerSlide limit
    const lines   = wrapped.slice(0, maxLines);
    const blockH  = lines.length * fsz + (lines.length - 1) * GAP;
    if (blockH <= AVAIL_H) return { fsz, lines, blockH };
  }

  ctx.font = `600 ${MIN_FSZ}px "Noto Sans SC", sans-serif`;
  const wrapped: string[] = [];
  for (const raw of rawLines) wrapped.push(...wrapText(ctx, raw, MAX_W));
  const lines  = wrapped.slice(0, maxLines);
  const blockH = lines.length * MIN_FSZ + (lines.length - 1) * 40;
  return { fsz: MIN_FSZ, lines, blockH };
}

// ─── Total duration (accounts for linesPerSlide pagination) ──────────────────
export function subtitleTotalMs(
  content: GeneratedContent,
  opts?: SubtitleOptions,
): number {
  const linesPerSlide = opts?.linesPerSlide ?? DEFAULT_SUBTITLE_OPTIONS.linesPerSlide;
  let total = PRE_ROLL;
  for (const pt of content.points) {
    const nChars    = pt.desc.replace(/\n/g, '').trim().length;
    const nWrapped  = Math.max(Math.ceil(nChars / 11), 1);
    // How many pages does this item need?
    const nPages    = Math.max(Math.ceil(nWrapped / linesPerSlide), 1);
    const linesThisPage = Math.min(nWrapped, linesPerSlide);
    total += slideDur(linesThisPage) * nPages;
  }
  return total + POST_ROLL;
}

// ─── Particles ────────────────────────────────────────────────────────────────
export interface SubParticle {
  x0: number; y0: number;
  vx: number; vy: number;
  r: number; phase: number; freq: number; color: string;
}

export function initSubtitleParticles(rand: () => number): SubParticle[] {
  const BASE_COLORS = ['#ffd70070', '#00ff8870', '#00d4ff70', '#ffffff90', '#ffffff70'];
  return Array.from({ length: 80 }, () => ({
    x0:    rand() * CW,
    y0:    rand() * CH,
    vx:    (rand() - 0.5) * 18,
    vy:    (rand() - 0.5) * 18,
    r:     1.2 + rand() * 3,
    phase: rand() * Math.PI * 2,
    freq:  0.4 + rand() * 1.6,
    color: BASE_COLORS[Math.floor(rand() * BASE_COLORS.length)],
  }));
}

// ─── Background ───────────────────────────────────────────────────────────────
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

function drawAccountBadge(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  titleText: string,
  titleColor: string,
) {
  const a = clamp(elapsed / 600, 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  // Accent stripe
  ctx.fillStyle   = titleColor;
  ctx.shadowColor = `${titleColor}90`;
  ctx.shadowBlur  = 10;
  ctx.fillRect(52, 46, 5, 58);
  ctx.shadowBlur  = 0;
  // Account name
  ctx.font         = `700 42px "Noto Sans SC", sans-serif`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#ffffff';
  ctx.shadowColor  = `${titleColor}60`;
  ctx.shadowBlur   = 16;
  ctx.fillText(titleText, 68, 75);
  ctx.shadowBlur   = 0;
  // Sub-label
  ctx.font      = `400 24px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('知识分享 · 每日更新', 68, 106);
  ctx.restore();
}

// ─── Rounded-rect path helper ─────────────────────────────────────────────────
function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

// ─── Per-line entrance animation ─────────────────────────────────────────────
interface LineAnimState {
  alpha: number;
  xOff: number;
  yOff: number;
}

function lineAnimState(
  lineTe: number,
  anim: SubtitleOptions['enterAnim'],
  text: string,
): LineAnimState & { visibleChars: number } {
  if (lineTe <= 0) return { alpha: 0, xOff: 0, yOff: 0, visibleChars: 0 };

  if (anim === 'typewriter') {
    const t    = clamp(lineTe / LINE_ENTER, 0, 1);
    const nVis = Math.floor(t * text.length);
    return { alpha: nVis > 0 ? 1 : 0, xOff: 0, yOff: 0, visibleChars: nVis };
  }

  let alpha = clamp(lineTe / 200, 0, 1);
  let xOff  = 0;
  let yOff  = 0;

  if (lineTe <= LINE_ENTER) {
    const t = easeOutCubic(lineTe / LINE_ENTER);
    switch (anim) {
      case 'slideUp':
        yOff = (1 - t) * LINE_YOFF;
        break;
      case 'slideLeft':
        xOff = -(1 - t) * 280;
        alpha = t;
        break;
      case 'slideRight':
        xOff = (1 - t) * 280;
        alpha = t;
        break;
      case 'fadeIn':
        alpha = t;
        break;
    }
  }

  return { alpha: clamp(alpha, 0, 1), xOff, yOff, visibleChars: text.length };
}

// ─── Single slide ─────────────────────────────────────────────────────────────
function drawSlide(
  ctx: CanvasRenderingContext2D,
  te: number,
  layout: SlideLayout,
  slideIdx: number,       // global slide index (for badge numbering)
  dur: number,
  opts: SubtitleOptions,
) {
  const { fsz, lines, blockH } = layout;
  const nLines = lines.length;
  const GAP    = 40;

  if (te <= 0 || te >= dur) return;

  const accentC = opts.accentColor;
  const exitStart = dur - SLIDE_EXIT;
  const exitAlpha = te >= exitStart
    ? clamp(1 - (te - exitStart) / SLIDE_EXIT, 0, 1) : 1;
  if (exitAlpha <= 0) return;

  const blockTopY = CH / 2 - blockH / 2;
  const lineY: number[] = [];
  for (let i = 0; i < nLines; i++) lineY.push(blockTopY + i * (fsz + GAP));

  // ── Backdrop ─────────────────────────────────────────────────────────────
  const bPadY = 44, bW = 1280;
  const bH  = blockH + bPadY * 2;
  const bX  = CW / 2 - bW / 2;
  const bY  = blockTopY - bPadY;
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

  // Top / bottom subtle lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(bX + 55, bY + 1);
  ctx.lineTo(bX + bW - 55, bY + 1);
  ctx.stroke();

  ctx.strokeStyle = `${accentC}50`;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(bX + 55, bY + bH - 18);
  ctx.lineTo(bX + bW - 55, bY + bH - 18);
  ctx.stroke();

  // Slide badge (bottom-right)
  const bdR = 26, bdX = bX + bW - bdR - 24, bdY = bY + bH - bdR - 14;
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
  ctx.fillText(`${slideIdx + 1}`, bdX, bdY);
  ctx.restore();

  // ── Draw each line ────────────────────────────────────────────────────────
  for (let i = 0; i < nLines; i++) {
    const lineTe = te - i * LINE_STAGGER;
    if (lineTe <= 0) continue;

    const { alpha, xOff, yOff, visibleChars } = lineAnimState(lineTe, opts.enterAnim, lines[i]);
    const finalAlpha = alpha * exitAlpha;
    if (finalAlpha <= 0) continue;

    // Alternate colours: even = accent, odd = default text
    const lc   = i % 2 === 0 ? accentC : opts.defaultTextColor;
    const glow = i % 2 === 0;
    const text  = opts.enterAnim === 'typewriter'
      ? lines[i].slice(0, visibleChars)
      : lines[i];

    ctx.save();
    ctx.globalAlpha  = finalAlpha;
    ctx.font         = `600 ${fsz}px "Noto Sans SC", sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle    = lc;
    if (glow) { ctx.shadowColor = lc; ctx.shadowBlur = 20; }
    ctx.fillText(text, CW / 2 + xOff, lineY[i] + yOff);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ─── Main entry ───────────────────────────────────────────────────────────────
export function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  particles: SubParticle[],
  opts?: SubtitleOptions,
) {
  const o: SubtitleOptions = opts ?? DEFAULT_SUBTITLE_OPTIONS;
  drawBg(ctx);
  drawParticles(ctx, particles, elapsed);
  drawScanlines(ctx);
  drawAccountBadge(ctx, elapsed, o.titleText, o.titleColor);

  const maxFsz = maxFszFor(o.fontSize);
  const maxLines = o.linesPerSlide;

  let slideStart = PRE_ROLL;
  let globalSlideIdx = 0;

  for (const pt of content.points) {
    const rawLines = pt.desc
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Compute full wrapped layout for this item
    ctx.font = `600 ${maxFsz}px "Noto Sans SC", sans-serif`;
    const allWrapped: string[] = [];
    for (const raw of rawLines) allWrapped.push(...wrapText(ctx, raw, 1100));

    // Paginate into groups of maxLines
    for (let pageStart = 0; pageStart < Math.max(allWrapped.length, 1); pageStart += maxLines) {
      const pageLines = allWrapped.slice(pageStart, pageStart + maxLines);
      if (pageLines.length === 0) break;

      const layout = computeLayout(ctx, pageLines, maxFsz, maxLines);
      const dur    = slideDur(layout.lines.length);
      const te     = elapsed - slideStart;

      if (te > -100 && te < dur + 100) {
        drawSlide(ctx, te, layout, globalSlideIdx, dur, o);
      }

      slideStart += dur;
      globalSlideIdx++;
    }
  }

  // Post-roll: fade to black
  if (elapsed > slideStart) {
    const a = clamp((elapsed - slideStart) / POST_ROLL, 0, 1);
    ctx.fillStyle = `rgba(0,0,0,${a * 0.96})`;
    ctx.fillRect(0, 0, CW, CH);
  }
}
