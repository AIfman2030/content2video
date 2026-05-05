export const CW = 1920;
export const CH = 1080;

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const easeInOutQuad = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

export function hex2rgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

export function hex2rgba(hex: string, a: number) {
  const [r, g, b] = hex2rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const char of text) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) { lines.push(line); line = char; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number, sides: number, rotation = 0,
) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + rotation;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
}

export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, outerR: number, innerR: number, points: number, rotation = 0,
) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (points * 2)) * Math.PI * 2 + rotation;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
}

export const T = {
  bgBloom: 0,
  themeEffect: 200,
  titleEntrance: 800,
  titleSettle: 2000,
  cardBase: 2800,
  cardSlot: 2200,
  cardReadDelay: 400,
  outroDur: 2000,
};

// ── Chinese card layout pagination ────────────────────────────────────────────
const _CH = CH, _CARD_H = 268, _ROW_GAP = 26, _START_Y = 160;
export const PAGE_ROWS  = Math.floor((_CH - _START_Y - 20) / (_CARD_H + _ROW_GAP)); // 3
export const PAGE_SIZE  = 2 * PAGE_ROWS;   // 6 cards per page (2 cols)
export const PAGE_HOLD  = 1200;             // ms hold after all cards on page appear
export const PAGE_TRANS = 350;              // ms for fade-out

export function totalDuration(pts: number) {
  const pageSlot = PAGE_SIZE * T.cardSlot;
  const numPages = Math.ceil(pts / PAGE_SIZE);
  return T.cardBase + numPages * (pageSlot + PAGE_HOLD) + T.cardReadDelay + T.outroDur;
}
