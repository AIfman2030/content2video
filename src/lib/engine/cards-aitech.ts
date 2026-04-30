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
  const CARD_W   = Math.round(340 * scale);
  // CARD_H is computed per-card (adaptive) — see loop below
  const POLY_R   = Math.round(145 * scale);
  const lFsz     = Math.round(70 * scale);    // main label (yellow)
  const sFsz     = Math.round(48 * scale);    // short subtitle
  const dFsz     = Math.round(42 * scale);    // desc beside/below card (reduced 10px)
  const dLineH   = Math.round(64 * scale);    // desc line height
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

    const point = content.points[i];

    // ── Adaptive CARD_H: compute required height from actual wrapped text ──
    const PAD_Y      = Math.round(18 * scale);
    const LABEL_GAP  = Math.round(12 * scale);
    ctx.font = `700 ${sFsz}px "Noto Sans SC", sans-serif`;
    const shortLines  = point.short
      ? wrapText(ctx, point.short, CARD_W - Math.round(20 * scale)).slice(0, 2)
      : [];
    const shortLineH  = sFsz + Math.round(8 * scale);
    const shortBlockH = shortLines.length > 0
      ? shortLines.length * shortLineH - (shortLineH - sFsz)
      : 0;
    const CARD_H = lFsz + (shortLines.length > 0 ? LABEL_GAP + shortBlockH : 0) + PAD_Y * 2;

    const cx0     = dcx - CARD_W / 2;
    const cy0     = dcy - CARD_H / 2;
    const labelY  = cy0 + PAD_Y + lFsz / 2;
    const shortStartY = labelY + lFsz / 2 + LABEL_GAP + sFsz / 2;

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

    // ── Label (大标题 — YELLOW) ────────────────────────────────────────────
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 28;
    ctx.font = `900 ${lFsz}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe655';
    ctx.fillText(point.label, dcx, labelY);
    ctx.shadowBlur = 0;

    // ── Short (副标题 — white + accent glow) ───────────────────────────────
    if (shortLines.length > 0) {
      ctx.shadowColor = accent2; ctx.shadowBlur = 22;
      ctx.font = `700 ${sFsz}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.98)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      shortLines.forEach((line, li) => {
        ctx.fillText(line, dcx, shortStartY + li * shortLineH);
      });
      ctx.shadowBlur = 0;
    }

    // ── Number badge (top-right) ────────────────────────────────────────────
    ctx.font = `600 ${Math.round(16 * scale)}px monospace`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillStyle = hex2rgba(accent, 0.72);
    ctx.fillText(`${String(i + 1).padStart(2, '0')}`, cx0 + CARD_W - 8, cy0 + 6);

    // ── Desc: placed BESIDE or ABOVE/BELOW card based on position ────────
    if (point.desc) {
      ctx.font = `500 ${dFsz}px "Noto Sans SC", sans-serif`;
      const descMaxW = CARD_W + Math.round(10 * scale);
      const descLines = wrapText(ctx, point.desc, descMaxW).slice(0, 4);

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const isLeft   = cosA < -0.35;
      const isRight  = cosA > 0.35;
      const isBottom = !isLeft && !isRight && sinA > 0;  // center-bottom
      const GAP      = Math.round(14 * scale);

      const blockH = descLines.length * dFsz + (descLines.length - 1) * (dLineH - dFsz);

      descLines.forEach((line, li) => {
        const lw = ctx.measureText(line).width;

        if (isLeft) {
          const textX = cx0 - GAP;
          // clamp Y so text never exits canvas
          const rawY  = dcy - blockH / 2 + li * dLineH + dFsz / 2;
          const lineY = Math.max(dFsz / 2 + 5, Math.min(rawY, CH - dFsz / 2 - 5));
          ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          ctx.save(); ctx.globalAlpha = alpha * 0.72;
          ctx.fillStyle = 'rgba(0,4,18,0.68)';
          ctx.beginPath();
          ctx.roundRect(textX - lw - 14, lineY - dFsz / 2 - 5, lw + 28, dFsz + 10, 8);
          ctx.fill(); ctx.restore();
          ctx.fillStyle = 'rgba(255,168,48,0.97)';
          ctx.fillText(line, textX, lineY);

        } else if (isRight) {
          const textX = cx0 + CARD_W + GAP;
          const rawY  = dcy - blockH / 2 + li * dLineH + dFsz / 2;
          const lineY = Math.max(dFsz / 2 + 5, Math.min(rawY, CH - dFsz / 2 - 5));
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.save(); ctx.globalAlpha = alpha * 0.72;
          ctx.fillStyle = 'rgba(0,4,18,0.68)';
          ctx.beginPath();
          ctx.roundRect(textX - 14, lineY - dFsz / 2 - 5, lw + 28, dFsz + 10, 8);
          ctx.fill(); ctx.restore();
          ctx.fillStyle = 'rgba(255,168,48,0.97)';
          ctx.fillText(line, textX, lineY);

        } else if (isBottom) {
          // Card is in the lower half — put description ABOVE the card
          const descEndY   = dcy - CARD_H / 2 - Math.round(10 * scale);
          const belowY     = descEndY - (descLines.length - 1 - li) * dLineH - dFsz / 2;
          const lineY = Math.max(dFsz / 2 + 5, Math.min(belowY, CH - dFsz / 2 - 5));
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.save(); ctx.globalAlpha = alpha * 0.72;
          ctx.fillStyle = 'rgba(0,4,18,0.68)';
          ctx.beginPath();
          ctx.roundRect(dcx - lw / 2 - 14, lineY - dFsz / 2 - 5, lw + 28, dFsz + 10, 8);
          ctx.fill(); ctx.restore();
          ctx.fillStyle = 'rgba(255,168,48,0.97)';
          ctx.fillText(line, dcx, lineY);

        } else {
          // Top center — put description BELOW the card
          const descStartY = dcy + CARD_H / 2 + Math.round(10 * scale);
          const rawY       = descStartY + li * dLineH + dFsz / 2;
          const lineY = Math.max(dFsz / 2 + 5, Math.min(rawY, CH - dFsz / 2 - 5));
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.save(); ctx.globalAlpha = alpha * 0.72;
          ctx.fillStyle = 'rgba(0,4,18,0.68)';
          ctx.beginPath();
          ctx.roundRect(dcx - lw / 2 - 14, lineY - dFsz / 2 - 5, lw + 28, dFsz + 10, 8);
          ctx.fill(); ctx.restore();
          ctx.fillStyle = 'rgba(255,168,48,0.97)';
          ctx.fillText(line, dcx, lineY);
        }
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
