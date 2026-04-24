import type { GeneratedContent, StyleType } from '../../types/video';
import { CW, clamp, easeOutBack, hex2rgba, roundRect, wrapText, T } from './helpers';

export function drawCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  style: StyleType,
) {
  if (elapsed < T.cardBase) return;
  const cardElapsed = elapsed - T.cardBase;

  // Landscape 2-column grid: 2 cols × up to 3 rows
  const MARGIN = 30, GAP = 30, COLS = 2;
  const cardW = (CW - MARGIN * 2 - GAP) / 2; // ~915
  const cardH = 240;
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

    ctx.save();
    ctx.globalAlpha = clamp(te / 300, 0, 1);

    let offsetX = 0, offsetY = 0, scaleX = 1, scaleY = 1;
    if (style === 'chinese') {
      offsetX = (1 - eased) * 120;
    } else if (style === 'city') {
      offsetY = (1 - eased) * 80;
    } else {
      scaleX = 0.9 + eased * 0.1;
      scaleY = 0.9 + eased * 0.1;
    }

    ctx.translate(cardX + offsetX + cardW / 2, cardY + offsetY + cardH / 2);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-cardW / 2, -cardH / 2);

    roundRect(ctx, 0, 0, cardW, cardH, 18);

    if (style === 'chinese') {
      const bg = ctx.createLinearGradient(0, 0, cardW, cardH);
      bg.addColorStop(0, 'rgba(255,255,255,0.07)');
      bg.addColorStop(1, hex2rgba(accent, 0.08));
      ctx.fillStyle = bg;
    } else if (style === 'city') {
      const bg = ctx.createLinearGradient(0, 0, 0, cardH);
      bg.addColorStop(0, hex2rgba(accent, 0.08));
      bg.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = bg;
    } else {
      ctx.fillStyle = 'rgba(10,20,40,0.7)';
    }
    ctx.fill();

    roundRect(ctx, 0, 0, cardW, cardH, 18);
    const borderGrad = ctx.createLinearGradient(0, 0, cardW, cardH);
    borderGrad.addColorStop(0, hex2rgba(accent, 0.7));
    borderGrad.addColorStop(1, hex2rgba(accent2, 0.3));
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (style === 'chinese') {
      const barH = cardH - 40;
      const drawH = barH * eased;
      ctx.fillStyle = accent;
      roundRect(ctx, 0, 20, 6, drawH, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(3, 20 + drawH, 8, 0, Math.PI * 2);
      ctx.fillStyle = hex2rgba(accent, 0.5);
      ctx.fill();
    } else if (style === 'city') {
      const neonGrad = ctx.createLinearGradient(3, 20, 3, cardH - 20);
      neonGrad.addColorStop(0, 'transparent');
      neonGrad.addColorStop(0.5 * eased, accent);
      neonGrad.addColorStop(eased, hex2rgba(accent, 0.3));
      neonGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = neonGrad;
      ctx.lineWidth = 4;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(3, 20);
      ctx.lineTo(3, cardH - 20);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.lineDashOffset = -(elapsed * 0.05);
      ctx.beginPath();
      ctx.moveTo(3, 20);
      ctx.lineTo(3, cardH - 20);
      ctx.stroke();
      ctx.setLineDash([]);
      [20, cardH - 20].forEach(ny => {
        ctx.beginPath();
        ctx.arc(3, ny, 5, 0, Math.PI * 2);
        ctx.fillStyle = accent2;
        ctx.shadowColor = accent2;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    const badgeX = 55, badgeY = cardH / 2;
    const badgeR = 40;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    const badgeBg = ctx.createRadialGradient(badgeX, badgeY - 10, 0, badgeX, badgeY, badgeR);
    badgeBg.addColorStop(0, hex2rgba(accent, 0.35));
    badgeBg.addColorStop(1, hex2rgba(accent, 0.1));
    ctx.fillStyle = badgeBg;
    ctx.fill();
    ctx.strokeStyle = hex2rgba(accent, 0.8);
    ctx.lineWidth = 2;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = `800 40px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${i + 1}`, badgeX, badgeY);

    const textX = 115;
    const textAvailW = cardW - textX - 80;

    ctx.shadowColor = hex2rgba(accent, 0.7);
    ctx.shadowBlur = 20;
    ctx.font = `800 52px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = accent;
    ctx.fillText(point.label, textX, 72);

    ctx.shadowBlur = 0;
    ctx.font = `400 28px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(point.short || '', textX, 118);

    ctx.font = `400 24px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    const descLines = wrapText(ctx, point.desc || '', textAvailW);
    descLines.slice(0, 2).forEach((line, li) => ctx.fillText(line, textX, 158 + li * 30));

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
    if (style === 'chinese') {
      ctx.beginPath();
      ctx.moveTo(0, -18); ctx.lineTo(16, 0); ctx.lineTo(0, 18); ctx.lineTo(-16, 0); ctx.closePath();
      ctx.stroke();
    } else if (style === 'city') {
      for (let tri = 0; tri < 2; tri++) {
        ctx.beginPath();
        for (let v = 0; v < 3; v++) {
          const a = (v / 3) * Math.PI * 2 + tri * (Math.PI / 3);
          if (v === 0) ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
          else ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
        }
        ctx.closePath();
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      for (let v = 0; v < 6; v++) {
        const a = (v / 6) * Math.PI * 2;
        if (v === 0) ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
        else ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
      }
      ctx.closePath();
      ctx.stroke();
    }
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

