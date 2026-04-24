import type { StyleType } from '../../types/video';

export const COVER_W = 1080;
export const COVER_H = 1920;

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
