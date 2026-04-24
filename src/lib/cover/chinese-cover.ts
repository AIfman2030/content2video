import { COVER_W, COVER_H, ICON_CX, ICON_CY, ICON_R, CoverOpts,
  hex2rgbaCover, drawRainbowBorder, registerCover } from './registry';
import { loadShapeImage } from '../shapes';
import { getShapeList } from '../themes';

const W = COVER_W, H = COVER_H;

function drawBg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W/2, H*0.5, 0, W/2, H*0.5, W*0.8);
  g.addColorStop(0, 'rgba(30,8,4,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

async function drawChinese(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { coverIndex, accent } = opts;
  drawBg(ctx);
  drawRainbowBorder(ctx, W, H);

  try {
    const shapes = getShapeList('chinese');
    const shapeId = shapes[coverIndex % shapes.length]?.id ?? 'mountain';
    const img = await loadShapeImage('chinese', shapeId, accent, 3.0);
    const r = ICON_R;

    // Glow halo behind shape
    const halo = ctx.createRadialGradient(ICON_CX, ICON_CY, 0, ICON_CX, ICON_CY, r * 1.1);
    halo.addColorStop(0, hex2rgbaCover(accent, 0.22));
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(ICON_CX, ICON_CY, r * 1.1, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.shadowColor = accent; ctx.shadowBlur = 50;
    ctx.globalAlpha = 0.92;
    ctx.drawImage(img, ICON_CX - r, ICON_CY - r, r * 2, r * 2);
    ctx.shadowBlur = 0; ctx.restore();
  } catch { /* fallback: no icon */ }
}

registerCover('chinese', drawChinese);
