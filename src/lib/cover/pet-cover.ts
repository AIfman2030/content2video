/**
 * pet-cover.ts
 * Draws the AI-generated pet-character cover on the 1080×1920 canvas.
 *
 * Image loading: fetch→Blob URL (same-origin, no canvas taint, downloadable).
 * Border: uses the shared drawRainbowBorder from registry for style consistency.
 */

import type { PetCoverConfig } from '../../types/video';
import { COVER_W, COVER_H, drawRainbowBorder } from './registry';

const SUPABASE_URL = 'https://spb-t4ngxi6xsx650369.supabase.opentrust.net';

/**
 * Load an external image via the Supabase proxy, then convert to a same-origin
 * Blob URL. This approach:
 *  • bypasses browser CORS restrictions on canvas
 *  • prevents canvas taint → toDataURL / download works
 */
async function fetchImageAsBlobUrl(originalUrl: string): Promise<string | null> {
  try {
    const proxyUrl =
      `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(originalUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

async function loadImageFromUrl(url: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Draw title text in the upper portion of the cover */
function drawTitleText(
  ctx: CanvasRenderingContext2D,
  title: string,
  accent: string,
) {
  const cx = COVER_W / 2;
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = title.length <= 6 ? 130 : title.length <= 10 ? 104 : 88;

  // Drop shadow + glow
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 40;
  ctx.fillStyle   = '#ffffff';

  if (title.length <= 10) {
    ctx.font = `900 ${fontSize}px "Noto Sans SC", "PingFang SC", sans-serif`;
    ctx.fillText(title, cx, 290);
  } else {
    const mid   = Math.ceil(title.length / 2);
    const line1 = title.slice(0, mid);
    const line2 = title.slice(mid);
    const s     = (fontSize * 0.9) | 0;
    ctx.font = `900 ${s}px "Noto Sans SC", "PingFang SC", sans-serif`;
    ctx.fillText(line1, cx, 220);
    ctx.fillText(line2, cx, 360);
  }

  // Accent underline
  ctx.shadowBlur    = 0;
  ctx.strokeStyle   = accent;
  ctx.lineWidth     = 5;
  ctx.globalAlpha   = 0.85;
  const lineY = 460;
  ctx.beginPath();
  ctx.moveTo(cx - 200, lineY);
  ctx.lineTo(cx + 200, lineY);
  ctx.stroke();

  ctx.restore();
}

export async function drawPetCover(
  ctx: CanvasRenderingContext2D,
  opts: {
    title: string;
    accent: string;
    accent2: string;
    petConfig: PetCoverConfig;
  },
): Promise<void> {
  const { title, accent, petConfig } = opts;

  // ── 1. Background gradient ────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, COVER_H);
  bg.addColorStop(0,   '#08080f');
  bg.addColorStop(0.5, '#0d0d1a');
  bg.addColorStop(1,   '#0a0a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, COVER_W, COVER_H);

  // ── 2. Draw pet image ─────────────────────────────────────────────────────
  if (petConfig.imageUrl) {
    const blobUrl = await fetchImageAsBlobUrl(petConfig.imageUrl);
    if (blobUrl) {
      const img = await loadImageFromUrl(blobUrl);
      URL.revokeObjectURL(blobUrl); // free memory once loaded

      if (img && img.naturalWidth > 0) {
        const { position } = petConfig;
        let destY: number, destH: number;

        if (position === 'bottom') {
          destY = Math.round(COVER_H * 0.30);
          destH = COVER_H - destY;
        } else if (position === 'center') {
          destY = Math.round(COVER_H * 0.13);
          destH = Math.round(COVER_H * 0.74);
        } else {
          // full
          destY = 0;
          destH = COVER_H;
        }

        // Cover-fit: maintain aspect ratio, crop if needed
        const imgAspect  = img.naturalWidth / img.naturalHeight;
        const destAspect = COVER_W / destH;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

        if (imgAspect > destAspect) {
          sw = Math.round(img.naturalHeight * destAspect);
          sx = Math.round((img.naturalWidth - sw) / 2);
        } else {
          sh = Math.round(img.naturalWidth / destAspect);
          sy = 0;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, destY, COVER_W, destH);
      }
    }
  }

  // ── 3. Top gradient overlay (title readability) ───────────────────────────
  const overlayH = petConfig.position === 'full' ? 600 : 540;
  const topGrad  = ctx.createLinearGradient(0, 0, 0, overlayH);
  topGrad.addColorStop(0,    'rgba(5,5,12,0.97)');
  topGrad.addColorStop(0.55, 'rgba(5,5,12,0.72)');
  topGrad.addColorStop(1,    'rgba(5,5,12,0.0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, COVER_W, overlayH);

  // ── 4. Title text ─────────────────────────────────────────────────────────
  drawTitleText(ctx, title, accent);

  // ── 5. Rainbow neon border (same as all other cover styles) ──────────────
  drawRainbowBorder(ctx, COVER_W, COVER_H);
}
