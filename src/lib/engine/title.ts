import type { GeneratedContent, StyleType } from '../../types/video';
import { CW, CH, clamp, lerp, easeOutCubic, hex2rgba, T } from './helpers';

const LEFT_PAD = 72;   // aitech settled: left edge of title
const GREEN    = '#2dff8a';  // sun-wave green

export function drawTitle(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  style: StyleType,
) {
  if (elapsed < T.titleEntrance) return;
  const te = elapsed - T.titleEntrance;
  const CHAR_MS = 80;
  const typeEnd = content.title.length * CHAR_MS + 400;
  const visibleChars = Math.min(Math.floor(te / CHAR_MS), content.title.length);
  const visibleText  = content.title.slice(0, visibleChars);

  const settleT  = clamp((te - typeEnd - 200) / 600, 0, 1);
  const eased    = easeOutCubic(settleT);
  const centerY  = CH * 0.38;
  const headerY  = style === 'aitech' ? 65 : 78;
  const titleY   = lerp(centerY, headerY, eased);
  const fontSize = lerp(108, style === 'aitech' ? 58 : 72, eased);

  ctx.save();

  // ── Entrance background effects (non-aitech) ───────────────────────────────
  // Background entrance effects removed — background is plain black


  // ── Measure text (font must be set before measureText) ────────────────────
  ctx.font = `900 ${fontSize.toFixed(0)}px "Noto Sans SC", "PingFang SC", sans-serif`;
  const tw = ctx.measureText(visibleText).width;

  // ── X position: aitech → lerp left edge to LEFT_PAD; others → centered ────
  let titleX: number;
  if (style === 'aitech') {
    ctx.textAlign = 'left';
    titleX = lerp(CW / 2 - tw / 2, LEFT_PAD, eased);
  } else {
    ctx.textAlign = 'center';
    titleX = CW / 2;
  }
  const textCenterX = style === 'aitech' ? titleX + tw / 2 : CW / 2;

  // ── Green sun wave (aitech only, fires when title starts moving) ───────────
  if (style === 'aitech') {
    const WAVE_DUR = 1000;
    const waveT = clamp((te - (typeEnd + 200)) / WAVE_DUR, 0, 1);
    if (waveT > 0 && waveT < 1) {
      // Expanding rings
      for (let r = 0; r < 4; r++) {
        const rt = clamp(waveT - r * 0.18, 0, 1);
        if (rt <= 0) continue;
        const radius  = rt * 560;
        const ringAlpha = (1 - rt) * 0.62;
        ctx.save(); ctx.globalAlpha = ringAlpha;
        ctx.shadowColor = GREEN; ctx.shadowBlur = 28;
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = Math.max(0.5, (1 - rt) * 3.5);
        ctx.beginPath(); ctx.arc(textCenterX, titleY, radius, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0; ctx.restore();
      }
      // Sun rays
      const rayAlpha = Math.max(0, (1 - waveT * 1.3) * 0.55);
      if (rayAlpha > 0) {
        const numRays = 16;
        ctx.save(); ctx.globalAlpha = rayAlpha;
        ctx.strokeStyle = GREEN; ctx.lineWidth = 2;
        ctx.shadowColor = GREEN; ctx.shadowBlur = 14;
        for (let ray = 0; ray < numRays; ray++) {
          const a   = (ray / numRays) * Math.PI * 2;
          const r0  = waveT * 90;
          const r1  = Math.min(waveT * 360, 360);
          ctx.beginPath();
          ctx.moveTo(textCenterX + Math.cos(a) * r0, titleY + Math.sin(a) * r0);
          ctx.lineTo(textCenterX + Math.cos(a) * r1, titleY + Math.sin(a) * r1);
          ctx.stroke();
        }
        ctx.shadowBlur = 0; ctx.restore();
      }
    }
  }

  // ── Draw title text ────────────────────────────────────────────────────────
  ctx.shadowColor = hex2rgba(accent, 0.9);
  ctx.shadowBlur  = 40 + 20 * Math.sin(elapsed * 0.002);

  if (style === 'aitech' && settleT < 0.5) {
    // Glitch effect: draw char by char
    let charX = titleX;
    for (let ci = 0; ci < visibleChars; ci++) {
      const char   = content.title[ci];
      const glitch = ci === visibleChars - 1 ? (Math.random() - 0.5) * 8 : 0;
      ctx.fillStyle = ci % 3 === 0 ? accent2 : '#ffffff';
      ctx.fillText(char, charX + glitch, titleY + glitch * 0.5);
      charX += ctx.measureText(char).width;
    }
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillText(visibleText, titleX, titleY);
  }

  // Cursor
  if (te < typeEnd + 500 && Math.floor(elapsed / 500) % 2 === 0) {
    ctx.shadowBlur = 0;
    ctx.font = `300 ${fontSize.toFixed(0)}px monospace`;
    const cursorX = style === 'aitech'
      ? titleX + ctx.measureText(visibleText).width + 12
      : CW / 2 + tw / 2 + 12;
    ctx.fillStyle = accent;
    ctx.fillText('|', cursorX, titleY);
  }
  ctx.shadowBlur = 0;

  ctx.restore();
}
