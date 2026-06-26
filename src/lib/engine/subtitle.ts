// subtitle.ts – Movie end-credits style: ONE complete sentence per line, upward scroll.
//
// Design:
//  • Each content point = exactly ONE display line (no wrapping, font auto-scales).
//  • customLines[i] overrides the auto-generated text for that line.
//  • New line appears every LINE_INTERVAL ms, then scrolls upward.
//  • lineSpacing option controls gap between lines.
//  • gradientText: each line can use a left→right gradient fill.
//  • After last line, everything holds visible for HOLD_AFTER ms.

import type { GeneratedContent, SubtitleOptions, SubtitleHighlight } from '../../types/video';
import { DEFAULT_SUBTITLE_OPTIONS } from '../../types/video';
import { CW, CH, clamp, easeOutCubic } from './helpers';

// ─── Timing ───────────────────────────────────────────────────────────────────
const PRE_ROLL      = 600;    // ms before first line appears
const LINE_INTERVAL = 1200;   // ms between each new line
const LINE_ENTER    = 450;    // ms for entrance animation
const LINE_YOFF     = 60;     // px starting offset for slideUp entrance
const MAX_TEXT_W    = 1680;   // max px width — font auto-shrinks beyond this
const HOLD_AFTER    = 2000;   // ms to hold all lines after last appears

// ─── Font size by setting ─────────────────────────────────────────────────────
function maxFszFor(fontSize: SubtitleOptions['fontSize']): number {
  switch (fontSize) {
    case 'sm': return 52;
    case 'md': return 68;
    case 'lg': return 88;
    default:   return 68;
  }
}

// ─── Build combined text per content point (exported for Index.tsx init) ─────
export function buildPointText(pt: GeneratedContent['points'][number]): string {
  const parts: string[] = [];
  if (pt.short?.trim()) parts.push(pt.short.trim());
  if (pt.desc?.trim())  parts.push(pt.desc.trim());
  if (parts.length === 0 && pt.label?.trim()) parts.push(pt.label.trim());
  return parts.join('，');
}

// ─── ONE line per content point (auto-shrink font to fit, no wrapping) ────────
function getAllLines(
  ctx: CanvasRenderingContext2D,
  content: GeneratedContent,
  opts: SubtitleOptions,
): Array<{ text: string; fsz: number }> {
  const baseFsz = maxFszFor(opts.fontSize);
  const result: Array<{ text: string; fsz: number }> = [];

  content.points.forEach((pt, i) => {
    const text = opts.customLines?.[i]?.trim() || buildPointText(pt);
    if (!text) return;

    ctx.font = `600 ${baseFsz}px "Noto Sans SC", sans-serif`;
    const w   = ctx.measureText(text).width;
    const fsz = w > MAX_TEXT_W ? Math.max(24, Math.floor(baseFsz * MAX_TEXT_W / w)) : baseFsz;
    result.push({ text, fsz });
  });

  return result;
}

// ─── Total duration ───────────────────────────────────────────────────────────
export function subtitleTotalMs(
  content: GeneratedContent,
  opts?: SubtitleOptions,
): number {
  const N = content.points.filter(pt => buildPointText(pt).trim()).length;
  return PRE_ROLL + N * LINE_INTERVAL + HOLD_AFTER;
}

// ─── Particles (API compat) ───────────────────────────────────────────────────
export interface SubParticle {
  x0: number; y0: number;
  vx: number; vy: number;
  r: number; phase: number; freq: number; color: string;
}

export function initSubtitleParticles(rand: () => number): SubParticle[] {
  return Array.from({ length: 40 }, () => ({
    x0: rand() * CW, y0: rand() * CH,
    vx: (rand() - 0.5) * 18, vy: (rand() - 0.5) * 18,
    r: 1 + rand() * 2, phase: rand() * Math.PI * 2, freq: 0.5 + rand() * 1.5,
    color: '#ffffff40',
  }));
}

// ─── Account badge ────────────────────────────────────────────────────────────
function drawAccountBadge(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  titleText: string,
  titleColor: string,
) {
  const a = clamp(elapsed / 600, 0, 1);
  if (a <= 0 || !titleText) return;
  ctx.save();
  ctx.globalAlpha  = a;
  ctx.fillStyle    = titleColor;
  ctx.shadowColor  = `${titleColor}90`;
  ctx.shadowBlur   = 10;
  ctx.fillRect(52, 46, 5, 58);
  ctx.shadowBlur   = 0;
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

// ─── Resolve line fill (flat color or L→R gradient) ──────────────────────────
function lineColor(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  opts: SubtitleOptions,
  lineIndex: number,
): string | CanvasGradient {
  if (opts.gradientText) {
    const w  = ctx.measureText(text).width;
    const g  = ctx.createLinearGradient(cx - w / 2, y, cx + w / 2, y);
    const c1 = opts.gradientColorStart || opts.accentColor;
    const c2 = opts.gradientColorEnd   || opts.defaultTextColor;
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
  }
  return lineIndex % 2 === 0 ? opts.accentColor : opts.defaultTextColor;
}

// ─── Keyword-aware line renderer ──────────────────────────────────────────────
function drawHighlightedLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  defaultFill: string | CanvasGradient,
  highlights: SubtitleHighlight[],
  glow: boolean,
  glowColor: string,
) {
  const active = highlights.filter(h => h.text && text.includes(h.text));

  if (active.length === 0) {
    ctx.fillStyle = defaultFill;
    if (glow) { ctx.shadowColor = glowColor; ctx.shadowBlur = 20; }
    ctx.fillText(text, cx, y);
    ctx.shadowBlur = 0;
    return;
  }

  const totalW    = ctx.measureText(text).width;
  let curX        = cx - totalW / 2;
  const origAlign = ctx.textAlign;
  ctx.textAlign   = 'left';

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
        ctx.fillStyle = defaultFill;
        if (glow) { ctx.shadowColor = glowColor; ctx.shadowBlur = 20; }
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
      ctx.fillStyle = defaultFill;
      if (glow) { ctx.shadowColor = glowColor; ctx.shadowBlur = 20; }
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

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CW, CH);

  // ── Account badge ──────────────────────────────────────────────────────────
  if (o.titleText?.trim()) {
    drawAccountBadge(ctx, elapsed, o.titleText, o.titleColor);
  }

  // ── Layout ─────────────────────────────────────────────────────────────────
  const spacing    = o.lineSpacing ?? 0;
  const maxVisible = o.linesPerSlide;

  // Collect all lines (one per content point, font per-line auto-scaled)
  const allLines = getAllLines(ctx, content, o);
  const N = allLines.length;
  if (N === 0) return;

  // Derive a representative line height using the first line's font size
  const baseFsz = allLines[0].fsz;
  const lineH   = baseFsz + 28 + spacing;   // 28 = base gap, +lineSpacing extra

  const anchorY = Math.round(CH / 2 + lineH / 2);

  // ── Hold logic ─────────────────────────────────────────────────────────────
  const holdStart       = PRE_ROLL + N * LINE_INTERVAL;
  const isHolding       = elapsed >= holdStart;
  const scrollElapsed   = isHolding ? holdStart : elapsed;
  const displayProgress = (scrollElapsed - PRE_ROLL) / LINE_INTERVAL;

  if (displayProgress < 0) return;

  // ── Draw lines ─────────────────────────────────────────────────────────────
  for (let i = 0; i < N; i++) {
    if (i > displayProgress + 0.1) break;

    const { text, fsz } = allLines[i];
    const lineAge = displayProgress - i;
    const y       = anchorY - lineAge * lineH;

    if (y + fsz < 0 || y > CH + lineH) continue;

    const lineTe = isHolding
      ? LINE_INTERVAL
      : (elapsed - PRE_ROLL) - i * LINE_INTERVAL;

    const { alpha: entryAlpha, xOff, yOff, visibleChars } =
      lineAnimState(lineTe, o.enterAnim, text.length);

    const exitAlpha = !isHolding && lineAge > maxVisible - 0.5
      ? clamp((maxVisible - lineAge) / 0.5, 0, 1)
      : 1;
    const topFade = y < 90 ? clamp(y / 90, 0, 1) : 1;

    const alpha = entryAlpha * exitAlpha * topFade;
    if (alpha <= 0) continue;

    const displayText = o.enterAnim === 'typewriter'
      ? text.slice(0, visibleChars)
      : text;

    const glow      = i % 2 === 0;
    const glowColor = i % 2 === 0 ? o.accentColor : o.defaultTextColor;

    ctx.save();
    ctx.globalAlpha  = alpha;
    ctx.font         = `600 ${fsz}px "Noto Sans SC", sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';

    const fill = lineColor(ctx, displayText, CW / 2 + xOff, y + yOff, o, i);
    drawHighlightedLine(ctx, displayText, CW / 2 + xOff, y + yOff, fill, o.highlights ?? [], glow, glowColor);
    ctx.restore();
  }
}
