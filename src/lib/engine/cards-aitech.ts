import type { GeneratedContent, PolyShape } from '../../types/video';
import { CW, CH, clamp, easeOutBack, easeOutCubic, hex2rgba, T,
  drawPolygon, drawStar } from './helpers';

const POLY_SIDES: Record<PolyShape, number> = {
  triangle: 3, quad: 4, pentagon: 5, hexagon: 6, octagon: 8, star5: 5, decagon: 10,
};
const CX = CW / 2, CY = CH / 2;
const CARD_RADIUS = 370;

// Per-item auto-scale based on item count
function getScale(displayN: number) {
  if (displayN <= 6) return 1;
  if (displayN <= 8) return 0.78;
  return 0.63;
}

export function drawAITechCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  polyShape: PolyShape,
): void {
  const n = content.points.length;
  const displayN = Math.min(n, 10);
  const scale = getScale(displayN);
  const CARD_W  = Math.round(280 * scale);
  const CARD_H  = Math.round(150 * scale);
  const POLY_R  = Math.round(145 * scale);
  const lFsz    = Math.round(28 * scale);
  const sFsz    = Math.round(22 * scale);
  const cr      = Math.round(14 * scale);
  const sides   = polyShape === 'star5' ? 5 : POLY_SIDES[polyShape] ?? 6;

  // ── Background rings ─────────────────────────────────────────────────────
  if (elapsed > 200) {
    const bgA = clamp((elapsed - 200) / 800, 0, 1) * 0.4;
    for (let r = 1; r <= 3; r++) {
      const rad = CARD_RADIUS * (0.55 + r * 0.18);
      const pulse = 1 + 0.025 * Math.sin(elapsed * 0.0008 + r);
      ctx.save(); ctx.globalAlpha = bgA * (0.35 - r * 0.05);
      ctx.strokeStyle = r % 2 === 0 ? accent : accent2; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 10]); ctx.beginPath(); ctx.arc(CX, CY, rad * pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
  }

  // ── Polygon ───────────────────────────────────────────────────────────────
  if (elapsed > T.cardBase) {
    const polyA = easeOutCubic(clamp((elapsed - T.cardBase) / 600, 0, 1));
    ctx.save(); ctx.globalAlpha = polyA;
    ctx.shadowColor = accent; ctx.shadowBlur = 30;
    ctx.strokeStyle = accent; ctx.lineWidth = 4;
    if (polyShape === 'star5') drawStar(ctx, CX, CY, POLY_R, POLY_R * 0.45, 5);
    else drawPolygon(ctx, CX, CY, POLY_R, sides);
    ctx.stroke();
    ctx.shadowBlur = 18; ctx.lineWidth = 2; ctx.strokeStyle = accent2;
    if (polyShape === 'star5') drawStar(ctx, CX, CY, POLY_R * 0.62, POLY_R * 0.28, 5);
    else drawPolygon(ctx, CX, CY, POLY_R * 0.62, sides);
    ctx.stroke(); ctx.shadowBlur = 0;
    // Center dot
    ctx.shadowColor = accent; ctx.shadowBlur = 20;
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(CX, CY, 12, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }

  // ── Cards ─────────────────────────────────────────────────────────────────
  for (let i = 0; i < displayN; i++) {
    const te = elapsed - T.cardBase - i * T.cardSlot;
    if (te <= 0) continue;

    const enterT = clamp(te / 500, 0, 1);
    const eased  = easeOutBack(Math.min(enterT, 0.999));
    const angle  = (i / displayN) * Math.PI * 2 - Math.PI / 2;
    const cardCX = CX + Math.cos(angle) * CARD_RADIUS;
    const cardCY = CY + Math.sin(angle) * CARD_RADIUS;
    const slideR = (1 - eased) * 60;
    const dcx    = cardCX + Math.cos(angle) * slideR;
    const dcy    = cardCY + Math.sin(angle) * slideR;
    const alpha  = clamp(te / 350, 0, 1);

    // Connector line (polygon center → card)
    if (eased > 0.3) {
      ctx.save(); ctx.globalAlpha = alpha * 0.55;
      const gl = ctx.createLinearGradient(CX, CY, cardCX, cardCY);
      gl.addColorStop(0, hex2rgba(accent, 0.8)); gl.addColorStop(1, hex2rgba(accent2, 0.2));
      ctx.strokeStyle = gl; ctx.lineWidth = 1.5; ctx.setLineDash([5, 8]);
      ctx.beginPath(); ctx.moveTo(CX + Math.cos(angle) * POLY_R, CY + Math.sin(angle) * POLY_R);
      ctx.lineTo(cardCX - Math.cos(angle) * CARD_W / 2, cardCY - Math.sin(angle) * CARD_H / 2);
      ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }

    // Card background
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.save(); ctx.translate(dcx - CARD_W / 2, dcy - CARD_H / 2); ctx.scale(eased, eased); ctx.translate(-(dcx - CARD_W / 2), -(dcy - CARD_H / 2));
    ctx.fillStyle = hex2rgba(accent, 0.12);
    ctx.beginPath(); ctx.roundRect(dcx - CARD_W / 2, dcy - CARD_H / 2, CARD_W, CARD_H, cr); ctx.fill();
    ctx.shadowColor = accent; ctx.shadowBlur = 16;
    const bg = ctx.createLinearGradient(dcx - CARD_W/2, dcy, dcx + CARD_W/2, dcy);
    bg.addColorStop(0, hex2rgba(accent, 0.4)); bg.addColorStop(1, hex2rgba(accent2, 0.2));
    ctx.strokeStyle = bg; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(dcx - CARD_W / 2, dcy - CARD_H / 2, CARD_W, CARD_H, cr); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();

    const point = content.points[i];
    // Label
    ctx.shadowColor = hex2rgba(accent, 0.9); ctx.shadowBlur = 14;
    ctx.font = `800 ${lFsz}px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText(point.label, dcx, dcy - CARD_H * 0.1);
    ctx.shadowBlur = 0;
    // Subtitle
    if (point.short) {
      ctx.font = `400 ${sFsz}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = hex2rgba(accent2, 0.9);
      const short = point.short.length > 14 ? point.short.slice(0, 13) + '…' : point.short;
      ctx.fillText(short, dcx, dcy + CARD_H * 0.28);
    }
    // Number indicator
    ctx.font = `600 ${Math.round(16*scale)}px monospace`; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillStyle = hex2rgba(accent, 0.5);
    ctx.fillText(`${String(i + 1).padStart(2, '0')}`, dcx + CARD_W/2 - 8, dcy - CARD_H/2 + 6);
    ctx.restore();

    // Glowing dot at card center
    ctx.save(); ctx.globalAlpha = alpha * 0.6;
    ctx.shadowColor = accent2; ctx.shadowBlur = 15;
    ctx.fillStyle = accent2;
    ctx.beginPath(); ctx.arc(dcx, dcy, 4 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }
}
