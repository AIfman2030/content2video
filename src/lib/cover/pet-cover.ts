/**
 * pet-cover.ts
 * Draws the AI-generated pet-character cover on the 1080×1920 canvas.
 *
 * Layout:
 *  - Background: deep dark gradient
 *  - Pet image: positioned per `position` config (bottom = lower 65%)
 *  - Gradient overlay at top → ensures title text is always readable
 *  - Title + subtitle text drawn in the upper area
 *  - Rainbow neon border around the full canvas
 */

import type { PetCoverConfig } from '../../types/video';
import { COVER_W, COVER_H } from './registry';

const SUPABASE_URL = 'https://spb-t4ngxi6xsx650369.supabase.opentrust.net';

function proxyImageUrl(src: string): string {
  return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(src)}`;
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Draw a rainbow neon border identical to other cover styles */
function drawRainbowBorder(ctx: CanvasRenderingContext2D) {
  const BORDER = 18;
  const colors = ['#ff0040', '#ff6600', '#ffe500', '#00ff88', '#00cfff', '#7c3aed'];
  ctx.save();
  for (let i = 0; i < colors.length; i++) {
    const offset = i * (BORDER / colors.length);
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = BORDER / colors.length + 1;
    ctx.globalAlpha = 0.7;
    ctx.strokeRect(offset, offset, COVER_W - offset * 2, COVER_H - offset * 2);
  }
  ctx.restore();
}

/** Draw title text in the upper portion of the cover */
function drawTitleText(
  ctx: CanvasRenderingContext2D,
  title: string,
  accent: string,
) {
  const cx = COVER_W / 2;

  // Glow shadow
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Main title — large, bold, white with accent glow
  const fontSize = title.length <= 6 ? 130 : title.length <= 10 ? 104 : 88;
  ctx.font = `900 ${fontSize}px "Noto Sans SC", "PingFang SC", sans-serif`;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#ffffff';

  // Word-wrap at ~10 chars per line
  const MAX_CHARS = 10;
  if (title.length <= MAX_CHARS) {
    ctx.fillText(title, cx, 280);
  } else {
    // Split into two lines
    const mid = Math.ceil(title.length / 2);
    const line1 = title.slice(0, mid);
    const line2 = title.slice(mid);
    const halfSize = fontSize * 0.9;
    ctx.font = `900 ${halfSize.toFixed(0)}px "Noto Sans SC", "PingFang SC", sans-serif`;
    ctx.fillText(line1, cx, 220);
    ctx.fillText(line2, cx, 340);
  }

  // Decorative accent line below title
  ctx.shadowBlur = 0;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.8;
  const lineY = 430;
  ctx.beginPath();
  ctx.moveTo(cx - 180, lineY);
  ctx.lineTo(cx + 180, lineY);
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

  // ── 1. Background gradient ───────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, COVER_H);
  bg.addColorStop(0, '#08080f');
  bg.addColorStop(0.5, '#0d0d1a');
  bg.addColorStop(1, '#0a0a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, COVER_W, COVER_H);

  // ── 2. Draw pet image in configured position ─────────────────────────────
  if (petConfig.imageUrl) {
    const img = await loadImage(proxyImageUrl(petConfig.imageUrl));
    if (img && img.naturalWidth > 0) {
      const { position } = petConfig;
      let destY: number, destH: number;

      if (position === 'bottom') {
        destY = Math.round(COVER_H * 0.32);  // starts at ~32% from top
        destH = COVER_H - destY;
      } else if (position === 'center') {
        destY = Math.round(COVER_H * 0.15);
        destH = Math.round(COVER_H * 0.72);
      } else {
        // full
        destY = 0;
        destH = COVER_H;
      }

      // Maintain aspect ratio, cover the destination area
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const destAspect = COVER_W / destH;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

      if (imgAspect > destAspect) {
        // Image is wider — crop sides
        sw = Math.round(img.naturalHeight * destAspect);
        sx = Math.round((img.naturalWidth - sw) / 2);
      } else {
        // Image is taller — crop bottom
        sh = Math.round(img.naturalWidth / destAspect);
        sy = 0; // keep top
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, destY, COVER_W, destH);
    }
  }

  // ── 3. Top gradient overlay (ensures title text readability) ─────────────
  const titleAreaH = petConfig.position === 'full' ? 560 : 520;
  const topGrad = ctx.createLinearGradient(0, 0, 0, titleAreaH);
  topGrad.addColorStop(0, 'rgba(5, 5, 12, 0.96)');
  topGrad.addColorStop(0.55, 'rgba(5, 5, 12, 0.70)');
  topGrad.addColorStop(1, 'rgba(5, 5, 12, 0.0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, COVER_W, titleAreaH);

  // ── 4. Title text ────────────────────────────────────────────────────────
  drawTitleText(ctx, title, accent);

  // ── 5. Rainbow neon border ───────────────────────────────────────────────
  drawRainbowBorder(ctx);
}
