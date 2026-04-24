import { COVER_W, COVER_H, ICON_CX, ICON_CY, ICON_R, CoverOpts,
  drawRainbowBorder, registerCover } from './registry';
import { CITY_LANDMARKS_A } from './city-landmarks-a';
import { CITY_LANDMARKS_B } from './city-landmarks-b';

const W = COVER_W, H = COVER_H;

const ALL_LANDMARKS = [...CITY_LANDMARKS_A, ...CITY_LANDMARKS_B];

function drawBg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  // Dark navy tint in upper area
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  g.addColorStop(0, 'rgba(4,10,20,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.5);
}

function drawCity(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { coverIndex } = opts;
  drawBg(ctx);
  drawRainbowBorder(ctx, W, H);
  const fn = ALL_LANDMARKS[coverIndex % ALL_LANDMARKS.length];
  if (fn) {
    ctx.save(); fn(ctx, ICON_CX, ICON_CY, ICON_R); ctx.restore();
  }
}

registerCover('city', drawCity);
