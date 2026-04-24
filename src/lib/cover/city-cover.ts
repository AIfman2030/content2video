import { COVER_W, COVER_H, ICON_CX, ICON_CY, ICON_R, CoverOpts,
  hex2rgbaCover, drawRainbowBorder, registerCover } from './registry';
import { loadShapeImage } from '../shapes';
import { getShapeList } from '../themes';

const W = COVER_W, H = COVER_H;

function drawBg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  g.addColorStop(0, 'rgba(4,10,20,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.5);
}

async function drawCity(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { coverIndex, accent } = opts;
  drawBg(ctx);
  drawRainbowBorder(ctx, W, H);

  try {
    const shapes = getShapeList('city');
    const shapeId = shapes[coverIndex % shapes.length]?.id ?? 'beijing';
    const img = await loadShapeImage('city', shapeId, accent, 2.0);
    const r = ICON_R;

    // Ground glow under skyline
    const glow = ctx.createLinearGradient(ICON_CX - r, ICON_CY, ICON_CX + r, ICON_CY);
    glow.addColorStop(0, 'transparent');
    glow.addColorStop(0.5, hex2rgbaCover(accent, 0.18));
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(ICON_CX - r, ICON_CY, r * 2, r * 0.15);

    ctx.save();
    ctx.shadowColor = accent; ctx.shadowBlur = 35;
    ctx.globalAlpha = 0.95;
    ctx.drawImage(img, ICON_CX - r, ICON_CY - r, r * 2, r * 2);
    ctx.shadowBlur = 0; ctx.restore();
  } catch { /* fallback: no icon */ }
}

registerCover('city', drawCity);
