/**
 * City landmark drawing functions — cities 12-23 (CITY_SHAPES order)
 */
import { neonGrad } from './registry';
type Fn = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void;

function gstroke(ctx: CanvasRenderingContext2D, col: string | CanvasGradient, lw: number, blur: number, fn: () => void) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = typeof col === 'string' ? col : '#fff'; ctx.shadowBlur = blur;
  fn(); ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
}

// 12 武汉: Yellow Crane Tower (5-tier) — blue + cyan
export const drawWuhan: Fn = (ctx, cx, cy, r) => {
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#0088ff', '#00ffee'), 4*r/300, 20, () => {
    ctx.beginPath();
    [[0.8,0.2],[0.62,0.18],[0.46,0.16],[0.32,0.14],[0.2,0.12]].forEach(([w,h],i) => {
      const ty = cy - r*0.78 + i*r*0.32; ctx.rect(cx-r*w/2, ty, r*w, r*h);
      ctx.moveTo(cx-r*(w/2+0.08), ty); ctx.lineTo(cx, ty-r*0.18); ctx.lineTo(cx+r*(w/2+0.08), ty);
    });
    ctx.moveTo(cx, cy - r*0.88); ctx.lineTo(cx, cy - r*0.78 - r*0.34);
    ctx.moveTo(cx-r*0.4, cy+r*0.92); ctx.lineTo(cx+r*0.4, cy+r*0.92);
  });
};

// 13 长沙: Mountain silhouette + tall mast — red + orange
export const drawChangsha: Fn = (ctx, cx, cy, r) => {
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#ff2200', '#ffaa00'), 4*r/300, 18, () => {
    ctx.beginPath();
    ctx.moveTo(cx-r*0.9, cy+r*0.92); ctx.lineTo(cx-r*0.55, cy-r*0.1); ctx.lineTo(cx-r*0.15, cy+r*0.35);
    ctx.lineTo(cx+r*0.1, cy-r*0.3); ctx.lineTo(cx+r*0.45, cy+r*0.1); ctx.lineTo(cx+r*0.9, cy+r*0.92);
    ctx.moveTo(cx+r*0.1, cy-r*0.3); ctx.lineTo(cx+r*0.1, cy-r*0.92);
    ctx.moveTo(cx-r*0.08, cy-r*0.6); ctx.lineTo(cx+r*0.28, cy-r*0.6);
  });
};

// 14 广州: Canton Tower (hyperboloid) — purple + magenta
export const drawGuangzhou: Fn = (ctx, cx, cy, r) => {
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#aa00ff', '#ff00aa'), 4*r/300, 22, () => {
    ctx.beginPath();
    // Hyperboloid outline (twisted waist)
    ctx.moveTo(cx-r*0.25, cy-r*0.92); ctx.bezierCurveTo(cx-r*0.55, cy-r*0.5, cx+r*0.55, cy+r*0.1, cx+r*0.32, cy+r*0.92);
    ctx.moveTo(cx+r*0.25, cy-r*0.92); ctx.bezierCurveTo(cx+r*0.55, cy-r*0.5, cx-r*0.55, cy+r*0.1, cx-r*0.32, cy+r*0.92);
    // Horizontal rings at waist
    for (let i = 0; i < 5; i++) { const y = cy - r*0.6 + i*r*0.3; const xw = r*(0.05 + 0.12*Math.abs(i-2)*0.5); ctx.ellipse(cx, y, xw+r*0.08, r*0.035, 0, 0, Math.PI*2); }
    // Spire
    ctx.moveTo(cx, cy-r*0.92); ctx.lineTo(cx, cy-r*1.0);
  });
};

// 15 南宁: Tropical leaf + tower — green + lime
export const drawNanning: Fn = (ctx, cx, cy, r) => {
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#22ee00', '#88ff44'), 4*r/300, 18, () => {
    ctx.beginPath();
    // Leaf shape
    ctx.moveTo(cx, cy-r*0.85); ctx.bezierCurveTo(cx+r*0.55, cy-r*0.55, cx+r*0.65, cy+r*0.1, cx, cy+r*0.5);
    ctx.bezierCurveTo(cx-r*0.65, cy+r*0.1, cx-r*0.55, cy-r*0.55, cx, cy-r*0.85);
    // Midrib
    ctx.moveTo(cx, cy-r*0.85); ctx.lineTo(cx, cy+r*0.5);
    // Veins
    for (let i = 1; i < 5; i++) { const y = cy-r*0.6+i*r*0.25; const xw = r*0.35*(1-i*0.1); ctx.moveTo(cx, y); ctx.lineTo(cx+xw, y-r*0.05); ctx.moveTo(cx, y); ctx.lineTo(cx-xw, y-r*0.05); }
    ctx.moveTo(cx, cy+r*0.5); ctx.lineTo(cx, cy+r*0.93);
  });
};

// 16 海口: Coconut palm + waves — teal + cyan
export const drawHaikou: Fn = (ctx, cx, cy, r) => {
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#00ccaa', '#00ffff'), 4*r/300, 18, () => {
    ctx.beginPath();
    // Palm trunk (curved)
    ctx.moveTo(cx-r*0.05, cy+r*0.65); ctx.bezierCurveTo(cx-r*0.15, cy+r*0.1, cx+r*0.1, cy-r*0.2, cx+r*0.05, cy-r*0.6);
    // Palm fronds
    [[cx+r*0.05, cy-r*0.6, cx+r*0.6, cy-r*0.92, cx+r*0.7, cy-r*0.55],
     [cx+r*0.05, cy-r*0.6, cx-r*0.5, cy-r*0.82, cx-r*0.65, cy-r*0.45],
     [cx+r*0.05, cy-r*0.6, cx+r*0.15, cy-r*0.98, cx-r*0.15, cy-r*0.9],
    ].forEach(([x1,y1,x2,y2,x3,y3]) => { ctx.moveTo(x1,y1); ctx.quadraticCurveTo(x2,y2,x3,y3); });
    // Waves
    [0.7, 0.82, 0.93].forEach(yf => {
      ctx.moveTo(cx-r*0.8, cy+r*yf); ctx.bezierCurveTo(cx-r*0.5, cy+r*(yf-0.06), cx-r*0.2, cy+r*(yf+0.06), cx, cy+r*yf);
      ctx.bezierCurveTo(cx+r*0.2, cy+r*(yf-0.06), cx+r*0.5, cy+r*(yf+0.06), cx+r*0.8, cy+r*yf);
    });
  });
};

// 17 成都: Panda face — green + white (two colors)
export const drawChengdu: Fn = (ctx, cx, cy, r) => {
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#00ff88', '#ffffff'), 4*r/300, 18, () => {
    ctx.beginPath();
    // Head circle
    ctx.arc(cx, cy-r*0.05, r*0.72, 0, Math.PI*2);
    // Ears
    ctx.arc(cx-r*0.52, cy-r*0.62, r*0.2, 0, Math.PI*2);
    ctx.arc(cx+r*0.52, cy-r*0.62, r*0.2, 0, Math.PI*2);
    // Eyes (filled ellipses via arcs)
    ctx.ellipse(cx-r*0.24, cy-r*0.18, r*0.18, r*0.22, -0.3, 0, Math.PI*2);
    ctx.ellipse(cx+r*0.24, cy-r*0.18, r*0.18, r*0.22, 0.3, 0, Math.PI*2);
    // Nose + smile
    ctx.arc(cx, cy+r*0.08, r*0.1, 0, Math.PI*2);
    ctx.moveTo(cx-r*0.28, cy+r*0.25); ctx.quadraticCurveTo(cx, cy+r*0.42, cx+r*0.28, cy+r*0.25);
    // Bamboo shoot
    ctx.moveTo(cx-r*0.1, cy+r*0.67); ctx.lineTo(cx-r*0.1, cy+r*0.93);
    ctx.moveTo(cx+r*0.1, cy+r*0.67); ctx.lineTo(cx+r*0.1, cy+r*0.93);
    ctx.moveTo(cx-r*0.3, cy+r*0.73); ctx.lineTo(cx+r*0.3, cy+r*0.73);
  });
};

// 18 昆明: Lake + mountain — lavender + blue
export const drawKunming: Fn = (ctx, cx, cy, r) => {
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#aa66ff', '#4488ff'), 4*r/300, 18, () => {
    ctx.beginPath();
    ctx.moveTo(cx-r*0.9, cy+r*0.92); ctx.lineTo(cx-r*0.5, cy-r*0.55); ctx.lineTo(cx, cy-r*0.88); ctx.lineTo(cx+r*0.5, cy-r*0.45); ctx.lineTo(cx+r*0.9, cy+r*0.92);
    ctx.moveTo(cx-r*0.9, cy+r*0.55); ctx.bezierCurveTo(cx-r*0.4, cy+r*0.35, cx+r*0.4, cy+r*0.35, cx+r*0.9, cy+r*0.55);
    ctx.moveTo(cx-r*0.9, cy+r*0.72); ctx.bezierCurveTo(cx-r*0.4, cy+r*0.55, cx+r*0.4, cy+r*0.55, cx+r*0.9, cy+r*0.72);
    ctx.moveTo(cx-r*0.9, cy+r*0.92); ctx.lineTo(cx+r*0.9, cy+r*0.92);
  });
};

// 19 拉萨: Potala Palace (tiered pyramid) — gold + red
export const drawLhasa: Fn = (ctx, cx, cy, r) => {
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#ffcc00', '#ff2200'), 4*r/300, 20, () => {
    ctx.beginPath();
    // Hill base
    ctx.arc(cx, cy+r*0.92, r*1.0, Math.PI, 0, true);
    // Palace tiers (wide to narrow, step pyramid)
    [[1.5,0.25],[1.1,0.25],[0.75,0.25],[0.45,0.2],[0.25,0.2]].forEach(([w,h],i) => {
      const by = cy + r*0.35 - i*r*0.28; ctx.rect(cx-r*w/2, by-r*h, r*w, r*h);
    });
    // Rooftop
    ctx.moveTo(cx-r*0.14, cy-r*0.65); ctx.lineTo(cx, cy-r*0.82); ctx.lineTo(cx+r*0.14, cy-r*0.65);
  });
};

// 20 西安: Bell Tower (octagonal, double-roof) — gold + amber
export const drawXian: Fn = (ctx, cx, cy, r) => {
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#ffcc00', '#ff8800'), 4*r/300, 20, () => {
    ctx.beginPath();
    // Outer square base
    ctx.rect(cx-r*0.6, cy+r*0.3, r*1.2, r*0.55);
    // First roof
    ctx.moveTo(cx-r*0.7, cy+r*0.3); ctx.lineTo(cx, cy-r*0.08); ctx.lineTo(cx+r*0.7, cy+r*0.3);
    // Second tier
    ctx.rect(cx-r*0.35, cy-r*0.08, r*0.7, r*0.32);
    // Second roof
    ctx.moveTo(cx-r*0.45, cy-r*0.08); ctx.lineTo(cx, cy-r*0.52); ctx.lineTo(cx+r*0.45, cy-r*0.08);
    // Top spire
    ctx.moveTo(cx, cy-r*0.52); ctx.lineTo(cx, cy-r*0.88);
    ctx.arc(cx, cy-r*0.92, r*0.06, 0, Math.PI*2);
  });
};

// 21 兰州: Yellow River suspension bridge — blue + cyan
export const drawLanzhou: Fn = (ctx, cx, cy, r) => {
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#0055ff', '#00ddff'), 4*r/300, 18, () => {
    ctx.beginPath();
    // Bridge deck
    ctx.moveTo(cx-r*0.9, cy+r*0.15); ctx.lineTo(cx+r*0.9, cy+r*0.15);
    // Pylons
    ctx.moveTo(cx-r*0.35, cy-r*0.75); ctx.lineTo(cx-r*0.35, cy+r*0.65);
    ctx.moveTo(cx+r*0.35, cy-r*0.75); ctx.lineTo(cx+r*0.35, cy+r*0.65);
    // Cables (left pylon)
    for (let i = -4; i <= 4; i++) { ctx.moveTo(cx-r*0.35, cy-r*0.65); ctx.lineTo(cx-r*0.9+Math.abs(i)*r*0.1, cy+r*0.15); }
    for (let i = -4; i <= 4; i++) { ctx.moveTo(cx+r*0.35, cy-r*0.65); ctx.lineTo(cx+r*0.9-Math.abs(i)*r*0.1, cy+r*0.15); }
    // River waves below
    ctx.moveTo(cx-r*0.9, cy+r*0.55); ctx.bezierCurveTo(cx-r*0.5, cy+r*0.42, cx+r*0.5, cy+r*0.42, cx+r*0.9, cy+r*0.55);
    ctx.moveTo(cx-r*0.9, cy+r*0.75); ctx.bezierCurveTo(cx-r*0.5, cy+r*0.62, cx+r*0.5, cy+r*0.62, cx+r*0.9, cy+r*0.75);
    ctx.moveTo(cx-r*0.9, cy+r*0.93); ctx.lineTo(cx+r*0.9, cy+r*0.93);
  });
};

// 22 乌鲁木齐: Mosque dome + snowflake — white + blue
export const drawUrumqi: Fn = (ctx, cx, cy, r) => {
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#ffffff', '#4488ff'), 4*r/300, 18, () => {
    ctx.beginPath();
    // Dome
    ctx.arc(cx, cy-r*0.1, r*0.45, Math.PI, 0);
    ctx.moveTo(cx-r*0.45, cy-r*0.1); ctx.lineTo(cx-r*0.45, cy+r*0.55);
    ctx.moveTo(cx+r*0.45, cy-r*0.1); ctx.lineTo(cx+r*0.45, cy+r*0.55);
    ctx.moveTo(cx-r*0.45, cy+r*0.55); ctx.lineTo(cx+r*0.45, cy+r*0.55);
    // Minaret
    ctx.moveTo(cx, cy-r*0.55); ctx.lineTo(cx, cy-r*0.92);
    ctx.arc(cx, cy-r*0.6, r*0.06, 0, Math.PI*2);
    // Snowflake
    for (let i = 0; i < 6; i++) { const a = (i/6)*Math.PI*2; ctx.moveTo(cx+r*0.68, cy+r*0.2); ctx.lineTo(cx+r*0.68+Math.cos(a)*r*0.18, cy+r*0.2+Math.sin(a)*r*0.18); }
  });
};

// 23 重庆: Mountain city layers + bridge — red + orange
export const drawChongqing: Fn = (ctx, cx, cy, r) => {
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#ff2200', '#ffaa00'), 4*r/300, 20, () => {
    ctx.beginPath();
    // Layered mountain terraces
    ctx.moveTo(cx-r*0.9, cy+r*0.92); ctx.lineTo(cx-r*0.7, cy+r*0.4); ctx.lineTo(cx-r*0.35, cy+r*0.6); ctx.lineTo(cx-r*0.2, cy-r*0.1);
    ctx.lineTo(cx, cy-r*0.5); ctx.lineTo(cx+r*0.2, cy-r*0.1); ctx.lineTo(cx+r*0.35, cy+r*0.6); ctx.lineTo(cx+r*0.7, cy+r*0.4); ctx.lineTo(cx+r*0.9, cy+r*0.92);
    // Buildings on terraces
    ctx.rect(cx-r*0.15, cy-r*0.5, r*0.1, r*0.3);
    ctx.rect(cx+r*0.05, cy-r*0.42, r*0.08, r*0.25);
    // Bridge cable
    ctx.moveTo(cx-r*0.9, cy+r*0.15); ctx.bezierCurveTo(cx-r*0.3, cy-r*0.12, cx+r*0.3, cy-r*0.12, cx+r*0.9, cy+r*0.15);
    ctx.moveTo(cx-r*0.9, cy+r*0.15); ctx.lineTo(cx+r*0.9, cy+r*0.15);
  });
};

export const CITY_LANDMARKS_B = [
  drawWuhan, drawChangsha, drawGuangzhou, drawNanning, drawHaikou,
  drawChengdu, drawKunming, drawLhasa, drawXian, drawLanzhou, drawUrumqi, drawChongqing,
];
