/**
 * cards-chinese.ts
 * Per-slide layout for Chinese zodiac style.
 * Reference design: left text + right animated shape, clean dark background.
 *
 * Layout (1920 × 1080):
 *  Left zone  — x: 130–1050  (text: number · title · short · desc)
 *  Right zone — cx: 1450, cy: 540  (shapeImg with glow + rotation)
 *  Bottom     — slide indicator dots
 */

import type { GeneratedContent, ChineseOptions } from '../../types/video';
import { CW, CH, clamp, easeOutCubic, easeOutBack, hex2rgba, wrapText, T } from './helpers';

// ── Layout constants ───────────────────────────────────────────────────────────
const LEFT_X      = 130;   // text left edge
const TEXT_MAX_W  = 900;   // max text width (px)
const SHAPE_CX    = 1460;  // shape center x
const SHAPE_CY    = 530;   // shape center y
const SHAPE_R     = 240;   // shape image half-size

// ── Timing ────────────────────────────────────────────────────────────────────
export const CHINESE_SLIDE_DUR = 2400;  // ms per slide
const ENTER_DUR = 700;                  // text + shape enter animation
const EXIT_DUR  = 280;                  // fade-out before next slide

// ── Resolve options ───────────────────────────────────────────────────────────
function opts(o?: ChineseOptions) {
  return {
    titleFsz:  o?.titleFontSize  ?? 90,
    shortFsz:  o?.shortFontSize  ?? 54,
    descFsz:   38,
    titleClr:  o?.titleColor   || '',   // '' → use accent
    shortClr:  o?.shortColor   || '',   // '' → use accent2
    descClr:   'rgba(255,255,255,0.65)',
  };
}

// ── Draw the animated shape on the right ─────────────────────────────────────
function drawShapePanel(
  ctx: CanvasRenderingContext2D,
  shapeImg: HTMLImageElement,
  elapsed: number,
  enterT: number,
  accent: string,
) {
  const scaleT = easeOutBack(Math.min(enterT, 0.9999));
  const alpha  = clamp(enterT * 2.5, 0, 1);
  const pulse  = 1 + 0.03 * Math.sin(elapsed * 0.0018);
  const rot    = elapsed * 0.00025;   // slow clockwise rotation

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(SHAPE_CX, SHAPE_CY);
  ctx.rotate(rot);
  ctx.scale(scaleT * pulse, scaleT * pulse);

  // ── Outer glow halo ───────────────────────────────────────────────────────
  const halo = ctx.createRadialGradient(0, 0, SHAPE_R * 0.5, 0, 0, SHAPE_R * 1.4);
  halo.addColorStop(0, hex2rgba(accent, 0.18));
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(0, 0, SHAPE_R * 1.4, 0, Math.PI * 2); ctx.fill();

  // ── Dashed orbit ring ─────────────────────────────────────────────────────
  ctx.strokeStyle = hex2rgba(accent, 0.35);
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 16]);
  ctx.shadowColor = accent; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(0, 0, SHAPE_R + 38, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;

  // ── Inner solid ring ──────────────────────────────────────────────────────
  ctx.strokeStyle = hex2rgba(accent, 0.22);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, SHAPE_R + 12, 0, Math.PI * 2); ctx.stroke();

  // ── Shape image ───────────────────────────────────────────────────────────
  ctx.shadowColor = accent; ctx.shadowBlur = 44;
  ctx.drawImage(shapeImg, -SHAPE_R, -SHAPE_R, SHAPE_R * 2, SHAPE_R * 2);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// ── Draw left-side text block ─────────────────────────────────────────────────
function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  pt: GeneratedContent['points'][number],
  slideIndex: number,
  elapsed: number,
  enterT: number,
  alpha: number,
  accent: string,
  accent2: string,
  o: ReturnType<typeof opts>,
) {
  const eased   = easeOutCubic(enterT);
  const slideX  = (1 - eased) * 140;  // slides in from left
  const textAlpha = clamp(enterT * 2, 0, 1) * alpha;

  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.translate(-slideX, 0);

  // ── Accent bar (left of number) ───────────────────────────────────────────
  const barH   = Math.min(o.titleFsz * 1.4, 130) * eased;
  const titleY = CH * 0.35;
  const barY   = titleY - o.titleFsz * 0.75;
  ctx.fillStyle = accent;
  ctx.shadowColor = accent; ctx.shadowBlur = 10;
  ctx.fillRect(88, barY, 6, barH);
  ctx.shadowBlur = 0;

  // ── Number + Label on same line ────────────────────────────────────────────
  ctx.font = `800 ${o.titleFsz}px "Noto Sans SC", sans-serif`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';

  const numStr = `${slideIndex + 1}. `;
  const numW   = ctx.measureText(numStr).width;

  // Number in accent
  ctx.fillStyle = accent;
  ctx.shadowColor = accent; ctx.shadowBlur = 28;
  ctx.fillText(numStr, LEFT_X, titleY);
  ctx.shadowBlur = 0;

  // Label (title line)
  const titleClr = o.titleClr || accent;
  ctx.fillStyle  = titleClr;
  ctx.shadowColor = titleClr; ctx.shadowBlur = 18;
  // Auto-shrink label if too wide
  const labelText = pt.label || '';
  const maxLabelW = TEXT_MAX_W - numW;
  ctx.font = `800 ${o.titleFsz}px "Noto Sans SC", sans-serif`;
  if (ctx.measureText(labelText).width > maxLabelW) {
    ctx.font = `800 ${Math.round(o.titleFsz * 0.9)}px "Noto Sans SC", sans-serif`;
  }
  ctx.fillText(labelText, LEFT_X + numW, titleY);
  ctx.shadowBlur = 0;

  // ── Short description ─────────────────────────────────────────────────────
  if (pt.short) {
    const shortY   = titleY + o.titleFsz * 0.88;
    const shortClr = o.shortClr || accent2;
    ctx.font       = `600 ${o.shortFsz}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle  = shortClr;
    ctx.shadowColor = shortClr; ctx.shadowBlur = 12;
    ctx.fillText(pt.short, LEFT_X, shortY + o.shortFsz * 0.5);
    ctx.shadowBlur = 0;
  }

  // ── Long description (wrapped) ────────────────────────────────────────────
  if (pt.desc) {
    const descY = CH * 0.35 + o.titleFsz * 0.88 + o.shortFsz * 1.3 + 16;
    ctx.font     = `400 ${o.descFsz}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = o.descClr;
    const lines  = wrapText(ctx, pt.desc, TEXT_MAX_W);
    lines.slice(0, 3).forEach((line, li) => {
      ctx.fillText(line, LEFT_X, descY + li * (o.descFsz + 10));
    });
  }

  ctx.restore();
}

// ── Slide indicator dots at bottom ───────────────────────────────────────────
function drawDots(
  ctx: CanvasRenderingContext2D,
  total: number,
  current: number,
  accent: string,
) {
  const R = 5, GAP = 20;
  const x0 = (CW - total * (R * 2 + GAP) + GAP) / 2;
  const y  = CH - 38;

  for (let i = 0; i < total; i++) {
    const active = i === current;
    ctx.save();
    ctx.globalAlpha = active ? 0.92 : 0.28;
    ctx.fillStyle = active ? accent : '#ffffff';
    ctx.shadowColor = accent; ctx.shadowBlur = active ? 12 : 0;
    ctx.beginPath();
    ctx.arc(x0 + i * (R * 2 + GAP) + R, y, R * (active ? 1 : 0.7), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export function drawChineseCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  shapeImg: HTMLImageElement,
  coverIndex: number,
  chineseOptions?: ChineseOptions,
) {
  if (elapsed < T.cardBase) return;

  const n = content.points.length;
  if (n === 0) return;

  const o          = opts(chineseOptions);
  const cardElapsed = elapsed - T.cardBase;
  const curSlide   = Math.min(Math.floor(cardElapsed / CHINESE_SLIDE_DUR), n - 1);
  const within     = cardElapsed - curSlide * CHINESE_SLIDE_DUR;

  const enterT = clamp(within / ENTER_DUR, 0, 1);
  const isLast = curSlide === n - 1;
  const exitT  = !isLast && within > CHINESE_SLIDE_DUR - EXIT_DUR
    ? clamp((within - (CHINESE_SLIDE_DUR - EXIT_DUR)) / EXIT_DUR, 0, 1)
    : 0;
  const slideAlpha = 1 - exitT;

  const pt = content.points[curSlide];

  // Draw shape (right side) — behind text conceptually but both over bg
  if (shapeImg) {
    ctx.save();
    ctx.globalAlpha = slideAlpha;
    drawShapePanel(ctx, shapeImg, elapsed, enterT, accent);
    ctx.restore();
  }

  // Draw text block (left side)
  drawTextBlock(ctx, pt, curSlide, elapsed, enterT, slideAlpha, accent, accent2, o);

  // Slide indicator dots (always visible, no alpha fade)
  drawDots(ctx, n, curSlide, accent);
}
