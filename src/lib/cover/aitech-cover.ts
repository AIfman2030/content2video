import { COVER_W, COVER_H, ICON_CX, ICON_CY, ICON_R, CoverOpts,
  hex2rgbaCover, drawRainbowBorder, registerCover } from './registry';
import { loadShapeImage } from '../shapes';
import { getShapeList } from '../themes';

const W = COVER_W, H = COVER_H;

// Accent colours that rotate per cover (ensures each selection has a distinct neon tint)
const PALETTES: [string, string][] = [
  ['#aa00ff','#00ffcc'],['#ff0088','#00ccff'],['#ffcc00','#0088ff'],
  ['#00ff88','#cc00ff'],['#ff4400','#00bbff'],['#ff00cc','#88ff00'],
  ['#0044ff','#ff8800'],['#00ffee','#ff0055'],['#88ff44','#ff44aa'],
  ['#ff6600','#4466ff'],['#cc88ff','#00ffaa'],['#ff2244','#44ffcc'],
  ['#ffaa00','#aa00ff'],['#00ffff','#ff0044'],['#ff88cc','#44ff44'],
  ['#4400ff','#ffcc44'],['#ff4488','#44ffaa'],['#aaff00','#ff00cc'],
  ['#00bbff','#ff6644'],['#ff0066','#66ff00'],['#8888ff','#ffaa00'],
  ['#44ff88','#ff4400'],['#ffcc88','#0044cc'],['#ff00aa','#aaff44'],
];

function drawBg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.fillStyle = 'rgba(80,80,120,0.18)';
  for (let x = 36; x < W; x += 72) for (let y = 36; y < H; y += 72) {
    ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

async function drawAITech(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { coverIndex } = opts;
  const [c1] = PALETTES[coverIndex % PALETTES.length];
  drawBg(ctx);
  drawRainbowBorder(ctx, W, H);

  try {
    const shapes = getShapeList('aitech');
    const shapeId = shapes[coverIndex % shapes.length]?.id ?? 'chatgpt';
    const img = await loadShapeImage('aitech', shapeId, c1, 2.5);
    const r = ICON_R;

    // Glow halo
    const halo = ctx.createRadialGradient(ICON_CX, ICON_CY, 0, ICON_CX, ICON_CY, r * 1.15);
    halo.addColorStop(0, hex2rgbaCover(c1, 0.2));
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(ICON_CX, ICON_CY, r * 1.15, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.shadowColor = c1; ctx.shadowBlur = 55;
    ctx.globalAlpha = 0.95;
    ctx.drawImage(img, ICON_CX - r, ICON_CY - r, r * 2, r * 2);
    ctx.shadowBlur = 0; ctx.restore();
  } catch { /* fallback: no icon */ }
}

registerCover('aitech', drawAITech);
