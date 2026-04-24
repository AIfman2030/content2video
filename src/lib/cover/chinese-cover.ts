import { COVER_W, COVER_H, ICON_CX, ICON_CY, ICON_R, CoverOpts,
  hex2rgbaCover, neonGrad, drawRoundRect, drawRainbowBorder, registerCover } from './registry';

const W = COVER_W, H = COVER_H;

function drawBg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  // Subtle radial glow in center background
  const g = ctx.createRadialGradient(W/2, H*0.55, 0, W/2, H*0.55, W*0.75);
  g.addColorStop(0, 'rgba(40,10,5,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function drawChineseIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, accent: string, accent2: string) {
  ctx.save();
  // Outer ring
  const ringG = neonGrad(ctx, cx-r, cy, cx+r, cy, accent, accent2);
  ctx.strokeStyle = ringG; ctx.lineWidth = 6; ctx.shadowColor = accent; ctx.shadowBlur = 25;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  // Inner ring
  ctx.strokeStyle = neonGrad(ctx, cx, cy-r, cx, cy+r, accent2, accent);
  ctx.lineWidth = 3; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2); ctx.stroke();
  // 8 radial lines (bagua style)
  ctx.lineWidth = 4; ctx.shadowBlur = 20;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const g2 = neonGrad(ctx, cx + Math.cos(a)*r*0.3, cy + Math.sin(a)*r*0.3, cx + Math.cos(a)*r*0.72, cy + Math.sin(a)*r*0.72, accent, accent2);
    ctx.strokeStyle = g2; ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a)*r*0.3, cy + Math.sin(a)*r*0.3);
    ctx.lineTo(cx + Math.cos(a)*r*0.72, cy + Math.sin(a)*r*0.72);
    ctx.stroke();
  }
  // Small circles between spokes
  ctx.lineWidth = 3; ctx.shadowBlur = 14;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8 + 0.0625) * Math.PI * 2;
    const mx = cx + Math.cos(a) * r * 0.57, my = cy + Math.sin(a) * r * 0.57;
    ctx.strokeStyle = neonGrad(ctx, mx-r*0.06, my, mx+r*0.06, my, accent, accent2);
    ctx.beginPath(); ctx.arc(mx, my, r * 0.08, 0, Math.PI * 2); ctx.stroke();
  }
  // Center yin-yang split line
  ctx.lineWidth = 5; ctx.shadowBlur = 20;
  ctx.strokeStyle = neonGrad(ctx, cx, cy-r*0.25, cx, cy+r*0.25, accent, accent2);
  ctx.beginPath(); ctx.arc(cx, cy, r*0.25, -Math.PI/2, Math.PI/2); ctx.stroke();
  ctx.strokeStyle = neonGrad(ctx, cx, cy-r*0.25, cx, cy+r*0.25, accent2, accent);
  ctx.beginPath(); ctx.arc(cx, cy, r*0.25, Math.PI/2, -Math.PI/2); ctx.stroke();
  // Glow fill inside outer ring
  const gf = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gf.addColorStop(0, hex2rgbaCover(accent, 0.12)); gf.addColorStop(1, 'transparent');
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gf; ctx.fillRect(cx-r, cy-r, r*2, r*2);
  ctx.restore();
}

function drawChinese(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { accent, accent2, coverIndex } = opts;
  // Assign distinct accent colors per coverIndex for variety
  const PALETTES: [string, string][] = [
    ['#ffd700','#ff2200'],['#ff2200','#ffd700'],['#ff00cc','#ffcc00'],
    ['#00ffcc','#ff4488'],['#aa88ff','#ffcc00'],['#ff6600','#aaff00'],
    ['#ff44bb','#44ffee'],['#ffee00','#ff0044'],['#00bbff','#ff8800'],
    ['#88ff00','#ff00cc'],['#ff8844','#4488ff'],['#ee00ff','#00ffaa'],
    ['#ffaa00','#0055ff'],['#00ff55','#ff0055'],['#4444ff','#ffff00'],
    ['#ff5500','#00ffff'],['#cc00ff','#ffcc00'],['#00ffcc','#ff6600'],
    ['#ff2288','#88ff22'],['#ffcc44','#4466ff'],['#22ffaa','#ff2244'],
    ['#ff6644','#44bbff'],['#aaff00','#ff00aa'],['#00aaff','#ffaa00'],
  ];
  const [c1, c2] = PALETTES[coverIndex % PALETTES.length];
  drawBg(ctx);
  drawRainbowBorder(ctx, W, H);
  drawChineseIcon(ctx, ICON_CX, ICON_CY, ICON_R, c1, c2);
}

registerCover('chinese', drawChinese);
