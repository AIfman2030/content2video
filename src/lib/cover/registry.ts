import type { StyleType } from '../../types/video';

export const COVER_W = 1080;
export const COVER_H = 1440;   // 3:4 ratio (was 1920 for 9:16)

// Icon anchor — scale relative to COVER_H (was 1280 @ 1920)
export const ICON_CX = COVER_W / 2;
export const ICON_CY = Math.round(COVER_H * 0.667);  // ~66.7% from top → 960
export const ICON_R  = 300;

export interface CoverOpts {
  title: string;
  subtitle?: string;
  items?: string[];
  commonItems?: string[];
  accent: string;
  accent2: string;
  coverIndex: number;
}

export type CoverDrawFn = (
  ctx: CanvasRenderingContext2D,
  opts: CoverOpts,
) => void | Promise<void>;

export const COVER_REGISTRY: Partial<Record<StyleType, CoverDrawFn>> = {};

export function registerCover(style: StyleType, fn: CoverDrawFn): void {
  COVER_REGISTRY[style] = fn;
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
export function hex2rgbaCover(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function seededRandCover(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Rainbow neon border — padH=horizontal margin, padV=vertical margin (auto-scales with H) */
export function drawRainbowBorder(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  padH = 26, padV?: number, bw = 14, cr = 60,
): void {
  const vpad = padV ?? Math.round(H * 0.104); // ~10.4% of H (200px at 1920, 150px at 1440)
  const g = ctx.createLinearGradient(padH, vpad, W - padH, H - vpad);
  g.addColorStop(0,    '#ff00cc');
  g.addColorStop(0.17, '#ff4400');
  g.addColorStop(0.34, '#ffcc00');
  g.addColorStop(0.5,  '#00ff88');
  g.addColorStop(0.67, '#00ccff');
  g.addColorStop(0.84, '#4400ff');
  g.addColorStop(1,    '#ff00cc');
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.55)'; ctx.shadowBlur = 22;
  ctx.strokeStyle = g; ctx.lineWidth = bw;
  drawRoundRect(ctx, padH, vpad, W - 2 * padH, H - 2 * vpad, cr); ctx.stroke();
  ctx.shadowBlur = 10; ctx.globalAlpha = 0.35; ctx.lineWidth = bw * 2.5;
  drawRoundRect(ctx, padH, vpad, W - 2 * padH, H - 2 * vpad, cr); ctx.stroke();
  ctx.shadowBlur = 0; ctx.restore();
}

/** Helper: create a 2-stop linear gradient stroke for neon icons */
export function neonGrad(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  c1: string, c2: string,
): CanvasGradient {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  return g;
}

