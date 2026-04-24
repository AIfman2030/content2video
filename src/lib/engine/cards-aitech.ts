import type { GeneratedContent, PolyShape } from '../../types/video';
import { CW, CH, clamp, lerp, easeOutCubic, easeOutBack, hex2rgba, roundRect, wrapText, drawPolygon, drawStar, T } from './helpers';

const POLY_SIDES: Record<PolyShape, number> = {
  triangle: 3, quad: 4, pentagon: 5, hexagon: 6, octagon: 8, star5: 5, decagon: 10,
};

function polyForShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, shape: PolyShape, rot: number) {
  if (shape === 'star5') drawStar(ctx, cx, cy, r, r * 0.42, 5, rot);
  else drawPolygon(ctx, cx, cy, r, POLY_SIDES[shape], rot);
}

export function drawAITechCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  polyShape: PolyShape = 'hexagon',
) {
  const cx = CW / 2, cy = CH / 2;
  const POLY_R = 130;
  const CARD_RADIUS = 370;
  const CARD_W = 460, CARD_H = 130;
  const N = content.points.length;
  const rotation = elapsed * 0.0003;
  const pulse = 0.85 + 0.15 * Math.sin(elapsed * 0.002);

  // ── Central polygon (always drawn) ──
  ctx.save();
  // Outer glow ring
  const glowR = POLY_R * 1.6 * pulse;
  const glowGrad = ctx.createRadialGradient(cx, cy, POLY_R * 0.6, cx, cy, glowR);
  glowGrad.addColorStop(0, hex2rgba(accent, 0.18));
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);

  // Polygon fill
  polyForShape(ctx, cx, cy, POLY_R * pulse, polyShape, rotation);
  const polyFill = ctx.createRadialGradient(cx, cy - 20, 0, cx, cy, POLY_R);
  polyFill.addColorStop(0, hex2rgba(accent, 0.22));
  polyFill.addColorStop(1, hex2rgba(accent, 0.06));
  ctx.fillStyle = polyFill;
  ctx.fill();

  // Polygon stroke
  polyForShape(ctx, cx, cy, POLY_R * pulse, polyShape, rotation);
  ctx.strokeStyle = hex2rgba(accent, 0.85);
  ctx.lineWidth = 2.5;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner ring
  polyForShape(ctx, cx, cy, POLY_R * 0.6 * pulse, polyShape, rotation + Math.PI / POLY_SIDES[polyShape === 'star5' ? 'pentagon' : polyShape]);
  ctx.strokeStyle = hex2rgba(accent2, 0.35);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // ── Cards (sequential) ──
  if (elapsed < T.cardBase) return;
  const cardElapsed = elapsed - T.cardBase;

  content.points.forEach((point, i) => {
    const te = cardElapsed - i * T.cardSlot;
    if (te <= 0) return;

    const angle = -Math.PI / 2 + (i / N) * Math.PI * 2;
    const cardCx = cx + CARD_RADIUS * Math.cos(angle);
    const cardCy = cy + CARD_RADIUS * Math.sin(angle);
    const cardX = cardCx - CARD_W / 2;
    const cardY = cardCy - CARD_H / 2;

    // Line from polygon edge → card
    const lineT = clamp(te / 400, 0, 1);
    const lineEased = easeOutCubic(lineT);
    const lineStartX = cx + POLY_R * Math.cos(angle);
    const lineStartY = cy + POLY_R * Math.sin(angle);
    const lineEndX = cx + (CARD_RADIUS - CARD_W * 0.45) * Math.cos(angle);
    const lineEndY = cy + (CARD_RADIUS - CARD_H * 0.45) * Math.sin(angle);
    const lineCurX = lerp(lineStartX, lineEndX, lineEased);
    const lineCurY = lerp(lineStartY, lineEndY, lineEased);

    ctx.save();
    ctx.strokeStyle = hex2rgba(accent, 0.6 * lineEased);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -(elapsed * 0.04);
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(lineStartX, lineStartY);
    ctx.lineTo(lineCurX, lineCurY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Card
    if (lineT < 0.5) return;
    const cardT = clamp((te - 300) / 400, 0, 1);
    const cardEased = easeOutBack(Math.min(cardT, 0.999));
    const alpha = clamp((te - 300) / 250, 0, 1);
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cardCx, cardCy);
    ctx.scale(lerp(0.85, 1, cardEased), lerp(0.85, 1, cardEased));
    ctx.translate(-cardCx, -cardCy);

    // Card background
    roundRect(ctx, cardX, cardY, CARD_W, CARD_H, 10);
    ctx.fillStyle = 'rgba(8,14,32,0.88)';
    ctx.fill();

    // Card border gradient
    roundRect(ctx, cardX, cardY, CARD_W, CARD_H, 10);
    const bord = ctx.createLinearGradient(cardX, cardY, cardX + CARD_W, cardY + CARD_H);
    bord.addColorStop(0, hex2rgba(accent, 0.7));
    bord.addColorStop(1, hex2rgba(accent2, 0.25));
    ctx.strokeStyle = bord;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Left accent bar
    roundRect(ctx, cardX, cardY, 5, CARD_H, 10);
    ctx.fillStyle = hex2rgba(accent, 0.8 * cardEased);
    ctx.fill();

    // Number circle
    ctx.beginPath();
    ctx.arc(cardX + 32, cardCy, 18, 0, Math.PI * 2);
    const nbg = ctx.createRadialGradient(cardX + 32, cardCy - 4, 0, cardX + 32, cardCy, 18);
    nbg.addColorStop(0, hex2rgba(accent, 0.4));
    nbg.addColorStop(1, hex2rgba(accent, 0.1));
    ctx.fillStyle = nbg;
    ctx.fill();
    ctx.strokeStyle = hex2rgba(accent, 0.8);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = `700 18px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${i + 1}`, cardX + 32, cardCy);

    // Label
    ctx.shadowColor = hex2rgba(accent, 0.7);
    ctx.shadowBlur = 14;
    ctx.font = `800 52px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = accent;
    ctx.fillText(point.label, cardX + 62, cardY + 18);
    ctx.shadowBlur = 0;

    // Short text
    ctx.font = `400 26px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText(point.short || '', cardX + 62, cardY + 80);

    // Right edge decorative polygon
    ctx.save();
    ctx.translate(cardX + CARD_W - 30, cardCy);
    ctx.rotate(elapsed * 0.001 + i * 0.8);
    ctx.strokeStyle = hex2rgba(accent2, 0.4);
    ctx.lineWidth = 1.5;
    polyForShape(ctx, 0, 0, 14, polyShape, 0);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  });

  // Edge glow dots at polygon vertices
  const sides = POLY_SIDES[polyShape === 'star5' ? 'pentagon' : polyShape];
  for (let v = 0; v < sides; v++) {
    const va = (v / sides) * Math.PI * 2 + rotation;
    const vx = cx + POLY_R * pulse * Math.cos(va);
    const vy = cy + POLY_R * pulse * Math.sin(va);
    const dotAlpha = 0.4 + 0.6 * Math.abs(Math.sin(elapsed * 0.002 + v * 1.1));
    ctx.beginPath();
    ctx.arc(vx, vy, 4, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(v < N && elapsed > T.cardBase + v * T.cardSlot ? accent : accent2, dotAlpha);
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
