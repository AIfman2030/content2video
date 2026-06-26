import type { GeneratedContent, StyleType } from '../../types/video';
import { CW, CH, clamp, easeInOutQuad, hex2rgba } from './helpers';

// Outro: gentle fade-to-black. No slogans, no text, no branding.
export function drawOutro(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  _content: GeneratedContent,
  _accent: string,
  _accent2: string,
  _style: StyleType,
) {
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
