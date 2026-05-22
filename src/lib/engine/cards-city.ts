// cards-city.ts – 十二生肖风格 (重构)
// 参考设计：大间距、右侧简约装饰（4点 + 竖线）

import type { GeneratedContent, CityOptions } from '../../types/video';
import { CW, CH, clamp, easeOutCubic, wrapText, T } from './helpers';

// ─── Timing ───────────────────────────────────────────────────────────────────
const SLIDE_ENTER = 600;
const SLIDE_HOLD  = 2000;
const SLIDE_EXIT  = 400;
const SLIDE_TOTAL = SLIDE_ENTER + SLIDE_HOLD + SLIDE_EXIT; // 3000 ms

export function cityTotalMs(n: number): number {
  return T.cardBase + n * SLIDE_TOTAL + T.outroDur;
}

// ─── Perspective grid ─────────────────────────────────────────────────────────
function drawPerspGrid(ctx: CanvasRenderingContext2D, alpha: number) {
  if (alpha <= 0) return;
  const VX = CW / 2, VY = CH / 2;
  const L = 60, R = CW - 60, TOP = 60, BOT = CH - 60;
  ctx.save();
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth   = 0.8;
  ctx.globalAlpha = alpha * 0.09;
  const hSteps = 9;
  for (let i = 0; i <= hSteps; i++) {
    const y = TOP + (i / hSteps) * (BOT - TOP);
    ctx.beginPath(); ctx.moveTo(L, y);   ctx.lineTo(VX, VY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(R, y);   ctx.lineTo(VX, VY); ctx.stroke();
  }
  const vSteps = 14;
  for (let i = 0; i <= vSteps; i++) {
    const x = L + (i / vSteps) * (R - L);
    ctx.beginPath(); ctx.moveTo(x, TOP); ctx.lineTo(VX, VY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, BOT); ctx.lineTo(VX, VY); ctx.stroke();
  }
  ctx.restore();
}

// ─── Right-side decoration: 4 dots + vertical accent bar ─────────────────────
const DECOR_CX = Math.round(CW * 0.80);   // 80% from left
const DECOR_CY = Math.round(CH * 0.50);   // vertically centered

function drawRightDecor(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  accent: string,
  elapsed: number,
) {
  if (alpha <= 0.01) return;
  const entryEase = easeOutCubic(clamp(elapsed / 800, 0, 1));

  ctx.save();
  ctx.globalAlpha = alpha * entryEase;

  const barH  = 180;
  const barW  = 4;
  const dotR  = 14;
  const dotDX = 70;
  const dotDY1 = -65;
  const dotDY2 =  70;

  // Vertical accent bar
  const barG = ctx.createLinearGradient(0, DECOR_CY - barH / 2, 0, DECOR_CY + barH / 2);
  barG.addColorStop(0,   'rgba(0,0,0,0)');
  barG.addColorStop(0.3, accent);
  barG.addColorStop(0.7, accent);
  barG.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = barG;
  const barX = DECOR_CX - barW / 2;
  ctx.fillRect(barX, DECOR_CY - barH / 2, barW, barH);

  // 4 gray dots (2×2 arrangement on either side of the bar)
  const dotPositions: [number, number][] = [
    [DECOR_CX - dotDX, DECOR_CY + dotDY1],
    [DECOR_CX - dotDX, DECOR_CY + dotDY2],
    [DECOR_CX + dotDX, DECOR_CY + dotDY1],
    [DECOR_CX + dotDX, DECOR_CY + dotDY2],
  ];
  dotPositions.forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,200,200,0.55)';
    ctx.fill();
  });

  // Two small accent dots on bar endpoints
  [[DECOR_CX, DECOR_CY - barH / 2], [DECOR_CX, DECOR_CY + barH / 2]].forEach(([dx, dy]) => {
    ctx.shadowColor = accent; ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(dx, dy, 7, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  ctx.restore();
}

// ─── Left text content ────────────────────────────────────────────────────────
const TEXT_X     = 380;                                          // ~20% from left
const MAX_TEXT_W = Math.round(CW * 0.65) - TEXT_X;             // ≈860px

function drawLeftContent(
  ctx: CanvasRenderingContext2D,
  slideElapsed: number,
  point: { label?: string; short?: string; desc?: string },
  slideIdx: number,
  title: string,
  accent: string,
  alpha: number,
  cityOptions?: CityOptions,
) {
  if (alpha <= 0.01) return;

  // ── Configurable values ───────────────────────────────────────────────────
  const labelFsz = cityOptions?.labelFontSize ?? 108;
  const labelCol = (cityOptions?.labelColor && cityOptions.labelColor !== '') ? cityOptions.labelColor : accent;
  const shortFsz = cityOptions?.shortFontSize ?? 64;
  const shortCol = (cityOptions?.shortColor  && cityOptions.shortColor  !== '') ? cityOptions.shortColor  : 'rgba(255,255,255,0.95)';
  const descFsz  = cityOptions?.descFontSize  ?? 40;
  const descCol  = (cityOptions?.descColor    && cityOptions.descColor   !== '') ? cityOptions.descColor   : 'rgba(200,200,200,0.88)';

  const labelLineH = labelFsz + 26;   // generous line height
  const shortLineH = shortFsz + 14;
  const descLineH  = descFsz  + 18;
  const GAP_LS     = 110;   // ← large gap: label → short (was 28)
  const GAP_SD     = 55;    // ← larger gap: short → desc (was 26)

  // ── Measure lines ─────────────────────────────────────────────────────────
  const labelText = `${slideIdx + 1}. ${point.label || ''}`;
  ctx.font = `900 ${labelFsz}px "Noto Sans SC", sans-serif`;
  const labelLines = wrapText(ctx, labelText, MAX_TEXT_W);
  ctx.font = `500 ${shortFsz}px "Noto Sans SC", sans-serif`;
  const shortLines = wrapText(ctx, point.short || '', MAX_TEXT_W);
  ctx.font = `400 ${descFsz}px "Noto Sans SC", sans-serif`;
  const descLines  = wrapText(ctx, point.desc  || '', MAX_TEXT_W).slice(0, 4);

  // ── Block height → center ─────────────────────────────────────────────────
  const labelH = labelLines.length * labelLineH;
  const shortH = shortLines.length > 0 ? shortLines.length * shortLineH : 0;
  const descH  = descLines.length  > 0 ? descLines.length  * descLineH  : 0;
  const totalH = labelH
    + (shortH > 0 ? GAP_LS + shortH : 0)
    + (descH  > 0 ? GAP_SD + descH  : 0);
  const blockTopY = Math.round(CH / 2 - totalH / 2);

  // ── Entrance slide ────────────────────────────────────────────────────────
  const enterEase = easeOutCubic(clamp(slideElapsed / SLIDE_ENTER, 0, 1));
  const xOff = (1 - enterEase) * -150;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(xOff, 0);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';

  // Topic title — just above content block
  const titleY = Math.max(50, blockTopY - 58);
  ctx.font = `400 30px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = 'rgba(200,200,200,0.45)';
  ctx.fillText(title || '', TEXT_X, titleY);

  // Vertical accent bar aligned with content block
  ctx.save();
  ctx.globalAlpha = alpha * 0.40 * enterEase;
  const barG = ctx.createLinearGradient(0, blockTopY, 0, blockTopY + totalH);
  barG.addColorStop(0, 'rgba(0,0,0,0)');
  barG.addColorStop(0.2, labelCol);
  barG.addColorStop(0.8, labelCol);
  barG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.strokeStyle = barG; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(TEXT_X - 28, blockTopY - 10);
  ctx.lineTo(TEXT_X - 28, blockTopY + totalH + 10);
  ctx.stroke();
  ctx.restore();

  // ① Label — large, accent colour
  const labelY = blockTopY;
  ctx.font = `900 ${labelFsz}px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = labelCol;
  ctx.shadowColor = labelCol; ctx.shadowBlur = 18;
  labelLines.forEach((ln, i) => ctx.fillText(ln, TEXT_X, labelY + i * labelLineH));
  ctx.shadowBlur = 0;

  // ② Short — medium white
  if (shortLines.length > 0) {
    const shortY = labelY + labelH + GAP_LS;
    ctx.font = `500 ${shortFsz}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = shortCol;
    shortLines.forEach((ln, i) => ctx.fillText(ln, TEXT_X, shortY + i * shortLineH));
  }

  // ③ Desc — small gray
  if (descLines.length > 0) {
    const descY = blockTopY + labelH + (shortH > 0 ? GAP_LS + shortH : 0) + GAP_SD;
    ctx.font = `400 ${descFsz}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = descCol;
    descLines.forEach((ln, i) => ctx.fillText(ln, TEXT_X, descY + i * descLineH));
  }

  ctx.restore();
}

// ─── Main draw entry ──────────────────────────────────────────────────────────
export function drawCityCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  _shapeImg: HTMLImageElement,
  coverIndex: number,
  cityOptions?: CityOptions,
) {
  void accent2; void coverIndex;

  const gridAlpha = clamp((elapsed - T.cardBase) / 1200, 0, 1);
  drawPerspGrid(ctx, gridAlpha);

  if (elapsed < T.cardBase) return;

  const n = content.points.length;
  if (n === 0) return;

  const pageElapsed = elapsed - T.cardBase;
  const slideIdx    = Math.min(Math.floor(pageElapsed / SLIDE_TOTAL), n - 1);
  const slideE      = pageElapsed - slideIdx * SLIDE_TOTAL;

  // Alpha envelope
  const alpha =
    slideE < SLIDE_ENTER
      ? easeOutCubic(slideE / SLIDE_ENTER)
      : slideE < SLIDE_ENTER + SLIDE_HOLD
        ? 1
        : 1 - clamp((slideE - SLIDE_ENTER - SLIDE_HOLD) / SLIDE_EXIT, 0, 1);

  const point = content.points[slideIdx];
  if (!point) return;

  // Right decoration
  drawRightDecor(ctx, alpha, accent, slideE);

  // Left content (100 ms stagger)
  const leftE = Math.max(0, slideE - 100);
  const leftA = easeOutCubic(clamp(leftE / SLIDE_ENTER, 0, 1)) *
    (slideE > SLIDE_ENTER + SLIDE_HOLD
      ? 1 - clamp((slideE - SLIDE_ENTER - SLIDE_HOLD) / SLIDE_EXIT, 0, 1)
      : 1);
  drawLeftContent(ctx, leftE, point, slideIdx, content.title || '', accent, leftA, cityOptions);
  void alpha;

  // Progress dots
  if (n > 1) {
    const dotR = 6, dotGap = 20, dotY = CH - 32;
    const dotX0 = (CW - n * (dotR * 2 + dotGap) + dotGap) / 2;
    for (let i = 0; i < n; i++) {
      ctx.save();
      ctx.globalAlpha = i === slideIdx ? 0.9 : 0.28;
      ctx.fillStyle = i === slideIdx ? accent : 'rgba(200,200,200,0.6)';
      ctx.shadowColor = accent; ctx.shadowBlur = i === slideIdx ? 8 : 0;
      ctx.beginPath();
      ctx.arc(dotX0 + i * (dotR * 2 + dotGap) + dotR, dotY, dotR * (i === slideIdx ? 1 : 0.7), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
