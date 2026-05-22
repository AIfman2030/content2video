// cards-city.ts – 十二生肖风格
// • 右侧：8 种循环动画
// • 左侧：单行文字（不换行，自动缩字适配）
// • 大行间距布局，参考简约风格

import type { GeneratedContent, CityOptions } from '../../types/video';
import { CW, CH, clamp, easeOutCubic, easeInOutQuad, T } from './helpers';

// ─── Timing ───────────────────────────────────────────────────────────────────
const SLIDE_ENTER = 600;
const SLIDE_HOLD  = 2000;
const SLIDE_EXIT  = 400;
const SLIDE_TOTAL = SLIDE_ENTER + SLIDE_HOLD + SLIDE_EXIT;

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
  for (let i = 0; i <= 9; i++) {
    const y = TOP + (i / 9) * (BOT - TOP);
    ctx.beginPath(); ctx.moveTo(L, y);   ctx.lineTo(VX, VY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(R, y);   ctx.lineTo(VX, VY); ctx.stroke();
  }
  for (let i = 0; i <= 14; i++) {
    const x = L + (i / 14) * (R - L);
    ctx.beginPath(); ctx.moveTo(x, TOP); ctx.lineTo(VX, VY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, BOT); ctx.lineTo(VX, VY); ctx.stroke();
  }
  ctx.restore();
}

// ─── Right-side animated graphics (8 types) ──────────────────────────────────
const ANIM_CX = Math.round(CW * 0.73);
const ANIM_CY = Math.round(CH * 0.50);

function drawRightAnim(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  cardIdx: number,
  accent: string,
  alpha: number,
) {
  if (alpha <= 0.01) return;
  const t = elapsed * 0.001;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(ANIM_CX, ANIM_CY);
  switch (cardIdx % 8) {
    case 0: animBallOnLine(ctx, t, accent);   break;
    case 1: animExpandRings(ctx, t, accent);  break;
    case 2: animPendulum(ctx, t, accent);     break;
    case 3: animOrbit(ctx, t, accent);        break;
    case 4: animPulseWaves(ctx, t, accent);   break;
    case 5: animBounceBall(ctx, t, accent);   break;
    case 6: animPulseSquares(ctx, t, accent); break;
    case 7: animRotatingTris(ctx, t, accent); break;
  }
  ctx.restore();
}

// 0 · Ball on dashed line
function animBallOnLine(ctx: CanvasRenderingContext2D, t: number, accent: string) {
  const L = 300;
  const rawP = (t * 0.4) % 1;
  const p = rawP < 0.5 ? easeInOutQuad(rawP * 2) : 1 - easeInOutQuad((rawP - 0.5) * 2);
  const bx = L * 0.5 - p * L;
  ctx.setLineDash([14, 10]);
  ctx.strokeStyle = 'rgba(200,200,200,0.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.lineTo(L / 2, 0); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#ff6666'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-L / 2 + 22, -13); ctx.lineTo(-L / 2, 0); ctx.lineTo(-L / 2 + 22, 13);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(-L / 2, 0, 7, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,100,100,0.9)'; ctx.fill();
  for (let i = 1; i <= 5; i++) {
    const tp = ((t * 0.4 - i * 0.025) % 1 + 1) % 1;
    const te = tp < 0.5 ? easeInOutQuad(tp * 2) : 1 - easeInOutQuad((tp - 0.5) * 2);
    const tx = L * 0.5 - te * L;
    ctx.save(); ctx.globalAlpha = (1 - i / 6) * 0.55;
    ctx.beginPath(); ctx.arc(tx, 0, 9 - i * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = accent; ctx.fill();
    ctx.restore();
  }
  ctx.shadowColor = accent; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(bx, 0, 30, 0, Math.PI * 2);
  ctx.fillStyle = accent; ctx.fill();
  ctx.shadowBlur = 0;
}

// 1 · Expanding concentric rings
function animExpandRings(ctx: CanvasRenderingContext2D, t: number, accent: string) {
  const maxR = 160;
  for (let i = 0; i < 4; i++) {
    const phase = ((t * 0.5 + i * 0.25) % 1);
    const r = phase * maxR;
    ctx.save(); ctx.globalAlpha = (1 - phase) * 0.75;
    ctx.strokeStyle = accent; ctx.lineWidth = 2.5 - phase * 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  ctx.shadowColor = accent; ctx.shadowBlur = 22;
  ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.fillStyle = accent; ctx.fill();
  ctx.shadowBlur = 0;
}

// 2 · Pendulum
function animPendulum(ctx: CanvasRenderingContext2D, t: number, accent: string) {
  const ARM = 155;
  const angle = (Math.PI / 4) * Math.sin(t * 2.1);
  const ax = Math.sin(angle) * ARM, ay = Math.cos(angle) * ARM;
  const pivotY = -ARM * 0.05;
  ctx.beginPath(); ctx.arc(0, pivotY, 9, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(200,200,200,0.75)'; ctx.fill();
  ctx.strokeStyle = 'rgba(200,200,200,0.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, pivotY); ctx.lineTo(ax, pivotY + ay); ctx.stroke();
  ctx.shadowColor = accent; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(ax, pivotY + ay, 28, 0, Math.PI * 2);
  ctx.fillStyle = accent; ctx.fill();
  ctx.shadowBlur = 0;
}

// 3 · Orbiting planet
function animOrbit(ctx: CanvasRenderingContext2D, t: number, accent: string) {
  const R = 110, angle = t * 1.5;
  const bx = Math.cos(angle) * R, by = Math.sin(angle) * R;
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = 'rgba(200,200,200,0.22)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowColor = accent; ctx.shadowBlur = 28;
  ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fillStyle = accent; ctx.fill();
  ctx.shadowBlur = 0;
  for (let i = 6; i >= 1; i--) {
    const ta = angle - i * 0.14;
    ctx.save(); ctx.globalAlpha = (1 - i / 7) * 0.45;
    ctx.beginPath(); ctx.arc(Math.cos(ta) * R, Math.sin(ta) * R, 9 - i, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(bx, by, 16, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
}

// 4 · Pulsing waves
function animPulseWaves(ctx: CanvasRenderingContext2D, t: number, accent: string) {
  for (let i = 0; i < 5; i++) {
    const phase = ((t * 0.55 + i * 0.2) % 1);
    ctx.save(); ctx.globalAlpha = (1 - phase) * 0.6;
    ctx.strokeStyle = accent; ctx.lineWidth = 2.5 - phase * 1.8;
    ctx.beginPath(); ctx.arc(0, 0, 18 + phase * 155, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  ctx.shadowColor = accent; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fillStyle = accent; ctx.fill();
  ctx.shadowBlur = 0;
}

// 5 · Bouncing ball
function animBounceBall(ctx: CanvasRenderingContext2D, t: number, accent: string) {
  const H = 125;
  const rawP = (t * 0.85) % 1;
  const p = rawP < 0.5 ? rawP * 2 : 2 - rawP * 2;
  const ey = 1 - (1 - p) * (1 - p);
  const y = -H * ey;
  const sx = 1 + 0.28 * (1 - ey), sy = 1 - 0.18 * (1 - ey);
  ctx.strokeStyle = 'rgba(200,200,200,0.32)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(60, 0); ctx.stroke();
  ctx.save(); ctx.globalAlpha = 0.28 * (1 - ey);
  ctx.beginPath(); ctx.ellipse(0, 0, 30 * (1 - ey * 0.5), 7 * (1 - ey * 0.5), 0, 0, Math.PI * 2);
  ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();
  ctx.save(); ctx.translate(0, y); ctx.scale(sx, sy);
  ctx.shadowColor = accent; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.fillStyle = accent; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

// 6 · Pulsing nested squares
function animPulseSquares(ctx: CanvasRenderingContext2D, t: number, accent: string) {
  for (let i = 0; i < 4; i++) {
    const rot = t * 0.3 * (i % 2 === 0 ? 1 : -1) + i * 0.4;
    const phase = ((t * 0.5 + i * 0.25) % 1);
    const size = 40 + i * 38 + phase * 20;
    ctx.save(); ctx.rotate(rot);
    ctx.globalAlpha = i === 0 ? 0.85 : Math.max(0, 0.35 - phase * 0.25);
    ctx.strokeStyle = accent; ctx.lineWidth = i === 0 ? 2.5 : 1.5;
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    ctx.restore();
  }
}

// 7 · Rotating nested triangles
function animRotatingTris(ctx: CanvasRenderingContext2D, t: number, accent: string) {
  const tri = (r: number, rot: number, col: string, lw: number) => {
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = rot + (i / 3) * Math.PI * 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else         ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
  };
  tri(130, t * 0.4,                  accent + '88', 2);
  tri(88,  -t * 0.65 + Math.PI / 3,  accent + 'bb', 2);
  tri(50,  t * 1.1,                   accent,        2.5);
  ctx.shadowColor = accent; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fillStyle = accent; ctx.fill();
  ctx.shadowBlur = 0;
}

// ─── Single-line text helper (no wrapping, auto font-scale) ──────────────────
/**
 * Draw text as a single line. If wider than maxW, reduce fontSize proportionally.
 * Returns the actual font size used.
 */
function drawSingleLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  baseFsz: number,
  fontStyle: string,   // e.g. '900' | '500' | '400'
  fontFamily: string,
  maxW: number,
): number {
  if (!text) return baseFsz;
  let fsz = baseFsz;
  ctx.font = `${fontStyle} ${fsz}px ${fontFamily}`;
  const w = ctx.measureText(text).width;
  if (w > maxW) {
    fsz = Math.floor(baseFsz * (maxW / w));
    ctx.font = `${fontStyle} ${fsz}px ${fontFamily}`;
  }
  ctx.fillText(text, x, y);
  return fsz;
}

// ─── Left text content ────────────────────────────────────────────────────────
const TEXT_X     = 380;                                    // ~20% from left
const MAX_TEXT_W = Math.round(CW * 0.65) - TEXT_X;       // ≈860px — right boundary before animation

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

  const fontFamily = '"Noto Sans SC", "PingFang SC", sans-serif';

  // ── Configurable font sizes / colours ────────────────────────────────────
  const labelFsz = cityOptions?.labelFontSize ?? 108;
  const labelCol = (cityOptions?.labelColor && cityOptions.labelColor !== '')
    ? cityOptions.labelColor : accent;
  const shortFsz = cityOptions?.shortFontSize ?? 64;
  const shortCol = (cityOptions?.shortColor  && cityOptions.shortColor  !== '')
    ? cityOptions.shortColor  : 'rgba(255,255,255,0.95)';
  const descFsz  = cityOptions?.descFontSize  ?? 40;
  const descCol  = (cityOptions?.descColor    && cityOptions.descColor   !== '')
    ? cityOptions.descColor   : 'rgba(220,220,220,0.90)';

  // ── Generous line heights + gaps ─────────────────────────────────────────
  const labelLineH = labelFsz + 26;
  const shortLineH = shortFsz + 14;
  const descLineH  = descFsz  + 18;
  const GAP_LS     = 110;   // label → short
  const GAP_SD     = 55;    // short → desc

  // Label is always 1 line; short and desc also 1 line each
  const totalH = labelLineH + GAP_LS + shortLineH + GAP_SD + descLineH;
  const blockTopY = Math.round(CH / 2 - totalH / 2);

  // ── Entrance slide from left ───────────────────────────────────────────────
  const enterEase = easeOutCubic(clamp(slideElapsed / SLIDE_ENTER, 0, 1));
  const xOff = (1 - enterEase) * -150;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(xOff, 0);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';

  // Topic title — just above block
  const titleY = Math.max(50, blockTopY - 60);
  ctx.font = `400 30px ${fontFamily}`;
  ctx.fillStyle = 'rgba(200,200,200,0.45)';
  ctx.fillText(title || '', TEXT_X, titleY);

  // Vertical accent bar
  ctx.save();
  ctx.globalAlpha = alpha * 0.38 * enterEase;
  ctx.strokeStyle = labelCol; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(TEXT_X - 28, blockTopY - 10);
  ctx.lineTo(TEXT_X - 28, blockTopY + totalH + 10);
  ctx.stroke();
  ctx.restore();

  const labelText = `${slideIdx + 1}. ${point.label || ''}`;

  // ① Label — single line, accent colour, auto-scale
  const labelY = blockTopY;
  ctx.fillStyle = labelCol;
  ctx.shadowColor = labelCol; ctx.shadowBlur = 18;
  drawSingleLine(ctx, labelText, TEXT_X, labelY, labelFsz, '900', fontFamily, MAX_TEXT_W);
  ctx.shadowBlur = 0;

  // ② Short — single line
  const shortY = labelY + labelLineH + GAP_LS;
  ctx.fillStyle = shortCol;
  drawSingleLine(ctx, point.short || '', TEXT_X, shortY, shortFsz, '500', fontFamily, MAX_TEXT_W);

  // ③ Desc — single line
  const descY = shortY + shortLineH + GAP_SD;
  ctx.fillStyle = descCol;
  drawSingleLine(ctx, point.desc || '', TEXT_X, descY, descFsz, '400', fontFamily, MAX_TEXT_W);

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

  // Right animation (slight lead)
  const rightA = easeOutCubic(clamp(slideE / 500, 0, 1)) *
    (slideE > SLIDE_ENTER + SLIDE_HOLD
      ? 1 - clamp((slideE - SLIDE_ENTER - SLIDE_HOLD) / SLIDE_EXIT, 0, 1)
      : 1);
  drawRightAnim(ctx, elapsed, slideIdx, accent, rightA);

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
