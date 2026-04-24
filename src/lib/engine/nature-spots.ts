export type SpotFn = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string) => void;

// ── Utility ──────────────────────────────────────────────────────────────────
function pine(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, col: string) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - h); ctx.lineTo(x + h * 0.35, y); ctx.lineTo(x - h * 0.35, y);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - h * 1.3); ctx.lineTo(x + h * 0.25, y - h * 0.4); ctx.lineTo(x - h * 0.25, y - h * 0.4);
  ctx.closePath(); ctx.fill();
}

// ── 黄山: jagged granite peaks + pine trees ──────────────────────────────────
export const drawHuangshan: SpotFn = (ctx, cx, cy, r, col) => {
  ctx.save(); ctx.globalAlpha = 0.85;
  const peaks = [[-0.55, 0.1, 0.5], [-0.2, -0.3, 0.6], [0, -0.5, 0.55], [0.25, -0.25, 0.45], [0.55, 0.05, 0.4]];
  peaks.forEach(([dx, dy, h]) => {
    ctx.beginPath();
    const bx = cx + dx * r, by = cy + dy * r, ph = h * r;
    ctx.moveTo(bx, by + ph * 0.5); ctx.lineTo(bx - ph * 0.35, by + ph * 0.5);
    ctx.lineTo(bx - ph * 0.12, by); ctx.lineTo(bx, by - ph * 0.45);
    ctx.lineTo(bx + ph * 0.12, by); ctx.lineTo(bx + ph * 0.35, by + ph * 0.5);
    ctx.fillStyle = col; ctx.globalAlpha = 0.55 + Math.abs(dx) * 0.2; ctx.fill();
  });
  pine(ctx, cx - r * 0.38, cy + r * 0.1, r * 0.16, col);
  pine(ctx, cx + r * 0.42, cy + r * 0.12, r * 0.14, col);
  ctx.restore();
};

// ── 西湖: calm water + pagoda + willow ───────────────────────────────────────
export const drawXihu: SpotFn = (ctx, cx, cy, r, col) => {
  ctx.save(); ctx.globalAlpha = 0.75;
  // Water layers
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.15 + i * r * 0.1, r * (0.7 - i * 0.06), r * 0.06, 0, 0, Math.PI * 2);
    ctx.strokeStyle = col; ctx.globalAlpha = 0.25 + i * 0.1; ctx.lineWidth = 1.5; ctx.stroke();
  }
  // Pagoda silhouette
  ctx.globalAlpha = 0.7;
  [0, -1, -2].forEach(tier => {
    const ty = cy - r * 0.15 + tier * r * 0.2;
    const tw = r * (0.18 + Math.abs(tier) * 0.06);
    ctx.fillStyle = col;
    ctx.fillRect(cx - tw / 2, ty - r * 0.12, tw, r * 0.13);
    ctx.beginPath(); ctx.moveTo(cx, ty - r * 0.18); ctx.lineTo(cx - tw / 2 - r * 0.04, ty - r * 0.12);
    ctx.lineTo(cx + tw / 2 + r * 0.04, ty - r * 0.12); ctx.fill();
  });
  ctx.restore();
};

// ── 泰山: broad layered mountain ─────────────────────────────────────────────
export const drawTaishan: SpotFn = (ctx, cx, cy, r, col) => {
  ctx.save();
  [[1, 0.2, 0.45], [0.7, -0.05, 0.6], [0.4, -0.4, 0.5]].forEach(([sw, dy, ht], i) => {
    ctx.beginPath();
    ctx.moveTo(cx - r * sw, cy + r * 0.3); ctx.lineTo(cx, cy + dy * r);
    ctx.lineTo(cx + r * sw, cy + r * 0.3); ctx.closePath();
    ctx.fillStyle = col; ctx.globalAlpha = 0.3 + i * 0.22; ctx.fill();
  });
  // Steps path
  ctx.globalAlpha = 0.6; ctx.strokeStyle = col; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - r * 0.04, cy - r * 0.35); ctx.lineTo(cx + r * 0.04, cy + r * 0.28);
  ctx.stroke();
  ctx.restore();
};

// ── 九寨沟: colorful layered lake ─────────────────────────────────────────────
export const drawJiuzhaigou: SpotFn = (ctx, cx, cy, r, col) => {
  ctx.save();
  [-0.3, -0.05, 0.2, 0.38].forEach((dy, i) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy + dy * r, r * (0.62 - i * 0.06), r * 0.16, 0, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.globalAlpha = 0.15 + i * 0.12; ctx.fill();
    ctx.strokeStyle = col; ctx.globalAlpha = 0.5 + i * 0.1; ctx.lineWidth = 1.5; ctx.stroke();
  });
  // Waterfall line
  ctx.globalAlpha = 0.7; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx + r * 0.25, cy - r * 0.35); ctx.lineTo(cx + r * 0.22, cy + r * 0.35);
  ctx.stroke();
  ctx.restore();
};

// ── 张家界: tall narrow pillars ───────────────────────────────────────────────
export const drawZhangjiajie: SpotFn = (ctx, cx, cy, r, col) => {
  ctx.save();
  [[-0.45, 0.55, 0.12], [-0.22, 0.7, 0.11], [0, 0.65, 0.13], [0.22, 0.72, 0.1], [0.45, 0.58, 0.12]].forEach(([dx, h, w]) => {
    ctx.fillStyle = col; ctx.globalAlpha = 0.55;
    ctx.fillRect(cx + dx * r - w * r / 2, cy - h * r / 2, w * r, h * r);
    // Flat top with pine
    ctx.globalAlpha = 0.7;
    pine(ctx, cx + dx * r, cy - h * r / 2 - r * 0.06, r * 0.1, col);
  });
  ctx.restore();
};

// ── 桂林: karst hills + Li River ─────────────────────────────────────────────
export const drawGuilin: SpotFn = (ctx, cx, cy, r, col) => {
  ctx.save();
  [[-0.4, 0.35], [-0.15, 0.5], [0.1, 0.45], [0.35, 0.38]].forEach(([dx, h]) => {
    ctx.beginPath();
    ctx.ellipse(cx + dx * r, cy + r * 0.08 - h * r, r * 0.13, h * r, 0, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.globalAlpha = 0.55; ctx.fill();
  });
  // Li River reflection
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.28, r * 0.65, r * 0.09, 0, 0, Math.PI * 2);
  ctx.fillStyle = col; ctx.globalAlpha = 0.18; ctx.fill();
  ctx.strokeStyle = col; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5; ctx.stroke();
  // Boat
  ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - r * 0.12, cy + r * 0.26); ctx.lineTo(cx + r * 0.12, cy + r * 0.26);
  ctx.lineTo(cx + r * 0.08, cy + r * 0.32); ctx.lineTo(cx - r * 0.08, cy + r * 0.32); ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

// ── 峨眉山: layered peaks with cloud ─────────────────────────────────────────
export const drawEmei: SpotFn = (ctx, cx, cy, r, col) => {
  ctx.save();
  [[0.9, 0, 0.35], [0.65, -0.25, 0.5], [0.4, -0.45, 0.45]].forEach(([sw, dy, ht], i) => {
    ctx.beginPath();
    ctx.moveTo(cx - r * sw, cy + r * 0.3); ctx.lineTo(cx, cy + dy * r);
    ctx.lineTo(cx + r * sw, cy + r * 0.3); ctx.closePath();
    ctx.fillStyle = col; ctx.globalAlpha = 0.28 + i * 0.2; ctx.fill();
  });
  // Golden Summit flash
  ctx.globalAlpha = 0.8; ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(cx, cy - r * 0.42, r * 0.06, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};

// ── 三峡: steep cliffs + gorge ────────────────────────────────────────────────
export const drawSanxia: SpotFn = (ctx, cx, cy, r, col) => {
  ctx.save();
  // Left cliff
  ctx.fillStyle = col; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(cx - r * 0.65, cy + r * 0.35); ctx.lineTo(cx - r * 0.65, cy - r * 0.4);
  ctx.lineTo(cx - r * 0.15, cy - r * 0.2); ctx.lineTo(cx - r * 0.15, cy + r * 0.35); ctx.closePath(); ctx.fill();
  // Right cliff
  ctx.beginPath(); ctx.moveTo(cx + r * 0.65, cy + r * 0.35); ctx.lineTo(cx + r * 0.65, cy - r * 0.4);
  ctx.lineTo(cx + r * 0.15, cy - r * 0.2); ctx.lineTo(cx + r * 0.15, cy + r * 0.35); ctx.closePath(); ctx.fill();
  // River
  ctx.globalAlpha = 0.3; ctx.fillRect(cx - r * 0.13, cy - r * 0.2, r * 0.26, r * 0.55);
  ctx.restore();
};

// ── 长城: battlements on ridge ────────────────────────────────────────────────
export const drawChangcheng: SpotFn = (ctx, cx, cy, r, col) => {
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col;
  // Ridge
  ctx.globalAlpha = 0.7; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - r * 0.65, cy + r * 0.2);
  ctx.bezierCurveTo(cx - r * 0.2, cy - r * 0.3, cx + r * 0.2, cy - r * 0.25, cx + r * 0.65, cy + r * 0.15);
  ctx.stroke();
  // Battlements
  ctx.globalAlpha = 0.65;
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const bx = cx + (t - 0.5) * 2 * r * 0.65;
    const by = cy + (Math.pow(t - 0.5, 2) * 0.8 - 0.28) * r;
    ctx.fillRect(bx - r * 0.025, by - r * 0.1, r * 0.05, r * 0.1);
  }
  ctx.restore();
};

// ── 雪山: snowy peak ─────────────────────────────────────────────────────────
export const drawXueshan: SpotFn = (ctx, cx, cy, r, col) => {
  ctx.save();
  // Main peak
  ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.5); ctx.lineTo(cx - r * 0.55, cy + r * 0.3);
  ctx.lineTo(cx + r * 0.55, cy + r * 0.3); ctx.closePath();
  ctx.fillStyle = col; ctx.globalAlpha = 0.5; ctx.fill();
  // Snow cap
  ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.5); ctx.lineTo(cx - r * 0.18, cy - r * 0.15);
  ctx.lineTo(cx + r * 0.18, cy - r * 0.15); ctx.closePath();
  ctx.globalAlpha = 0.9; ctx.fill();
  pine(ctx, cx - r * 0.38, cy + r * 0.12, r * 0.15, col);
  pine(ctx, cx + r * 0.42, cy + r * 0.1, r * 0.13, col);
  ctx.restore();
};

// ── 武夷山: tea terraces + stream ─────────────────────────────────────────────
export const drawWuyi: SpotFn = (ctx, cx, cy, r, col) => {
  ctx.save();
  // Terraced layers
  [-0.15, 0.05, 0.22, 0.37].forEach((dy, i) => {
    ctx.beginPath(); ctx.ellipse(cx, cy + dy * r, r * (0.55 - i * 0.05), r * 0.07, 0, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.globalAlpha = 0.2 + i * 0.1; ctx.fill();
    ctx.strokeStyle = col; ctx.globalAlpha = 0.4; ctx.lineWidth = 1.5; ctx.stroke();
  });
  // Stream
  ctx.globalAlpha = 0.55; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx + r * 0.22, cy - r * 0.12); ctx.lineTo(cx - r * 0.18, cy + r * 0.35);
  ctx.stroke();
  ctx.restore();
};

// ── 青海湖: wide plateau lake ─────────────────────────────────────────────────
export const drawQinghaihu: SpotFn = (ctx, cx, cy, r, col) => {
  ctx.save();
  // Lake
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.08, r * 0.68, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fillStyle = col; ctx.globalAlpha = 0.22; ctx.fill();
  ctx.strokeStyle = col; ctx.globalAlpha = 0.55; ctx.lineWidth = 2; ctx.stroke();
  // Far snow range
  [[-0.45, -0.25, 0.3], [-0.1, -0.38, 0.35], [0.35, -0.28, 0.28]].forEach(([dx, dy, ht]) => {
    ctx.beginPath(); ctx.moveTo(cx + dx * r, cy + r * 0.08);
    ctx.lineTo(cx + dx * r, cy + dy * r);
    ctx.lineTo(cx + (dx + ht * 0.4) * r, cy + r * 0.08); ctx.closePath();
    ctx.fillStyle = col; ctx.globalAlpha = 0.45; ctx.fill();
  });
  ctx.restore();
};

// ── Exported pairs (24 pairs from 12 spot functions) ─────────────────────────
export const SPOT_PAIRS: { left: SpotFn; right: SpotFn; leftName: string; rightName: string }[] = [
  // Original 6
  { left: drawHuangshan,   right: drawXihu,      leftName: '黄山',  rightName: '西湖'  },
  { left: drawTaishan,     right: drawJiuzhaigou,leftName: '泰山',  rightName: '九寨沟'},
  { left: drawZhangjiajie, right: drawGuilin,    leftName: '张家界',rightName: '桂林'  },
  { left: drawEmei,        right: drawSanxia,    leftName: '峨眉山',rightName: '三峡'  },
  { left: drawChangcheng,  right: drawXueshan,   leftName: '长城',  rightName: '雪山'  },
  { left: drawWuyi,        right: drawQinghaihu, leftName: '武夷山',rightName: '青海湖'},
  // Rotated 6
  { left: drawHuangshan,   right: drawTaishan,   leftName: '黄山',  rightName: '泰山'  },
  { left: drawXihu,        right: drawJiuzhaigou,leftName: '西湖',  rightName: '九寨沟'},
  { left: drawZhangjiajie, right: drawEmei,      leftName: '张家界',rightName: '峨眉山'},
  { left: drawGuilin,      right: drawSanxia,    leftName: '桂林',  rightName: '三峡'  },
  { left: drawChangcheng,  right: drawWuyi,      leftName: '长城',  rightName: '武夷山'},
  { left: drawXueshan,     right: drawQinghaihu, leftName: '雪山',  rightName: '青海湖'},
  // Cross 6
  { left: drawHuangshan,   right: drawZhangjiajie,leftName: '黄山', rightName: '张家界'},
  { left: drawXihu,        right: drawGuilin,    leftName: '西湖',  rightName: '桂林'  },
  { left: drawTaishan,     right: drawEmei,      leftName: '泰山',  rightName: '峨眉山'},
  { left: drawJiuzhaigou,  right: drawSanxia,    leftName: '九寨沟',rightName: '三峡'  },
  { left: drawChangcheng,  right: drawQinghaihu, leftName: '长城',  rightName: '青海湖'},
  { left: drawWuyi,        right: drawXueshan,   leftName: '武夷山',rightName: '雪山'  },
  // Diagonal 6
  { left: drawHuangshan,   right: drawEmei,      leftName: '黄山',  rightName: '峨眉山'},
  { left: drawXihu,        right: drawSanxia,    leftName: '西湖',  rightName: '三峡'  },
  { left: drawTaishan,     right: drawZhangjiajie,leftName: '泰山', rightName: '张家界'},
  { left: drawJiuzhaigou,  right: drawGuilin,    leftName: '九寨沟',rightName: '桂林'  },
  { left: drawChangcheng,  right: drawSanxia,    leftName: '长城',  rightName: '三峡'  },
  { left: drawWuyi,        right: drawTaishan,   leftName: '武夷山',rightName: '泰山'  },
];
