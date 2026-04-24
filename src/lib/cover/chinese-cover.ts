import { COVER_W, COVER_H, ICON_CX, ICON_CY, ICON_R, CoverOpts,
  hex2rgbaCover, neonGrad, drawRainbowBorder, registerCover } from './registry';

const W = COVER_W, H = COVER_H;

// 24 colour palettes (4 × 6 rotations)
const PALETTES: [string, string][] = [
  ['#ffd700','#ff2200'],['#ff00cc','#ffcc00'],['#00ffcc','#ff4488'],['#aa88ff','#ffcc00'],
  ['#ff6600','#aaff00'],['#ff44bb','#44ffee'],['#ff2200','#ffd700'],['#ffcc00','#ff00cc'],
  ['#ff4488','#00ffcc'],['#ffcc00','#aa88ff'],['#aaff00','#ff6600'],['#44ffee','#ff44bb'],
  ['#0088ff','#ff8800'],['#00ffee','#ff0055'],['#88ff44','#ff44aa'],['#ff0066','#66ff00'],
  ['#8888ff','#ffaa00'],['#44ff88','#ff4400'],['#ff8800','#0088ff'],['#ff0055','#00ffee'],
  ['#ff44aa','#88ff44'],['#66ff00','#ff0066'],['#ffaa00','#8888ff'],['#ff4400','#44ff88'],
];

function drawBg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W/2, H*0.5, 0, W/2, H*0.5, W*0.8);
  g.addColorStop(0, 'rgba(30,8,4,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// Icon type 0: Bagua (8-spoke wheel)
function iconBagua(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c1: string, c2: string) {
  ctx.save();
  const lw = 5;
  ctx.strokeStyle = neonGrad(ctx, cx-r, cy, cx+r, cy, c1, c2); ctx.lineWidth = lw;
  ctx.shadowColor = c1; ctx.shadowBlur = 22;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r*0.76, 0, Math.PI*2); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i/8)*Math.PI*2;
    const g2 = neonGrad(ctx, cx+Math.cos(a)*r*0.28, cy+Math.sin(a)*r*0.28, cx+Math.cos(a)*r*0.7, cy+Math.sin(a)*r*0.7, c1, c2);
    ctx.strokeStyle = g2; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r*0.28, cy+Math.sin(a)*r*0.28); ctx.lineTo(cx+Math.cos(a)*r*0.7, cy+Math.sin(a)*r*0.7); ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const a = (i/8+0.0625)*Math.PI*2;
    ctx.strokeStyle = neonGrad(ctx, cx+Math.cos(a)*r*0.54, cy+Math.sin(a)*r*0.54, cx+Math.cos(a)*r*0.54+1, cy+Math.sin(a)*r*0.54+1, c2, c1);
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx+Math.cos(a)*r*0.54, cy+Math.sin(a)*r*0.54, r*0.1, 0, Math.PI*2); ctx.stroke();
  }
  ctx.strokeStyle = neonGrad(ctx, cx, cy-r*0.22, cx, cy+r*0.22, c1, c2); ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(cx, cy, r*0.22, 0, Math.PI*2); ctx.stroke();
  ctx.shadowBlur = 0; ctx.restore();
}

// Icon type 1: Lotus petals
function iconLotus(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c1: string, c2: string) {
  ctx.save(); ctx.shadowColor = c1; ctx.shadowBlur = 18;
  for (let i = 0; i < 12; i++) {
    const a = (i/12)*Math.PI*2;
    const mx = cx+Math.cos(a)*r*0.5, my = cy+Math.sin(a)*r*0.5;
    const dx = cx+Math.cos(a)*r*0.92, dy = cy+Math.sin(a)*r*0.92;
    ctx.strokeStyle = neonGrad(ctx, mx, my, dx, dy, c1, c2); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.bezierCurveTo(cx+Math.cos(a-0.3)*r*0.7, cy+Math.sin(a-0.3)*r*0.7, cx+Math.cos(a+0.3)*r*0.7, cy+Math.sin(a+0.3)*r*0.7, dx, dy); ctx.stroke();
  }
  ctx.strokeStyle = neonGrad(ctx, cx-r*0.2, cy, cx+r*0.2, cy, c2, c1); ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(cx, cy, r*0.2, 0, Math.PI*2); ctx.stroke();
  ctx.shadowBlur = 0; ctx.restore();
}

// Icon type 2: Hexagram (Star of David style)
function iconStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c1: string, c2: string) {
  ctx.save(); ctx.shadowColor = c1; ctx.shadowBlur = 20;
  for (let s = 0; s < 2; s++) {
    ctx.strokeStyle = s === 0 ? neonGrad(ctx, cx-r, cy, cx+r, cy, c1, c2) : neonGrad(ctx, cx, cy-r, cx, cy+r, c2, c1);
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) { const a = (i/3)*Math.PI*2 + s*Math.PI/3; ctx.lineTo(cx+Math.cos(a)*r*0.88, cy+Math.sin(a)*r*0.88); }
    ctx.closePath(); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(cx, cy, r*0.18, 0, Math.PI*2);
  ctx.strokeStyle = c1; ctx.lineWidth = 4; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.strokeStyle = hex2rgbaCover(c1, 0.35); ctx.lineWidth = 2; ctx.stroke();
  ctx.shadowBlur = 0; ctx.restore();
}

// Icon type 3: Taiji spiral
function iconTaiji(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c1: string, c2: string) {
  ctx.save(); ctx.shadowColor = c1; ctx.shadowBlur = 20;
  ctx.strokeStyle = neonGrad(ctx, cx-r, cy, cx+r, cy, c1, c2); ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy-r/2, r/2, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = neonGrad(ctx, cx, cy, cx, cy+r, c2, c1);
  ctx.beginPath(); ctx.arc(cx, cy+r/2, r/2, 0, Math.PI); ctx.stroke();
  ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(cx, cy-r/2, r*0.09, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(cx, cy+r/2, r*0.09, 0, Math.PI*2); ctx.fill();
  ctx.beginPath();
  for (let a = 0; a < Math.PI*4; a += 0.1) {
    const rr = r*(0.1+0.22*(a/(Math.PI*4))); const x = cx+Math.cos(a)*rr, y = cy+Math.sin(a)*rr;
    if (a === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
  }
  ctx.strokeStyle = hex2rgbaCover(c2, 0.6); ctx.lineWidth = 2; ctx.stroke();
  ctx.shadowBlur = 0; ctx.restore();
}

// Icon type 4: Diamond grid lattice
function iconDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c1: string, c2: string) {
  ctx.save(); ctx.shadowColor = c1; ctx.shadowBlur = 16;
  const step = r * 0.32;
  for (let ix = -2; ix <= 2; ix++) for (let iy = -2; iy <= 2; iy++) {
    const dx = ix*step, dy = iy*step; if (Math.sqrt(dx*dx+dy*dy) > r*0.85) continue;
    const g = neonGrad(ctx, cx+dx-step*0.5, cy+dy, cx+dx+step*0.5, cy+dy, c1, c2);
    ctx.strokeStyle = g; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx+dx, cy+dy-step*0.55); ctx.lineTo(cx+dx+step*0.55, cy+dy); ctx.lineTo(cx+dx, cy+dy+step*0.55); ctx.lineTo(cx+dx-step*0.55, cy+dy); ctx.closePath(); ctx.stroke();
  }
  ctx.strokeStyle = hex2rgbaCover(c1, 0.55); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
  ctx.shadowBlur = 0; ctx.restore();
}

// Icon type 5: Chrysanthemum (ring of arched petals)
function iconChrysanthemum(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c1: string, c2: string) {
  ctx.save(); ctx.shadowColor = c1; ctx.shadowBlur = 18;
  for (let i = 0; i < 16; i++) {
    const a = (i/16)*Math.PI*2, pa = ((i+0.5)/16)*Math.PI*2;
    const pr = r*0.52, pr2 = r*0.92;
    const g = neonGrad(ctx, cx+Math.cos(a)*pr, cy+Math.sin(a)*pr, cx+Math.cos(a)*pr2, cy+Math.sin(a)*pr2, c1, c2);
    ctx.strokeStyle = g; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*pr, cy+Math.sin(a)*pr); ctx.bezierCurveTo(cx+Math.cos(pa)*r*0.75, cy+Math.sin(pa)*r*0.75, cx+Math.cos(pa)*r*0.75, cy+Math.sin(pa)*r*0.75, cx+Math.cos(a)*pr2, cy+Math.sin(a)*pr2); ctx.stroke();
  }
  ctx.strokeStyle = neonGrad(ctx, cx-r*0.48, cy, cx+r*0.48, cy, c2, c1); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, r*0.48, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r*0.16, 0, Math.PI*2); ctx.fillStyle = c1; ctx.fill();
  ctx.shadowBlur = 0; ctx.restore();
}

const ICON_FNS = [iconBagua, iconLotus, iconStar, iconTaiji, iconDiamond, iconChrysanthemum];

function drawChinese(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { coverIndex } = opts;
  const [c1, c2] = PALETTES[coverIndex % PALETTES.length];
  const iconFn   = ICON_FNS[coverIndex % ICON_FNS.length];
  drawBg(ctx);
  drawRainbowBorder(ctx, W, H);
  iconFn(ctx, ICON_CX, ICON_CY, ICON_R, c1, c2);
}

registerCover('chinese', drawChinese);
