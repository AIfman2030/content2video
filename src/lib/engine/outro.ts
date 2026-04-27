import type { GeneratedContent, StyleType } from '../../types/video';
import { CW, CH, clamp, easeOutCubic, easeOutBack, easeInOutQuad, hex2rgba } from './helpers';

export function drawOutro(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  style: StyleType,
) {
  const t = clamp(elapsed / 800, 0, 1);
  const eased = easeInOutQuad(t);

  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${eased * 0.6})`;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = hex2rgba(accent, eased * 0.08);
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  if (elapsed < 200) return;
  const contentT = clamp((elapsed - 200) / 800, 0, 1);
  const contentEased = easeOutCubic(contentT);

  ctx.save();
  ctx.globalAlpha = contentEased;
  ctx.shadowColor = hex2rgba(accent, 0.9);
  ctx.shadowBlur = 50;
  ctx.font = `900 72px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(content.title, CW / 2, CH / 2 - 90);
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = contentEased;
  const sealY = CH / 2;

  if (style === 'chinese') {
    const bounceT = clamp((elapsed - 500) / 400, 0, 1);
    const bounceS = easeOutBack(bounceT);
    ctx.save();
    ctx.translate(CW / 2, sealY);
    ctx.scale(bounceS, bounceS);
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, 0.9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = `700 28px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('印', 0, 0);
    const shineT = clamp((elapsed - 700) / 300, 0, 1);
    if (shineT < 1) {
      const sg = ctx.createLinearGradient(-80, -80, 80, 80);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.5, `rgba(255,255,255,${(1 - shineT) * 0.6})`);
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (style === 'city') {
    ctx.strokeStyle = hex2rgba(accent, 0.8);
    ctx.lineWidth = 2;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 15;
    const skyPoints = [0.1, 0.3, 0.5, 0.4, 0.7, 0.9, 0.6, 0.5, 0.8, 1.0, 0.7, 0.5, 0.4, 0.6, 0.3, 0.5, 0.2, 0.4];
    const skyW = 500, skyH = 80;
    ctx.beginPath();
    skyPoints.forEach((h, idx) => {
      const sx = CW / 2 - skyW / 2 + idx * (skyW / skyPoints.length);
      const sy = sealY + 30 - h * skyH;
      if (idx === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    });
    ctx.lineTo(CW / 2 + skyW / 2, sealY + 30);
    ctx.lineTo(CW / 2 - skyW / 2, sealY + 30);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = hex2rgba(accent, 0.1);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    const bounceT = clamp((elapsed - 400) / 400, 0, 1);
    const bounceS = easeOutBack(bounceT);
    ctx.save();
    ctx.translate(CW / 2, sealY);
    ctx.scale(bounceS, bounceS);
    ctx.beginPath();
    for (let v = 0; v < 6; v++) {
      const a = (v / 6) * Math.PI * 2 - Math.PI / 6;
      if (v === 0) ctx.moveTo(Math.cos(a) * 70, Math.sin(a) * 70);
      else ctx.lineTo(Math.cos(a) * 70, Math.sin(a) * 70);
    }
    ctx.closePath();
    ctx.fillStyle = hex2rgba(accent, 0.2);
    ctx.fill();
    ctx.strokeStyle = hex2rgba(accent, 0.9);
    ctx.lineWidth = 3;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = `600 22px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent2;
    ctx.fillText('✓ DONE', 0, 0);
    ctx.restore();
  }
  ctx.restore();

  if (elapsed > 600) {
    const tagT = clamp((elapsed - 600) / 600, 0, 1);
    ctx.save();
    ctx.globalAlpha = easeOutCubic(tagT);
    ctx.font = `600 32px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.fillText('— 小福分享舍 —', CW / 2, CH / 2 + 100);
    ctx.restore();
  }

  if (elapsed > 900) {
    const sumT = clamp((elapsed - 900) / 600, 0, 1);
    ctx.save();
    ctx.globalAlpha = easeOutCubic(sumT) * 0.7;
    content.points.forEach((_, i) => {
      const sx = CW / 2 - (content.points.length * 100) / 2 + i * 100 + 50;
      const sy = CH / 2 + 200;
      ctx.beginPath();
      ctx.arc(sx, sy, 30, 0, Math.PI * 2);
      ctx.fillStyle = hex2rgba(accent, 0.25);
      ctx.fill();
      ctx.strokeStyle = hex2rgba(accent, 0.6);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = `700 22px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(`${i + 1}`, sx, sy);
    });
    ctx.restore();
  }
}

export function drawOverlays(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  accent: string,
  style: StyleType,
) {
  ctx.save();
  const vg = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.3, CW / 2, CH / 2, CH * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  if (style === 'aitech') {
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let sy = 0; sy < CH; sy += 4) {
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(0, sy, CW, 2);
    }
    ctx.restore();
  }

  ctx.save();
  ctx.font = `400 22px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = hex2rgba(accent, 0.28);
  ctx.fillText('@小福分享舍', CW - 40, CH - 50);
  ctx.restore();

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
    // Large skyline centered in canvas — behind cards
    const sz = 700;
    const x = (CW - sz) / 2;
    const y = (CH - sz) / 2 + 60;
    ctx.globalAlpha = bloom * 0.45;
    ctx.drawImage(img, x, y, sz, sz);
  } else if (style === 'aitech') {
    // Pulsing AI icon centered
    const wave = Math.sin(elapsed * 0.001) * 12;
    const sz = 380;
    const x = (CW - sz) / 2;
    const y = (CH - sz) / 2 + wave;
    ctx.globalAlpha = bloom * 0.18;
    ctx.drawImage(img, x, y, sz, sz);
    ctx.globalAlpha = bloom * 0.06;
    ctx.drawImage(img, x - 20, y + 10, sz + 40, sz + 40);
  } else {
    // Chinese motif — centered, gentle float + faint reflection
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
