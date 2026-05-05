// subtitle.ts – Movie end-credits style: one line at a time, continuous upward scroll.
//
// Design:
//  • All content lines collected and shown sequentially (no slide groups).
//  • New line appears from below every LINE_INTERVAL ms, then scrolls upward.
//  • `linesPerSlide` = visible window (how many past lines remain on screen at once).
//  • After last line appears, hold everything visible for HOLD_AFTER ms.
//  • Background is solid black (no particles, no gradient).

import type { GeneratedContent, SubtitleOptions, SubtitleHighlight } from '../../types/video';
import { DEFAULT_SUBTITLE_OPTIONS } from '../../types/video';
import { CW, CH, clamp, easeOutCubic, wrapText } from './helpers';

// ─── Timing ───────────────────────────────────────────────────────────────────
const PRE_ROLL      = 600;    // ms before first line appears
const LINE_INTERVAL = 1200;   // ms between each new line
const LINE_ENTER    = 450;    // ms for entrance animation
const LINE_YOFF     = 60;     // px starting offset for slideUp entrance
const LINE_GAP      = 28;     // px between lines
const HOLD_AFTER    = 2000;   // ms to hold all lines visible after last line appears

// ─── Font size by setting ────────────────────────────────────────────────────
function maxFszFor(fontSize: SubtitleOptions['fontSize']): number {
  switch (fontSize) {
    case 'sm': return 52;
    case 'md': return 68;
    case 'lg': return 88;
    default:   return 68;  // 'auto'
  }
}

// ─── Build combined text per content point ────────────────────────────────────
function buildPointText(pt: GeneratedContent['points'][number]): string {
  const parts: string[] = [];
  if (pt.short?.trim()) parts.push(pt.short.trim());
  if (pt.desc?.trim())  parts.push(pt.desc.trim());
  if (parts.length === 0 && pt.label?.trim()) parts.push(pt.label.trim());
  return parts.join('，');
}

// ─── Collect all lines from content (requires canvas for text measurement) ───
function getAllLines(
  ctx: CanvasRenderingContext2D,
  content: GeneratedContent,
  fsz: number,
): string[] {
  ctx.font = `600 ${fsz}px "Noto Sans SC", sans-serif`;
  const lines: string[] = [];
  for (const pt of content.points) {
    const text = buildPointText(pt);
    if (text) lines.push(...wrapText(ctx, text, 1100));
  }
  return lines;
}

// ─── Total duration (no canvas context needed — uses char estimate) ───────────
export function subtitleTotalMs(
  content: GeneratedContent,
  opts?: SubtitleOptions,
): number {
  const fsz = maxFszFor(opts?.fontSize ?? 'auto');
  // Approximate: 1 Chinese char ≈ fsz * 0.62 px wide at 1100px line width
  const charsPerLine = Math.max(Math.round(1100 / (fsz * 0.62)), 5);
  let lineCount = 0;
  for (const pt of content.points) {
    lineCount += Math.max(Math.ceil(buildPointText(pt).length / charsPerLine), 1);
  }
  // holdStart = after all lines have appeared + one extra interval to settle
  const holdStart = PRE_ROLL + lineCount * LINE_INTERVAL;
  return holdStart + HOLD_AFTER;
}

// ─── Particles (kept for API compat, not used in rendering) ──────────────────
export interface SubParticle {
  x0: number; y0: number;
  vx: number; vy: number;
  r: number; phase: number; freq: number; color: string;
}

export function initSubtitleParticles(rand: () => number): SubParticle[] {
  // Still initialised by canvasEngine for API compatibility, but not drawn.
  return Array.from({ length: 40 }, () => ({
    x0: rand() * CW, y0: rand() * CH,
    vx: (rand() - 0.5) * 18, vy: (rand() - 0.5) * 18,
    r: 1 + rand() * 2, phase: rand() * Math.PI * 2, freq: 0.5 + rand() * 1.5,
    color: '#ffffff40',
  }));
}

// ─── Account badge (top-left) ─────────────────────────────────────────────────
function drawAccountBadge(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  titleText: string,
  titleColor: string,
) {
  const a = clamp(elapsed / 600, 0, 1);
  if (a <= 0 || !titleText) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle   = titleColor;
  ctx.shadowColor = `${titleColor}90`;
  ctx.shadowBlur  = 10;
  ctx.fillRect(52, 46, 5, 58);
  ctx.shadowBlur  = 0;
  ctx.font         = `700 42px "Noto Sans SC", sans-serif`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#ffffff';
  ctx.shadowColor  = `${titleColor}60`;
  ctx.shadowBlur   = 16;
  ctx.fillText(titleText, 68, 75);
  ctx.shadowBlur   = 0;
  ctx.restore();
}

// ─── Per-line entrance animation ─────────────────────────────────────────────
function lineAnimState(
  lineTe: number,
  anim: SubtitleOptions['enterAnim'],
  textLen: number,
): { alpha: number; xOff: number; yOff: number; visibleChars: number } {
  if (lineTe <= 0) return { alpha: 0, xOff: 0, yOff: 0, visibleChars: 0 };

  if (anim === 'typewriter') {
    const t    = clamp(lineTe / LINE_ENTER, 0, 1);
    const nVis = Math.floor(t * textLen);
    return { alpha: nVis > 0 ? 1 : 0, xOff: 0, yOff: 0, visibleChars: nVis };
  }

  let alpha = clamp(lineTe / 200, 0, 1);
  let xOff  = 0;
  let yOff  = 0;

  if (lineTe <= LINE_ENTER) {
    const t = easeOutCubic(lineTe / LINE_ENTER);
    switch (anim) {
      case 'slideUp':    yOff = (1 - t) * LINE_YOFF; alpha = t; break;
      case 'slideLeft':  xOff = -(1 - t) * 260; alpha = t; break;
      case 'slideRight': xOff =  (1 - t) * 260; alpha = t; break;
      case 'fadeIn':     alpha = t; break;
    }
  }

  return { alpha: clamp(alpha, 0, 1), xOff, yOff, visibleChars: textLen };
}

// ─── Keyword-aware line renderer ──────────────────────────────────────────────
function drawHighlightedLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  defaultColor: string,
  highlights: SubtitleHighlight[],
  glow: boolean,
) {
  const active = highlights.filter(h => h.text && text.includes(h.text));

  if (active.length === 0) {
    ctx.fillStyle = defaultColor;
    if (glow) { ctx.shadowColor = defaultColor; ctx.shadowBlur = 20; }
    ctx.fillText(text, cx, y);
    ctx.shadowBlur = 0;
    return;
  }

  const totalW = ctx.measureText(text).width;
  let curX     = cx - totalW / 2;
  const origAlign = ctx.textAlign;
  ctx.textAlign = 'left';

  let remaining = text;
  while (remaining.length > 0) {
    let earliest = remaining.length;
    let matched: SubtitleHighlight | null = null;
    for (const hl of active) {
      const idx = remaining.indexOf(hl.text);
      if (idx >= 0 && idx < earliest) { earliest = idx; matched = hl; }
    }
    if (matched !== null) {
      if (earliest > 0) {
        const seg = remaining.slice(0, earliest);
        ctx.fillStyle = defaultColor;
        if (glow) { ctx.shadowColor = defaultColor; ctx.shadowBlur = 20; }
        ctx.fillText(seg, curX, y);
        ctx.shadowBlur = 0;
        curX += ctx.measureText(seg).width;
      }
      ctx.fillStyle = matched.color; ctx.shadowColor = matched.color; ctx.shadowBlur = 22;
      ctx.fillText(matched.text, curX, y);
      ctx.shadowBlur = 0;
      curX += ctx.measureText(matched.text).width;
      remaining = remaining.slice(earliest + matched.text.length);
    } else {
      ctx.fillStyle = defaultColor;
      if (glow) { ctx.shadowColor = defaultColor; ctx.shadowBlur = 20; }
      ctx.fillText(remaining, curX, y);
      ctx.shadowBlur = 0;
      break;
    }
  }
  ctx.textAlign = origAlign;
}

// ─── Main entry ───────────────────────────────────────────────────────────────
export function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  _particles: SubParticle[],
  opts?: SubtitleOptions,
) {
  const o: SubtitleOptions = opts ?? DEFAULT_SUBTITLE_OPTIONS;

  // ── Solid black background ──────────────────────────────────────────────────
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CW, CH);

  // ── Account badge (only if title is non-empty) ──────────────────────────────
  if (o.titleText?.trim()) {
    drawAccountBadge(ctx, elapsed, o.titleText, o.titleColor);
  }

  // ── Layout ──────────────────────────────────────────────────────────────────
  const fsz        = maxFszFor(o.fontSize);
  const lineH      = fsz + LINE_GAP;
  const maxVisible = o.linesPerSlide;  // visible window size

  // Anchor Y: the settled position of the NEWEST line during the hold.
  // We want it at CH/2 (center) so the visible block is well-centered.
  const anchorY = Math.round(CH / 2 + lineH / 2);

  // ── Collect all lines ───────────────────────────────────────────────────────
  const allLines = getAllLines(ctx, content, fsz);
  const N = allLines.length;
  if (N === 0) return;

  // ── Hold logic ──────────────────────────────────────────────────────────────
  // After all lines have appeared, freeze the scroll so the last state holds.
  const holdStart = PRE_ROLL + N * LINE_INTERVAL;
  const isHolding = elapsed >= holdStart;

  // Effective scroll progress (frozen during hold)
  const scrollElapsed  = isHolding ? holdStart : elapsed;
  const displayProgress = (scrollElapsed - PRE_ROLL) / LINE_INTERVAL;

  if (displayProgress < 0) return;

  // ── Draw lines ──────────────────────────────────────────────────────────────
  for (let i = 0; i < N; i++) {
    // Skip lines not yet arrived
    if (i > displayProgress + 0.1) break;

    // lineAge: 0 = just appeared, grows as scroll proceeds
    const lineAge = displayProgress - i;

    // Y: newest line (lineAge≈1 when frozen) is at anchorY.
    // Each older line is lineH higher.
    const y = anchorY - lineAge * lineH;

    // Off-screen check
    if (y + fsz < 0 || y > CH + lineH) continue;

    // ── Time since this line appeared ───────────────────────────────────────
    const lineTe = isHolding
      ? LINE_INTERVAL  // fully entered
      : (elapsed - PRE_ROLL) - i * LINE_INTERVAL;

    // ── Entrance animation ──────────────────────────────────────────────────
    const { alpha: entryAlpha, xOff, yOff, visibleChars } =
      lineAnimState(lineTe, o.enterAnim, allLines[i].length);

    // ── Window exit fade ────────────────────────────────────────────────────
    // Lines older than maxVisible fade out (skip during hold for clean display)
    const exitAlpha = !isHolding && lineAge > maxVisible - 0.5
      ? clamp((maxVisible - lineAge) / 0.5, 0, 1)
      : 1;

    // ── Top-of-screen fade ──────────────────────────────────────────────────
    const topFade = y < 90 ? clamp(y / 90, 0, 1) : 1;

    const alpha = entryAlpha * exitAlpha * topFade;
    if (alpha <= 0) continue;

    // ── Line color ──────────────────────────────────────────────────────────
    const color = i % 2 === 0 ? o.accentColor : o.defaultTextColor;
    const glow  = i % 2 === 0;

    // ── Text (typewriter clips chars) ───────────────────────────────────────
    const text = o.enterAnim === 'typewriter'
      ? allLines[i].slice(0, visibleChars)
      : allLines[i];

    ctx.save();
    ctx.globalAlpha  = alpha;
    ctx.font         = `600 ${fsz}px "Noto Sans SC", sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';

    drawHighlightedLine(ctx, text, CW / 2 + xOff, y + yOff, color, o.highlights ?? [], glow);
    ctx.restore();
  }
}
