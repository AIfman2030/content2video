import type { GeneratedContent } from '../../types/video';
import { CW, clamp, easeOutBack, hex2rgba, roundRect, wrapText, T } from './helpers';

export function drawCityCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  shapeImg: HTMLImageElement,
) {
  if (elapsed < T.cardBase) return;
  const cardElapsed = elapsed - T.cardBase;

  const MARGIN = 30, GAP = 30, COLS = 2;
  const cardW = (CW - MARGIN * 2 - GAP) / 2;
  const cardH = 268;
  const rowGap = 26;
  const startY = 160;
  const LEFT_W = 280;
  const SEP_X = LEFT_W + 1;
  const rightX = LEFT_W + 20;
  const rightAvailW = cardW - LEFT_W - 25;

  content.points.forEach((point, i) => {
    const cardStart = i * T.cardSlot;
    const te = cardElapsed - cardStart;
    if (te <= 0) return;

    const enterT = clamp(te / 500, 0, 1);
    const eased = easeOutBack(Math.min(enterT, 0.999));
    const alpha = clamp(te / 300, 0, 1);

    const colIdx = i % COLS;
    const rowIdx = Math.floor(i / COLS);
    const cardX = MARGIN + colIdx * (cardW + GAP);
    const cardY = startY + rowIdx * (cardH + rowGap);

    // Slide up from bottom
    const offsetY = (1 - eased) * 120;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cardX, cardY + offsetY);

    // Card background
    roundRect(ctx, 0, 0, cardW, cardH, 14);
    const bg = ctx.createLinearGradient(0, 0, 0, cardH);
    bg.addColorStop(0, 'rgba(2,8,20,0.88)');
    bg.addColorStop(1, 'rgba(5,15,35,0.92)');
    ctx.fillStyle = bg;
    ctx.fill();

    // Card border
    roundRect(ctx, 0, 0, cardW, cardH, 14);
    const bord = ctx.createLinearGradient(0, 0, cardW, cardH);
    bord.addColorStop(0, hex2rgba(accent, 0.55));
    bord.addColorStop(1, hex2rgba(accent2, 0.25));
    ctx.strokeStyle = bord;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Left panel background
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, LEFT_W, cardH);
    ctx.clip();
    roundRect(ctx, 0, 0, LEFT_W, cardH, 14);
    const lpBg = ctx.createLinearGradient(0, 0, LEFT_W, cardH);
    lpBg.addColorStop(0, hex2rgba(accent, 0.15));
    lpBg.addColorStop(1, hex2rgba(accent, 0.05));
    ctx.fillStyle = lpBg;
    ctx.fill();
    ctx.restore();

    // Shape image in left panel (centered, with glow)
    const imgSz = 180;
    const imgX = (LEFT_W - imgSz) / 2;
    const imgY = (cardH - imgSz) / 2;
    ctx.save();
    ctx.globalAlpha = alpha * 0.7 * eased;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 18;
    ctx.drawImage(shapeImg, imgX, imgY, imgSz, imgSz);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Neon bottom glow on left panel
    ctx.save();
    const glowGrad = ctx.createLinearGradient(0, cardH - 30, 0, cardH);
    glowGrad.addColorStop(0, 'rgba(0,0,0,0)');
    glowGrad.addColorStop(1, hex2rgba(accent, 0.3 * eased));
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, cardH - 30, LEFT_W, 30);
    ctx.restore();

    // Vertical separator
    const sepGrad = ctx.createLinearGradient(SEP_X, 20, SEP_X, cardH - 20);
    sepGrad.addColorStop(0, 'rgba(255,255,255,0.04)');
    sepGrad.addColorStop(0.5, hex2rgba(accent, 0.55));
    sepGrad.addColorStop(1, 'rgba(255,255,255,0.04)');
    ctx.strokeStyle = sepGrad;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(SEP_X, 20);
    ctx.lineTo(SEP_X, cardH - 20);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Number badge (top-right of left panel)
    const badgeX = LEFT_W - 22, badgeY = 22;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 16, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, 0.8);
    ctx.fill();
    ctx.font = `700 18px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(`${i + 1}`, badgeX, badgeY);

    // Right panel text
    ctx.shadowColor = hex2rgba(accent, 0.6);
    ctx.shadowBlur = 16;
    ctx.font = `800 56px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = accent;
    ctx.fillText(point.label, rightX, 40);

    ctx.shadowBlur = 0;
    ctx.font = `400 30px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(point.short || '', rightX, 110);

    ctx.font = `400 24px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    const descLines = wrapText(ctx, point.desc || '', rightAvailW);
    descLines.slice(0, 2).forEach((line, li) => ctx.fillText(line, rightX, 155 + li * 32));

    // Corner accent
    if (eased > 0.6) {
      const ca = clamp((eased - 0.6) / 0.4, 0, 1);
      ctx.strokeStyle = hex2rgba(accent, ca * 0.5);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cardW - 28, 8); ctx.lineTo(cardW - 8, 8); ctx.lineTo(cardW - 8, 28);
      ctx.stroke();
    }

    ctx.restore();
  });
}
