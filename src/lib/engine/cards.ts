import type { GeneratedContent, StyleType, PolyShape } from '../../types/video';
import { CW, clamp, easeOutBack, hex2rgba, roundRect, wrapText, T } from './helpers';
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
) {
  if (style === 'city') {
    drawCityCards(ctx, elapsed, content, accent, accent2, shapeImg);
    return;
  }
  if (style === 'aitech') {
    drawAITechCards(ctx, elapsed, content, accent, accent2, polyShape ?? 'hexagon');
    return;
  }

  // ── Chinese style: original rectangular card grid ──
  if (elapsed < T.cardBase) return;
  const cardElapsed = elapsed - T.cardBase;
  const MARGIN = 30, GAP = 30, COLS = 2;
  const cardW = (CW - MARGIN * 2 - GAP) / 2;
  const cardH = 268;
  const rowGap = 26;
  const startY = 160;

  content.points.forEach((point, i) => {
    const cardStart = i * T.cardSlot;
    const te = cardElapsed - cardStart;
    if (te <= 0) return;

    const enterT = clamp(te / 500, 0, 1);
    const eased = easeOutBack(Math.min(enterT, 0.999));

    const colIdx = i % COLS;
    const rowIdx = Math.floor(i / COLS);
    const cardX = MARGIN + colIdx * (cardW + GAP);
    const cardY = startY + rowIdx * (cardH + rowGap);
    const offsetX = (1 - eased) * 120;

    ctx.save();
    ctx.globalAlpha = clamp(te / 300, 0, 1);
    ctx.translate(cardX + offsetX + cardW / 2, cardY + cardH / 2);
    ctx.translate(-cardW / 2, -cardH / 2);

    roundRect(ctx, 0, 0, cardW, cardH, 18);
    const bg = ctx.createLinearGradient(0, 0, cardW, cardH);
    bg.addColorStop(0, 'rgba(255,255,255,0.07)');
    bg.addColorStop(1, hex2rgba(accent, 0.08));
    ctx.fillStyle = bg;
    ctx.fill();

    roundRect(ctx, 0, 0, cardW, cardH, 18);
    const bord = ctx.createLinearGradient(0, 0, cardW, cardH);
    bord.addColorStop(0, hex2rgba(accent, 0.7));
    bord.addColorStop(1, hex2rgba(accent2, 0.3));
    ctx.strokeStyle = bord;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ink-drip left bar
    const barH = cardH - 40;
    const drawH = barH * eased;
    ctx.fillStyle = accent;
    roundRect(ctx, 0, 20, 6, drawH, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, 20 + drawH, 8, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, 0.5);
    ctx.fill();

    // Number badge
    const badgeX = 55, badgeY = cardH / 2;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 50, 0, Math.PI * 2);
    const nbg = ctx.createRadialGradient(badgeX, badgeY - 10, 0, badgeX, badgeY, 50);
    nbg.addColorStop(0, hex2rgba(accent, 0.35));
    nbg.addColorStop(1, hex2rgba(accent, 0.1));
    ctx.fillStyle = nbg;
    ctx.fill();
    ctx.strokeStyle = hex2rgba(accent, 0.8);
    ctx.lineWidth = 2;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = `800 52px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${i + 1}`, badgeX, badgeY);

    // Text content
    const textX = 130;
    const textAvailW = cardW - textX - 90;
    ctx.shadowColor = hex2rgba(accent, 0.7);
    ctx.shadowBlur = 20;
    ctx.font = `800 68px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = accent;
    ctx.fillText(point.label, textX, 82);
    ctx.shadowBlur = 0;

    ctx.font = `400 36px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(point.short || '', textX, 136);

    ctx.font = `400 28px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    const descLines = wrapText(ctx, point.desc || '', textAvailW);
    descLines.slice(0, 2).forEach((line, li) => ctx.fillText(line, textX, 180 + li * 34));

    // Rotating diamond
    const rdX = cardW - 55, rdY = cardH / 2;
    const pulseR = 30 + 8 * Math.sin(elapsed * 0.003 + i * 1.3);
    ctx.beginPath();
    ctx.arc(rdX, rdY, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = hex2rgba(accent2, 0.5);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(rdX, rdY);
    ctx.rotate((elapsed * 0.001 + i) % (Math.PI * 2));
    ctx.strokeStyle = hex2rgba(accent, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(16, 0); ctx.lineTo(0, 18); ctx.lineTo(-16, 0); ctx.closePath();
    ctx.stroke();
    ctx.restore();

    if (eased > 0.6) {
      const ca = clamp((eased - 0.6) / 0.4, 0, 1);
      ctx.strokeStyle = hex2rgba(accent, ca * 0.6);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cardW - 30, 8); ctx.lineTo(cardW - 8, 8); ctx.lineTo(cardW - 8, 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(30, cardH - 8); ctx.lineTo(8, cardH - 8); ctx.lineTo(8, cardH - 30);
      ctx.stroke();
    }

    ctx.restore();
  });
}
