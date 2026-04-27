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
  const n = content.points.length;
  const displayN = Math.min(n, 10);
  const scale = getScale(displayN);

  // ── Card dimensions ────────────────────────────────────────────────────────
  const CARD_W   = Math.round(340 * scale);
  // card body = upper 65%, footer (desc) = lower 35%
  const BODY_H   = Math.round(155 * scale);
  const FOOT_H   = Math.round(68 * scale);
  const CARD_H   = BODY_H + FOOT_H;
  const POLY_R   = Math.round(145 * scale);
  const lFsz     = Math.round(42 * scale);   // large label
  const sFsz     = Math.round(28 * scale);   // short subtitle
  const dFsz     = Math.round(22 * scale);   // desc in footer
  const cr       = Math.round(14 * scale);
  const sides    = polyShape === 'star5' ? 5 : POLY_SIDES[polyShape] ?? 6;

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

    // Card top-left corner
    const cx0 = dcx - CARD_W / 2;
    const cy0 = dcy - CARD_H / 2;

    // Connector line (polygon center → card)
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

    // ── Full card bg (scale-in) ──────────────────────────────────────────────
    ctx.save();
    ctx.translate(cx0, cy0); ctx.scale(eased, eased); ctx.translate(-cx0, -cy0);

    // Body bg
    const bodyBg = ctx.createLinearGradient(cx0, cy0, cx0, cy0 + BODY_H);
    bodyBg.addColorStop(0, hex2rgba(accent, 0.18));
    bodyBg.addColorStop(1, hex2rgba(accent, 0.08));
    ctx.fillStyle = bodyBg;
    ctx.beginPath(); ctx.roundRect(cx0, cy0, CARD_W, BODY_H, [cr, cr, 0, 0]); ctx.fill();

    // Footer bg (distinct color — clearly "outside" the main content zone)
    const footerY = cy0 + BODY_H;
    const footBg = ctx.createLinearGradient(cx0, footerY, cx0, footerY + FOOT_H);
    footBg.addColorStop(0, hex2rgba(accent2, 0.22));
    footBg.addColorStop(1, hex2rgba(accent2, 0.10));
    ctx.fillStyle = footBg;
    ctx.beginPath(); ctx.roundRect(cx0, footerY, CARD_W, FOOT_H, [0, 0, cr, cr]); ctx.fill();

    // Border — full card
    ctx.shadowColor = accent; ctx.shadowBlur = 18;
    const bord = ctx.createLinearGradient(cx0, cy0, cx0 + CARD_W, cy0);
    bord.addColorStop(0, hex2rgba(accent, 0.9));
    bord.addColorStop(1, hex2rgba(accent2, 0.5));
    ctx.strokeStyle = bord; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(cx0, cy0, CARD_W, CARD_H, cr); ctx.stroke();
    ctx.shadowBlur = 0;

    // Separator line (body / footer divider)
    ctx.strokeStyle = hex2rgba(accent2, 0.55); ctx.lineWidth = 1;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.moveTo(cx0 + 14, footerY); ctx.lineTo(cx0 + CARD_W - 14, footerY);
    ctx.stroke(); ctx.setLineDash([]);

    ctx.restore(); // end scale-in

    const point = content.points[i];

    // ── Body text ─────────────────────────────────────────────────────────────
    const bodyMidY = cy0 + BODY_H / 2;

    // Label (大标题) — big, bright white with strong glow
    ctx.shadowColor = accent; ctx.shadowBlur = 22;
    ctx.font = `900 ${lFsz}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(point.label, dcx, bodyMidY - Math.round(24 * scale));
    ctx.shadowBlur = 0;

    // Short (小标题) — bright, accent2 color
    if (point.short) {
      ctx.shadowColor = hex2rgba(accent2, 0.6); ctx.shadowBlur = 8;
      ctx.font = `600 ${sFsz}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = hex2rgba(accent2, 1.0);
      const short = point.short.length > 14 ? point.short.slice(0, 13) + '…' : point.short;
      ctx.fillText(short, dcx, bodyMidY + Math.round(28 * scale));
      ctx.shadowBlur = 0;
    }

    // ── Footer: desc (辅助解释) — placed at bottom edge of card ──────────────
    if (point.desc) {
      const footCY = footerY + FOOT_H / 2;
      ctx.font = `500 ${dFsz}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      // Truncate at ~22 characters to fit card width
      const maxChars = Math.floor(CARD_W / (dFsz * 0.62));
      const descText = point.desc.length > maxChars
        ? point.desc.slice(0, maxChars - 1) + '…'
        : point.desc;
      ctx.fillText(descText, dcx, footCY);
    }

    // Number indicator (top-right corner of body)
    ctx.font = `600 ${Math.round(16 * scale)}px monospace`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillStyle = hex2rgba(accent, 0.70);
    ctx.fillText(`${String(i + 1).padStart(2, '0')}`, cx0 + CARD_W - 8, cy0 + 6);

    ctx.restore(); // globalAlpha

    // Glowing dot at card center
    ctx.save(); ctx.globalAlpha = alpha * 0.6;
    ctx.shadowColor = accent2; ctx.shadowBlur = 15;
    ctx.fillStyle = accent2;
    ctx.beginPath(); ctx.arc(dcx, dcy, 4 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }
}
