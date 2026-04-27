import type { GeneratedContent } from '../../types/video';
import { CW, CH, clamp, easeOutCubic, easeOutBack, hex2rgba, T,
  PAGE_SIZE, PAGE_HOLD, PAGE_TRANS } from './helpers';

// 24 auspicious animals — matches city-cover zodiac order
const ZODIAC = [
  '鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪',
  '麟','鹭','雀','虎','雁','鹮','凤','鹰','豹','熊','象','龟',
];

// Grid layout  (2 cols × 3 rows = 6 per page, matches PAGE_SIZE)
const COLS     = 2;
const ROWS     = 3;
const ML = 60, MR = 60, MT = 80, MB = 50, CGAP = 24, RGAP = 24;
const CARD_W   = Math.round((CW - ML - MR - CGAP) / COLS);          // 888
const CARD_H   = Math.round((CH - MT - MB - (ROWS - 1) * RGAP) / ROWS); // 300
const ICON_R   = 64;  // zodiac circle radius within card
const ICON_CX_OFF = ICON_R + 24;  // icon center offset from card left
const TEXT_X_OFF  = ICON_CX_OFF + ICON_R + 20; // text start offset from card left

export function drawCityCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  _shapeImg: HTMLImageElement,
  coverIndex = 0,
): void {
  if (elapsed < T.cardBase) return;

  const n           = content.points.length;
  const cardElapsed = elapsed - T.cardBase;
  const pageSlot    = PAGE_SIZE * T.cardSlot;
  const numPages    = Math.ceil(n / PAGE_SIZE);
  const curPage     = Math.min(Math.floor(cardElapsed / (pageSlot + PAGE_HOLD)), numPages - 1);
  const withinPage  = cardElapsed - curPage * (pageSlot + PAGE_HOLD);
  const startCard   = curPage * PAGE_SIZE;
  const endCard     = Math.min(startCard + PAGE_SIZE, n);

  // Fade-out for page transition
  const outA = (curPage < numPages - 1)
    ? clamp(1 - (withinPage - pageSlot) / PAGE_TRANS, 0, 1)
    : 1;

  ctx.save();
  if (outA < 1) ctx.globalAlpha = outA;

  for (let i = startCard; i < endCard; i++) {
    const posInPage = i - startCard;
    const col = posInPage % COLS;
    const row = Math.floor(posInPage / COLS);
    const cardX = ML + col * (CARD_W + CGAP);
    const cardY = MT + row * (CARD_H + RGAP);

    const te = withinPage - posInPage * T.cardSlot;
    if (te <= 0) continue;

    const enterT  = clamp(te / 500, 0, 1);
    const eased   = easeOutBack(Math.min(enterT, 0.999));
    const slideX  = (1 - easeOutCubic(enterT)) * 60 * (col === 0 ? -1 : 1);
    const alpha   = clamp(te / 300, 0, 1);
    const point   = content.points[i];
    const animal  = ZODIAC[(coverIndex + i) % ZODIAC.length];
    const ac      = col === 0 ? accent : accent2;

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(slideX, 0);

    // ── Card background ────────────────────────────────────────────────────
    ctx.save();
    ctx.translate(cardX + CARD_W / 2, cardY + CARD_H / 2);
    ctx.scale(0.4 + 0.6 * eased, 0.4 + 0.6 * eased);
    ctx.translate(-(cardX + CARD_W / 2), -(cardY + CARD_H / 2));
    const cbg = ctx.createLinearGradient(cardX, cardY, cardX, cardY + CARD_H);
    cbg.addColorStop(0, hex2rgba(ac, 0.15));
    cbg.addColorStop(1, hex2rgba(ac, 0.04));
    ctx.fillStyle = cbg;
    ctx.beginPath(); ctx.roundRect(cardX, cardY, CARD_W, CARD_H, 20); ctx.fill();
    ctx.shadowColor = ac; ctx.shadowBlur = 18;
    ctx.strokeStyle = hex2rgba(ac, 0.55); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(cardX, cardY, CARD_W, CARD_H, 20); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();

    // ── Zodiac icon circle ─────────────────────────────────────────────────
    const iconX = cardX + ICON_CX_OFF;
    const iconY = cardY + CARD_H / 2;
    const ig = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, ICON_R);
    ig.addColorStop(0, hex2rgba(ac, 0.35)); ig.addColorStop(1, hex2rgba(ac, 0.06));
    ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(iconX, iconY, ICON_R, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = ac; ctx.shadowBlur = 20;
    ctx.strokeStyle = ac; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(iconX, iconY, ICON_R, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    // Animal character
    ctx.font = `900 ${Math.round(ICON_R * 1.05)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = hex2rgba(ac, 0.9); ctx.shadowBlur = 12;
    ctx.fillStyle = '#fff'; ctx.fillText(animal, iconX, iconY);
    ctx.shadowBlur = 0;

    // ── Text ──────────────────────────────────────────────────────────────
    const textX  = cardX + TEXT_X_OFF;
    const maxTW  = CARD_W - TEXT_X_OFF - 20;
    // Sequence number badge
    ctx.font = `700 22px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = hex2rgba(ac, 0.90);
    ctx.fillText(`${String(i + 1).padStart(2, '0')}`, textX, cardY + 18);
    // Label (大标题)
    ctx.shadowColor = hex2rgba(ac, 0.8); ctx.shadowBlur = 16;
    ctx.font = `800 46px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    const labelY = cardY + CARD_H * 0.36;
    ctx.fillText(point.label, textX, labelY);
    ctx.shadowBlur = 0;
    // Short (小标题)
    if (point.short) {
      const desc = point.short.length > 26 ? point.short.slice(0, 26) + '…' : point.short;
      ctx.font = `500 28px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      const truncated = ctx.measureText(desc).width > maxTW ? desc.slice(0, 22) + '…' : desc;
      ctx.fillText(truncated, textX, cardY + CARD_H * 0.60);
    }
    // Desc (辅助解释)
    if (point.desc) {
      const descText = point.desc.length > 25 ? point.desc.slice(0, 24) + '…' : point.desc;
      ctx.font = `400 22px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = hex2rgba(ac, 0.70);
      ctx.fillText(descText, textX, cardY + CARD_H * 0.82);
    }

    ctx.restore(); // translate + globalAlpha
  }

  ctx.restore(); // outA

  // ── Page indicator dots ─────────────────────────────────────────────────
  if (numPages > 1) {
    const dotY = CH - 22;
    for (let p = 0; p < numPages; p++) {
      const dotX = CW / 2 + (p - (numPages - 1) / 2) * 22;
      ctx.beginPath(); ctx.arc(dotX, dotY, p === curPage ? 7 : 4, 0, Math.PI * 2);
      ctx.fillStyle = p === curPage ? accent : hex2rgba(accent, 0.3); ctx.fill();
    }
  }
}
