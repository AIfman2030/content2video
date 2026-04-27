import type { GeneratedContent, PolyShape } from '../../types/video';
import { CW, CH, clamp, easeOutBack, easeOutCubic, hex2rgba, wrapText, T,
  drawPolygon, drawStar } from './helpers';

const POLY_SIDES: Record<PolyShape, number> = {
  triangle: 3, quad: 4, pentagon: 5, hexagon: 6, octagon: 8, star5: 5, decagon: 10,
};
const CX = CW / 2, CY = CH / 2;
const CARD_RADIUS = 370;

function getScale(displayN: number) {
  if (displayN <= 5) return 1;
  if (displayN <= 7) return 0.82;
  return 0.68;
}

export function drawAITechCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  polyShape: PolyShape,
): void {
  const n        = content.points.length;
  const displayN = Math.min(n, 10);
  const scale    = getScale(displayN);

  // Card body only (no footer — desc goes OUTSIDE below card)
  const CARD_W   = Math.round(320 * scale);
  const CARD_H   = Math.round(148 * scale);   // body only
  const POLY_R   = Math.round(145 * scale);
  const lFsz     = Math.round(44 * scale);    // large label
  const sFsz     = Math.round(28 * scale);    // short subtitle
  const dFsz     = Math.round(24 * scale);    // desc below card
  const dLineH   = Math.round(34 * scale);    // desc line height
  const cr       = Math.round(14 * scale);
  const sides    = polyShape === 'star5' ? 5 : POLY_SIDES[polyShape] ?? 6;

  // ── Background rings ─────────────────────────────────────────────────────
  if (elapsed > 200) {
    const bgA = clamp((elapsed - 200) / 800, 0, 1) * 0.4;
    for (let r = 1; r <= 3; r++) {
      const rad   = CARD_RADIUS * (0.55 + r * 0.18);
      const pulse = 1 + 0.025 * Math.sin(elapsed * 0.0008 + r);
      ctx.save(); ctx.globalAlpha = bgA * (0.35 - r * 0.05);
      ctx.strokeStyle = r % 2 === 0 ? accent : accent2; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 10]); ctx.beginPath();
      ctx.arc(CX, CY, rad * pulse, 0, Math.PI * 2); ctx.stroke();
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
    ctx.shadowColor = accent; ctx.shadowBlur = 20;
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(CX, CY, 12, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }

  // ── Cards ─────────────────────────────────────────────────────────────────
  for (let i = 0; i < displayN; i++) {
    const te    = elapsed - T.cardBase - i * T.cardSlot;
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

    const cx0    = dcx - CARD_W / 2;
    const cy0    = dcy - CARD_H / 2;

    // Connector line
    if (eased > 0.3) {
      ctx.save(); ctx.globalAlpha = alpha * 0.55;
      const gl = ctx.createLinearGradient(CX, CY, cardCX, cardCY);
      gl.addColorStop(0, hex2rgba(accent, 0.8)); gl.addColorStop(1, hex2rgba(accent2, 0.2));
      ctx.strokeStyle = gl; ctx.lineWidth = 1.5; ctx.setLineDash([5, 8]);
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(angle) * POLY_R, CY + Math.sin(angle) * POLY_R);
      ctx.lineTo(dcx - Math.cos(angle) * CARD_W / 2, dcy - Math.sin(angle) * CARD_H / 2);
      ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }

    ctx.save(); ctx.globalAlpha = alpha;

    // ── Card background (scale-in) ─────────────────────────────────────────
    ctx.save();
    ctx.translate(cx0, cy0); ctx.scale(eased, eased); ctx.translate(-cx0, -cy0);

    const cardBg = ctx.createLinearGradient(cx0, cy0, cx0, cy0 + CARD_H);
    cardBg.addColorStop(0, hex2rgba(accent, 0.20));
    cardBg.addColorStop(1, hex2rgba(accent, 0.07));
    ctx.fillStyle = cardBg;
    ctx.beginPath(); ctx.roundRect(cx0, cy0, CARD_W, CARD_H, cr); ctx.fill();

    ctx.shadowColor = accent; ctx.shadowBlur = 20;
    const bord = ctx.createLinearGradient(cx0, cy0, cx0 + CARD_W, cy0);
    bord.addColorStop(0, hex2rgba(accent, 0.95));
    bord.addColorStop(1, hex2rgba(accent2, 0.55));
    ctx.strokeStyle = bord; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(cx0, cy0, CARD_W, CARD_H, cr); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore(); // end scale-in

    const point   = content.points[i];
    const bodyMidY = cy0 + CARD_H / 2;

    // ── Label (大标题) ─────────────────────────────────────────────────────
    ctx.shadowColor = hex2rgba(accent, 0.95); ctx.shadowBlur = 24;
    ctx.font = `900 ${lFsz}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(point.label, dcx, bodyMidY - Math.round(22 * scale));
    ctx.shadowBlur = 0;

    // ── Short (小标题) ─────────────────────────────────────────────────────
    if (point.short) {
      ctx.shadowColor = hex2rgba(accent2, 0.7); ctx.shadowBlur = 10;
      ctx.font = `600 ${sFsz}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = hex2rgba(accent2, 1.0);
      const short = point.short.length > 14 ? point.short.slice(0, 13) + '…' : point.short;
      ctx.fillText(short, dcx, bodyMidY + Math.round(26 * scale));
      ctx.shadowBlur = 0;
    }

    // ── Number badge (top-right) ────────────────────────────────────────────
    ctx.font = `600 ${Math.round(16 * scale)}px monospace`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillStyle = hex2rgba(accent, 0.72);
    ctx.fillText(`${String(i + 1).padStart(2, '0')}`, cx0 + CARD_W - 8, cy0 + 6);

    // ── Desc: OUTSIDE card, below bottom border, up to 2 lines ───────────
    if (point.desc) {
      ctx.font = `500 ${dFsz}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const descMaxW = CARD_W + Math.round(20 * scale); // slightly wider than card
      const descLines = wrapText(ctx, point.desc, descMaxW).slice(0, 2);
      const descStartY = dcy + CARD_H / 2 + Math.round(10 * scale);

      descLines.forEach((line, li) => {
        const lineY  = descStartY + li * dLineH + dFsz / 2;
        const lw     = ctx.measureText(line).width;

        // Readable dark pill background
        ctx.save(); ctx.globalAlpha = alpha * 0.72;
        ctx.fillStyle = 'rgba(0,4,18,0.68)';
        ctx.beginPath();
        ctx.roundRect(dcx - lw / 2 - 14, lineY - dFsz / 2 - 5, lw + 28, dFsz + 10, 8);
        ctx.fill();
        ctx.restore();

        // Bright text
        ctx.fillStyle = 'rgba(255,255,255,0.97)';
        ctx.fillText(line, dcx, lineY);
      });
    }

    ctx.restore(); // globalAlpha

    // Glowing dot
    ctx.save(); ctx.globalAlpha = alpha * 0.6;
    ctx.shadowColor = accent2; ctx.shadowBlur = 15;
    ctx.fillStyle = accent2;
    ctx.beginPath(); ctx.arc(dcx, dcy, 4 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }
}
