/**
 * City landmark drawing functions — cities 0-11 (CITY_SHAPES order)
 * Each fn: (ctx, cx, cy, r) draws neon line-art centered at (cx,cy) within radius r
 */
import { neonGrad } from './registry';
type Fn = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void;

// Helper: draw a stroke path with glow
function gstroke(ctx: CanvasRenderingContext2D, col: string | CanvasGradient, lw: number, blur: number, fn: () => void) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = typeof col === 'string' ? col : '#fff'; ctx.shadowBlur = blur;
  fn(); ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
}

// 0 北京: Gate tower (Tiananmen-style) — gold + red
export const drawBeijing: Fn = (ctx, cx, cy, r) => {
  const s = r / 300;
  gstroke(ctx, neonGrad(ctx, cx-r, cy, cx+r, cy, '#ffd700', '#ff2200'), 5*s, 18, () => {
    // Gate base wall
    ctx.beginPath(); ctx.rect(cx - r*0.9, cy + r*0.15, r*1.8, r*0.5);
    // Arch openings
    [cx - r*0.35, cx, cx + r*0.35].forEach(x => { ctx.moveTo(x, cy + r*0.65); ctx.arc(x, cy + r*0.15, r*0.2, 0, Math.PI, true); });
  });
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy, '#ff2200', '#ffd700'), 5*s, 18, () => {
    // Main tower above gate
    ctx.beginPath(); ctx.rect(cx - r*0.35, cy - r*0.3, r*0.7, r*0.45);
    ctx.moveTo(cx - r*0.45, cy - r*0.3); ctx.lineTo(cx, cy - r*0.75); ctx.lineTo(cx + r*0.45, cy - r*0.3);
    // Side towers
    ctx.rect(cx - r*0.75, cy - r*0.1, r*0.25, r*0.25);
    ctx.moveTo(cx - r*0.88, cy - r*0.1); ctx.lineTo(cx - r*0.63, cy - r*0.1); ctx.lineTo(cx - r*0.75, cy - r*0.28);
    ctx.rect(cx + r*0.5, cy - r*0.1, r*0.25, r*0.25);
    ctx.moveTo(cx + r*0.5, cy - r*0.1); ctx.lineTo(cx + r*0.75, cy - r*0.1); ctx.lineTo(cx + r*0.625, cy - r*0.28);
  });
};

// 1 天津: Ferris Wheel (Eye of Tianjin style) — cyan + blue
export const drawTianjin: Fn = (ctx, cx, cy, r) => {
  const s = r / 300;
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#00ffee', '#0044ff'), 4*s, 20, () => {
    ctx.beginPath(); ctx.arc(cx, cy - r*0.15, r*0.7, 0, Math.PI * 2);
    for (let i = 0; i < 8; i++) { const a = (i/8)*Math.PI*2; ctx.moveTo(cx, cy - r*0.15); ctx.lineTo(cx + Math.cos(a)*r*0.7, cy - r*0.15 + Math.sin(a)*r*0.7); }
    // support legs
    ctx.moveTo(cx - r*0.12, cy + r*0.55); ctx.lineTo(cx - r*0.35, cy + r*0.92);
    ctx.moveTo(cx + r*0.12, cy + r*0.55); ctx.lineTo(cx + r*0.35, cy + r*0.92);
    ctx.moveTo(cx - r*0.35, cy + r*0.92); ctx.lineTo(cx + r*0.35, cy + r*0.92);
  });
};

// 2 石家庄: Skyscrapers — purple + magenta
export const drawShijiazhuang: Fn = (ctx, cx, cy, r) => {
  const s = r / 300;
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#cc00ff', '#ff00aa'), 4*s, 16, () => {
    ctx.beginPath();
    [[cx-r*0.55,r*0.7],[cx-r*0.2,r*0.9],[cx+r*0.15,r*0.75],[cx+r*0.5,r*0.55]].forEach(([x,h]) => {
      const bx = x as number, bh = h as number;
      ctx.rect(bx - r*0.1, cy + r*0.92 - bh, r*0.2, bh);
      for (let yi = 0; yi < 4; yi++) for (let xi = 0; xi < 2; xi++) ctx.rect(bx - r*0.07 + xi*r*0.1, cy + r*0.92 - bh + yi*r*0.15 + r*0.05, r*0.06, r*0.08);
    });
  });
};

// 3 沈阳: Multi-tier pagoda — orange + red
export const drawShenyang: Fn = (ctx, cx, cy, r) => {
  const s = r / 300;
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#ff8800', '#ff2200'), 4*s, 18, () => {
    ctx.beginPath();
    [[0.85, 0.22], [0.65, 0.18], [0.45, 0.15], [0.28, 0.12], [0.15, 0.1]].forEach(([w, h], i) => {
      const ty = cy - r*0.85 + i * r*0.36;
      ctx.rect(cx - r*w/2, ty, r*w, r*h);
      ctx.moveTo(cx - r*(w/2 + 0.08), ty); ctx.lineTo(cx, ty - r*0.14); ctx.lineTo(cx + r*(w/2 + 0.08), ty);
    });
    ctx.moveTo(cx - r*0.45, cy + r*0.92); ctx.lineTo(cx + r*0.45, cy + r*0.92);
  });
};

// 4 长春: Modern arch dome — green + teal
export const drawChangchun: Fn = (ctx, cx, cy, r) => {
  const s = r / 300;
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#00ff88', '#00cccc'), 4*s, 18, () => {
    ctx.beginPath(); ctx.arc(cx, cy + r*0.1, r*0.7, Math.PI, 0);
    ctx.moveTo(cx - r*0.7, cy + r*0.1); ctx.lineTo(cx - r*0.7, cy + r*0.92);
    ctx.moveTo(cx + r*0.7, cy + r*0.1); ctx.lineTo(cx + r*0.7, cy + r*0.92);
    ctx.moveTo(cx - r*0.7, cy + r*0.92); ctx.lineTo(cx + r*0.7, cy + r*0.92);
    // inner arch ribs
    for (let i = 1; i < 5; i++) { const a = Math.PI + (i/5)*Math.PI; ctx.moveTo(cx, cy + r*0.1); ctx.lineTo(cx + Math.cos(a)*r*0.7, cy + r*0.1 + Math.sin(a)*r*0.7); }
  });
};

// 5 哈尔滨: Onion-dome church (St. Sophia) — blue + cyan
export const drawHarbin: Fn = (ctx, cx, cy, r) => {
  const s = r / 300;
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#0088ff', '#00ffee'), 4*s, 20, () => {
    ctx.beginPath();
    // Main dome
    ctx.arc(cx, cy - r*0.15, r*0.3, Math.PI, 0);
    ctx.moveTo(cx - r*0.3, cy - r*0.15); ctx.lineTo(cx - r*0.35, cy + r*0.5);
    ctx.moveTo(cx + r*0.3, cy - r*0.15); ctx.lineTo(cx + r*0.35, cy + r*0.5);
    ctx.moveTo(cx - r*0.35, cy + r*0.5); ctx.lineTo(cx + r*0.35, cy + r*0.5);
    // Spire tip (onion shape)
    ctx.moveTo(cx, cy - r*0.45); ctx.bezierCurveTo(cx - r*0.18, cy - r*0.35, cx - r*0.08, cy - r*0.15, cx, cy - r*0.15);
    ctx.moveTo(cx, cy - r*0.45); ctx.bezierCurveTo(cx + r*0.18, cy - r*0.35, cx + r*0.08, cy - r*0.15, cx, cy - r*0.15);
    // Cross
    ctx.moveTo(cx, cy - r*0.85); ctx.lineTo(cx, cy - r*0.5);
    ctx.moveTo(cx - r*0.12, cy - r*0.7); ctx.lineTo(cx + r*0.12, cy - r*0.7);
    // Side towers
    ctx.arc(cx - r*0.55, cy + r*0.15, r*0.14, Math.PI, 0);
    ctx.arc(cx + r*0.55, cy + r*0.15, r*0.14, Math.PI, 0);
  });
};

// 6 上海: Oriental Pearl Tower (sphere on column) — purple + blue
export const drawShanghai: Fn = (ctx, cx, cy, r) => {
  const s = r / 300;
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#aa00ff', '#0066ff'), 5*s, 22, () => {
    ctx.beginPath();
    // Tripod legs
    ctx.moveTo(cx, cy + r*0.92); ctx.lineTo(cx - r*0.55, cy + r*0.55);
    ctx.moveTo(cx, cy + r*0.92); ctx.lineTo(cx + r*0.55, cy + r*0.55);
    ctx.moveTo(cx, cy + r*0.92); ctx.lineTo(cx, cy + r*0.25);
    // Lower sphere
    ctx.arc(cx, cy + r*0.15, r*0.22, 0, Math.PI*2);
    // Mast
    ctx.moveTo(cx, cy - r*0.07); ctx.lineTo(cx, cy - r*0.55);
    // Upper sphere
    ctx.arc(cx, cy - r*0.66, r*0.15, 0, Math.PI*2);
    // Spire
    ctx.moveTo(cx, cy - r*0.81); ctx.lineTo(cx, cy - r*0.98);
  });
};

// 7 南京: Purple Mountain Pagoda — orange + yellow
export const drawNanjing: Fn = (ctx, cx, cy, r) => {
  const s = r / 300;
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#ff8800', '#ffee00'), 4*s, 18, () => {
    ctx.beginPath();
    [[0.7,0.18],[0.52,0.16],[0.38,0.14],[0.26,0.13],[0.16,0.1],[0.08,0.08]].forEach(([w,h],i) => {
      const ty = cy - r*0.85 + i*r*0.3;
      ctx.rect(cx - r*w/2, ty, r*w, r*h);
      ctx.moveTo(cx - r*(w/2+0.06), ty); ctx.lineTo(cx, ty - r*0.12); ctx.lineTo(cx + r*(w/2+0.06), ty);
    });
    ctx.moveTo(cx, cy - r*0.85 - r*0.06*6); ctx.lineTo(cx, cy - r*0.85 - r*0.22);
    ctx.moveTo(cx - r*0.35, cy + r*0.93); ctx.lineTo(cx + r*0.35, cy + r*0.93);
  });
};

// 8 杭州: Leifeng Pagoda over lake — teal + green
export const drawHangzhou: Fn = (ctx, cx, cy, r) => {
  const s = r / 300;
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#00ccaa', '#44ff44'), 4*s, 18, () => {
    ctx.beginPath();
    // Pagoda tiers (5)
    [[0.55,0.16],[0.42,0.14],[0.3,0.12],[0.2,0.1],[0.12,0.1]].forEach(([w,h],i) => {
      const ty = cy - r*0.65 + i*r*0.26; ctx.rect(cx - r*w/2, ty, r*w, r*h);
      ctx.moveTo(cx-r*(w/2+0.05), ty); ctx.lineTo(cx, ty-r*0.1); ctx.lineTo(cx+r*(w/2+0.05), ty);
    });
    ctx.moveTo(cx, cy - r*0.65 - r*0.25); ctx.lineTo(cx, cy - r*0.3);
    // Lake base ripple
    ctx.moveTo(cx - r*0.9, cy + r*0.6); ctx.bezierCurveTo(cx - r*0.5, cy + r*0.45, cx + r*0.5, cy + r*0.45, cx + r*0.9, cy + r*0.6);
    ctx.moveTo(cx - r*0.9, cy + r*0.78); ctx.bezierCurveTo(cx - r*0.5, cy + r*0.63, cx + r*0.5, cy + r*0.63, cx + r*0.9, cy + r*0.78);
    ctx.moveTo(cx - r*0.9, cy + r*0.93); ctx.lineTo(cx + r*0.9, cy + r*0.93);
  });
};

// 9 合肥: Anhui arch landmark — pink + purple
export const drawHefei: Fn = (ctx, cx, cy, r) => {
  const s = r / 300;
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#ff44aa', '#8800ff'), 4*s, 18, () => {
    ctx.beginPath();
    // Large arch
    ctx.arc(cx, cy + r*0.15, r*0.75, Math.PI, 0);
    ctx.moveTo(cx - r*0.75, cy + r*0.15); ctx.lineTo(cx - r*0.75, cy + r*0.93);
    ctx.moveTo(cx + r*0.75, cy + r*0.15); ctx.lineTo(cx + r*0.75, cy + r*0.93);
    // Small arch inside
    ctx.arc(cx, cy + r*0.3, r*0.38, Math.PI, 0);
    // Top element
    ctx.moveTo(cx, cy - r*0.6); ctx.lineTo(cx, cy + r*0.3);
    ctx.arc(cx, cy - r*0.68, r*0.1, 0, Math.PI*2);
  });
};

// 10 福州: White Pagoda (7-tier) — yellow + orange
export const drawFuzhou: Fn = (ctx, cx, cy, r) => {
  const s = r / 300;
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#ffee00', '#ff6600'), 4*s, 18, () => {
    ctx.beginPath();
    [[0.68,0.15],[0.54,0.13],[0.42,0.12],[0.32,0.11],[0.23,0.1],[0.15,0.09],[0.09,0.09]].forEach(([w,h],i) => {
      const ty = cy - r*0.88 + i*r*0.27; ctx.rect(cx - r*w/2, ty, r*w, r*h);
      ctx.moveTo(cx-r*(w/2+0.04), ty); ctx.lineTo(cx, ty-r*0.1); ctx.lineTo(cx+r*(w/2+0.04), ty);
    });
    ctx.moveTo(cx, cy - r*0.88 - r*0.2); ctx.lineTo(cx, cy - r*0.88);
    ctx.moveTo(cx - r*0.35, cy + r*0.93); ctx.lineTo(cx + r*0.35, cy + r*0.93);
  });
};

// 11 南昌: Tengwang Pavilion (3-tier) — red + coral
export const drawNanchang: Fn = (ctx, cx, cy, r) => {
  const s = r / 300;
  gstroke(ctx, neonGrad(ctx, cx, cy-r, cx, cy+r, '#ff2244', '#ff8866'), 4*s, 18, () => {
    ctx.beginPath();
    // Base platform
    ctx.rect(cx - r*0.75, cy + r*0.6, r*1.5, r*0.22);
    // 3 tiers
    [[0.65,0.22],[0.48,0.22],[0.32,0.2]].forEach(([w,h],i) => {
      const ty = cy - r*0.12 + i*(-r*0.36);
      ctx.rect(cx - r*w/2, ty - r*h, r*w, r*h);
      ctx.moveTo(cx-r*(w/2+0.08), ty - r*h); ctx.lineTo(cx, ty - r*h - r*0.16); ctx.lineTo(cx+r*(w/2+0.08), ty - r*h);
    });
    ctx.moveTo(cx, cy - r*0.7 - r*0.16*3); ctx.lineTo(cx, cy - r*0.7 - r*0.38);
  });
};

export const CITY_LANDMARKS_A = [
  drawBeijing, drawTianjin, drawShijiazhuang, drawShenyang, drawChangchun, drawHarbin,
  drawShanghai, drawNanjing, drawHangzhou, drawHefei, drawFuzhou, drawNanchang,
];
