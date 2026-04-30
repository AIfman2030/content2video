import type { GeneratedContent, StyleType, PolyShape, ChineseOptions } from '../../types/video';
import { CW, CH, clamp, easeOutBack, hex2rgba, roundRect, wrapText, T, PAGE_SIZE, PAGE_HOLD, PAGE_TRANS } from './helpers';
import { drawCityCards } from './cards-city';
import { drawAITechCards } from './cards-aitech';

export function drawCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  style: StyleType,
  shapeImg: HTMLImageElement,
  polyShape?: PolyShape,
  coverIndex = 0,
  chineseOptions?: ChineseOptions,
) {
  if (style === 'city') { drawCityCards(ctx, elapsed, content, accent, accent2, shapeImg, coverIndex); return; }
  if (style === 'aitech') { drawAITechCards(ctx, elapsed, content, accent, accent2, polyShape ?? 'hexagon'); return; }

  // ── Chinese style: rectangular card grid with auto-pagination ──
  if (elapsed < T.cardBase) return;

  const MARGIN = 30, GAP = 30, COLS = 2;
  const cardW = (CW - MARGIN * 2 - GAP) / 2;
  const cardH = 268, rowGap = 26, startY = 160;
  const n = content.points.length;
  const pageSlot  = PAGE_SIZE * T.cardSlot;
  const pageTotal = pageSlot + PAGE_HOLD;
  const pageElapsed = elapsed - T.cardBase;
  const numPages = Math.ceil(n / PAGE_SIZE);
  const curPage  = Math.min(Math.floor(pageElapsed / pageTotal), numPages - 1);
  const withinPage = pageElapsed - curPage * pageTotal;
  const outA = curPage < numPages - 1 ? clamp(1 - (withinPage - pageSlot) / PAGE_TRANS, 0, 1) : 1;

  const startCard = curPage * PAGE_SIZE;
  const endCard   = Math.min(startCard + PAGE_SIZE, n);

  for (let i = startCard; i < endCard; i++) {
    const localI = i - startCard;
    const te = withinPage - localI * T.cardSlot;
    if (te <= 0) continue;

    const enterT = clamp(te / 500, 0, 1);
    const eased  = easeOutBack(Math.min(enterT, 0.999));
    const colIdx = localI % COLS, rowIdx = Math.floor(localI / COLS);
    const cardX  = MARGIN + colIdx * (cardW + GAP);
    const cardY  = startY + rowIdx * (cardH + rowGap);

    ctx.save();
    ctx.globalAlpha = clamp(te / 300, 0, 1) * outA;
    ctx.translate(cardX + (1 - eased) * 120 + cardW / 2, cardY + cardH / 2);
    ctx.translate(-cardW / 2, -cardH / 2);

    // Card bg + border
    roundRect(ctx, 0, 0, cardW, cardH, 18);
    const bg = ctx.createLinearGradient(0, 0, cardW, cardH);
    bg.addColorStop(0, 'rgba(255,255,255,0.07)'); bg.addColorStop(1, hex2rgba(accent, 0.08));
    ctx.fillStyle = bg; ctx.fill();
    roundRect(ctx, 0, 0, cardW, cardH, 18);
    const bord = ctx.createLinearGradient(0, 0, cardW, cardH);
    bord.addColorStop(0, hex2rgba(accent, 0.7)); bord.addColorStop(1, hex2rgba(accent2, 0.3));
    ctx.strokeStyle = bord; ctx.lineWidth = 2; ctx.stroke();

    // Ink-drip left bar
    ctx.fillStyle = accent;
    roundRect(ctx, 0, 20, 6, (cardH - 40) * eased, 3); ctx.fill();
    ctx.beginPath(); ctx.arc(3, 20 + (cardH - 40) * eased, 8, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, 0.5); ctx.fill();

    // Number badge
    const badgeX = 55, badgeY = cardH / 2;
    ctx.beginPath(); ctx.arc(badgeX, badgeY, 50, 0, Math.PI * 2);
    const nbg = ctx.createRadialGradient(badgeX, badgeY - 10, 0, badgeX, badgeY, 50);
    nbg.addColorStop(0, hex2rgba(accent, 0.35)); nbg.addColorStop(1, hex2rgba(accent, 0.1));
    ctx.fillStyle = nbg; ctx.fill();
    ctx.strokeStyle = hex2rgba(accent, 0.8); ctx.lineWidth = 2;
    ctx.shadowColor = accent; ctx.shadowBlur = 15; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.font = `800 52px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText(`${i + 1}`, badgeX, badgeY);

    // Text — sizes and colours configurable via chineseOptions
    // ctx.textBaseline is 'middle' (set by the badge section above)
    const tFsz = chineseOptions?.titleFontSize ?? 68;
    const sFsz = chineseOptions?.shortFontSize ?? 36;
    const dFsz = chineseOptions?.descFontSize  ?? 32;
    const tClr = chineseOptions?.titleColor || accent;
    const sClr = chineseOptions?.shortColor || accent2;
    const dClr = chineseOptions?.descColor  || 'rgba(255,255,255,0.92)';
    const lineH = Math.round(dFsz * 1.28);

    // Vertical layout respects textBaseline='middle'
    const labelY  = 82;
    const shortY  = labelY + Math.round(tFsz / 2) + Math.round(sFsz / 2) + 8;
    const descY0  = shortY + Math.round(sFsz / 2) + Math.round(dFsz / 2) + 12;

    const textX = 130, textAvailW = cardW - textX - 90;
    const point = content.points[i];
    ctx.shadowColor = hex2rgba(accent, 0.7); ctx.shadowBlur = 20;
    ctx.font = `800 ${tFsz}px "Noto Sans SC", sans-serif`; ctx.textAlign = 'left';
    ctx.fillStyle = tClr; ctx.fillText(point.label, textX, labelY); ctx.shadowBlur = 0;
    ctx.font = `600 ${sFsz}px "Noto Sans SC", sans-serif`; ctx.fillStyle = sClr;
    ctx.fillText(point.short || '', textX, shortY);
    ctx.font = `400 ${dFsz}px "Noto Sans SC", sans-serif`; ctx.fillStyle = dClr;
    wrapText(ctx, point.desc || '', textAvailW).slice(0, 2).forEach((l, li) =>
      ctx.fillText(l, textX, descY0 + li * lineH));

    // Rotating diamond
    const rdX = cardW - 55, rdY = cardH / 2;
    ctx.beginPath(); ctx.arc(rdX, rdY, 30 + 8 * Math.sin(elapsed * 0.003 + i * 1.3), 0, Math.PI * 2);
    ctx.strokeStyle = hex2rgba(accent2, 0.5); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); ctx.translate(rdX, rdY); ctx.rotate((elapsed * 0.001 + i) % (Math.PI * 2));
    ctx.strokeStyle = hex2rgba(accent, 0.6); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(16, 0); ctx.lineTo(0, 18); ctx.lineTo(-16, 0); ctx.closePath(); ctx.stroke();
    ctx.restore();

    if (eased > 0.6) {
      const ca = clamp((eased - 0.6) / 0.4, 0, 1);
      ctx.strokeStyle = hex2rgba(accent, ca * 0.6); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cardW - 30, 8); ctx.lineTo(cardW - 8, 8); ctx.lineTo(cardW - 8, 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(30, cardH - 8); ctx.lineTo(8, cardH - 8); ctx.lineTo(8, cardH - 30); ctx.stroke();
    }
    ctx.restore();
  }

  // Page indicator dots
  if (numPages > 1) {
    const dotR = 8, dotGap = 24, dotY = CH - 28;
    const dotX0 = (CW - numPages * (dotR * 2 + dotGap) + dotGap) / 2;
    for (let p = 0; p < numPages; p++) {
      ctx.save();
      ctx.globalAlpha = p === curPage ? 0.9 : 0.3;
      ctx.fillStyle = p === curPage ? accent : accent2;
      ctx.shadowColor = accent; ctx.shadowBlur = p === curPage ? 10 : 0;
      ctx.beginPath(); ctx.arc(dotX0 + p * (dotR * 2 + dotGap) + dotR, dotY, dotR * (p === curPage ? 1 : 0.7), 0, Math.PI * 2);
      ctx.fill(); ctx.restore();
    }
  }
}
