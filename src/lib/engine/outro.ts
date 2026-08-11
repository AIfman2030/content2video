import type { GeneratedContent, StyleType } from '../../types/video';
import { CW, CH, clamp, easeInOutQuad, easeOutBack, easeOutCubic, hex2rgba, roundRect } from './helpers';

const FONT = '"Noto Sans SC", "PingFang SC", sans-serif';

function drawKnowledgeOutro(ctx: CanvasRenderingContext2D, elapsed: number) {
  const fade = easeOutCubic(clamp(elapsed / 420, 0, 1));
  ctx.save();
  ctx.fillStyle = `rgba(2,4,8,${fade})`;
  ctx.fillRect(0, 0, CW, CH);

  const enter = easeOutBack(Math.min(clamp((elapsed - 260) / 520, 0, 1), 0.999));
  if (enter <= 0) { ctx.restore(); return; }
  const boxW = 880, boxH = 150, boxX = (CW - boxW) / 2, boxY = 390;
  ctx.save();
  ctx.translate(CW / 2, boxY + boxH / 2);
  ctx.scale(enter, enter);
  ctx.translate(-CW / 2, -(boxY + boxH / 2));
  ctx.shadowColor = 'rgba(59,130,246,0.4)'; ctx.shadowBlur = 38;
  ctx.fillStyle = '#ffffff'; roundRect(ctx, boxX, boxY, boxW, boxH, 75); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#07101f'; ctx.beginPath(); ctx.arc(boxX + boxW - 76, boxY + 75, 66, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(boxX + boxW - 86, boxY + 67, 25, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(boxX + boxW - 67, boxY + 87); ctx.lineTo(boxX + boxW - 43, boxY + 112); ctx.stroke();
  ctx.restore();

  const query = 'AIfman';
  const chars = Math.floor(clamp((elapsed - 780) / 110, 0, query.length));
  const typed = query.slice(0, chars);
  ctx.font = `800 74px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const grad = ctx.createLinearGradient(boxX + 60, 0, boxX + 420, 0); grad.addColorStop(0, '#2458ff'); grad.addColorStop(1, '#06b6d4'); ctx.fillStyle = grad;
  ctx.fillText(typed, boxX + 64, boxY + 76);
  if (elapsed > 780 && elapsed < 1900 && Math.floor(elapsed / 260) % 2 === 0) {
    const cursorX = boxX + 64 + ctx.measureText(typed).width + 8;
    ctx.fillRect(cursorX, boxY + 34, 5, 84);
  }

  const clickT = clamp((elapsed - 1800) / 460, 0, 1);
  if (clickT > 0 && clickT < 1) {
    ctx.globalAlpha = (1 - clickT) * 0.8; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(boxX + boxW - 76, boxY + 75, 70 + clickT * 90, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  }

  const sloganT = easeOutCubic(clamp((elapsed - 2050) / 500, 0, 1));
  ctx.globalAlpha = sloganT;
  ctx.font = `700 50px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
  ctx.fillText('生活新方案，就找AIfman.', CW / 2, 680 + (1 - sloganT) * 42);
  ctx.font = `500 25px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.fillText('AIFMAN · KNOWLEDGE IN MOTION', CW / 2, 745 + (1 - sloganT) * 42);
  ctx.restore();
}

// Outro: gentle fade-to-black. No slogans, no text, no branding.
export function drawOutro(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  _content: GeneratedContent,
  _accent: string,
  _accent2: string,
  _style: StyleType,
) {
  if (_style === 'city') {
    drawKnowledgeOutro(ctx, elapsed);
    return;
  }
  const t = clamp(elapsed / 700, 0, 1);
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${easeInOutQuad(t) * 0.92})`;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();
}

export function drawOverlays(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  accent: string,
  style: StyleType,
) {
  // Vignette
  ctx.save();
  const vg = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.3, CW / 2, CH / 2, CH * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // Scan-lines for AI tech style
  if (style === 'aitech') {
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let sy = 0; sy < CH; sy += 4) {
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(0, sy, CW, 2);
    }
    ctx.restore();
  }

  // Progress bar
  const prog = Math.min(elapsed / 3000, 1);
  ctx.save();
  ctx.fillStyle = hex2rgba(accent, 0.15);
  ctx.fillRect(0, 0, CW * prog, 4);
  ctx.restore();
}

export function drawShapeDecoration(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  img: HTMLImageElement,
  accent: string,
  style: StyleType,
) {
  const bloom = Math.min(elapsed / 1200, 1);
  ctx.save();

  if (style === 'city') {
    const sz = 700;
    const x = (CW - sz) / 2;
    const y = (CH - sz) / 2 + 60;
    ctx.globalAlpha = bloom * 0.45;
    ctx.drawImage(img, x, y, sz, sz);
  } else if (style === 'aitech') {
    const wave = Math.sin(elapsed * 0.001) * 12;
    const sz = 380;
    const x = (CW - sz) / 2;
    const y = (CH - sz) / 2 + wave;
    ctx.globalAlpha = bloom * 0.18;
    ctx.drawImage(img, x, y, sz, sz);
    ctx.globalAlpha = bloom * 0.06;
    ctx.drawImage(img, x - 20, y + 10, sz + 40, sz + 40);
  } else {
    const wave = Math.sin(elapsed * 0.0008) * 8;
    const sz = 420;
    const x = (CW - sz) / 2;
    const y = (CH - sz) / 2 + wave;
    ctx.globalAlpha = bloom * 0.22;
    ctx.drawImage(img, x, y, sz, sz);
    ctx.save();
    ctx.translate(CW / 2, y + sz / 2);
    ctx.scale(1, -0.25);
    ctx.globalAlpha = bloom * 0.05;
    ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
  }
  ctx.restore();
}
