import type { GeneratedContent, StyleType, ChineseOptions } from '../../types/video';
import { CW, CH, clamp, lerp, easeOutCubic, easeOutBack, hex2rgba, T } from './helpers';

const LEFT_PAD = 72;   // aitech settled: left edge of title
const GREEN    = '#2dff8a';  // sun-wave green

// ── dropsFromSky phase timing (relative to te = elapsed - T.titleEntrance) ──
const DROP_DUR   = 500;   // 0   → 500ms : title falls from above screen
const IMPACT_DUR = 400;   // 500 → 900ms : slams center, impact effects
const FLY_DUR    = 600;   // 900 → 1500ms: flies up to header

const IMPACT_FONT = 180;    // font size while at center
const SETTLED_FONT_CHINESE = 72;  // settled font size (header)

/** easeInQuart — slow start, accelerates sharply — gives the "launched upward" feel */
function easeInQuart(t: number): number { return t * t * t * t; }

export function drawTitle(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  style: StyleType,
  chineseOptions?: ChineseOptions,
) {
  if (elapsed < T.titleEntrance) return;
  const te = elapsed - T.titleEntrance;

  // ─── dropsFromSky branch (Chinese default) ───────────────────────────────
  const isDropsFromSky =
    style === 'chinese' &&
    (chineseOptions?.titleEntranceAnim ?? 'dropsFromSky') === 'dropsFromSky';

  if (isDropsFromSky) {
    const headerY = 78;
    const centerY = CH * 0.48;
    const startY  = -240;

    // Phase 1: Drop
    const dropProgress   = clamp(te / DROP_DUR, 0, 1);
    const dropY          = lerp(startY, centerY, easeOutBack(dropProgress));

    // Phase 2: Impact hold (500 → 900ms)
    const impactT        = clamp((te - DROP_DUR) / IMPACT_DUR, 0, 1);

    // Phase 3: Fly up (900 → 1500ms)
    const flyProgress    = clamp((te - DROP_DUR - IMPACT_DUR) / FLY_DUR, 0, 1);
    // Start slowly then launch fast (reversed easeInQuart for dramatic upward shot)
    const flyEased       = 1 - easeInQuart(1 - flyProgress);
    const flyY           = lerp(centerY, headerY, flyEased);

    const titleY = te < DROP_DUR
      ? dropY
      : te < DROP_DUR + IMPACT_DUR
        ? centerY
        : flyY;

    const fontSize = te < DROP_DUR + IMPACT_DUR
      ? IMPACT_FONT
      : lerp(IMPACT_FONT, SETTLED_FONT_CHINESE, flyEased);

    ctx.save();

    // ── Impact visual effects (during impact phase + brief afterglow) ──────
    if (te >= DROP_DUR && te < DROP_DUR + IMPACT_DUR + 200) {
      const ef = te >= DROP_DUR + IMPACT_DUR
        ? 1 - clamp((te - DROP_DUR - IMPACT_DUR) / 200, 0, 1) // afterglow fade
        : impactT;

      // Screen-wide flash (fades in fast, then out)
      const flashAlpha = Math.max(0, (1 - ef * 2.5)) * 0.45;
      if (flashAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = flashAlpha;
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, CW, CH);
        ctx.restore();
      }

      // 3 expanding shockwave rings from title center
      for (let ring = 0; ring < 3; ring++) {
        const ringDelay = ring * 0.15;
        const rt = clamp(ef - ringDelay, 0, 1);
        if (rt <= 0) continue;
        const ringAlpha = (1 - rt) * 0.75;
        const ringR = rt * 680;
        ctx.save();
        ctx.globalAlpha = ringAlpha;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 24;
        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(0.5, (1 - rt) * 5);
        ctx.beginPath();
        ctx.arc(CW / 2, centerY, ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Horizontal shockwave lines radiating left + right
      const lineAlpha = Math.max(0, (1 - ef * 1.8)) * 0.55;
      if (lineAlpha > 0) {
        const lineLen = ef * CW * 0.7;
        ctx.save();
        ctx.globalAlpha = lineAlpha;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 18;
        // upper + lower lines
        for (const dy of [-60, 60]) {
          ctx.beginPath();
          ctx.moveTo(CW / 2, centerY + dy);
          ctx.lineTo(CW / 2 - lineLen, centerY + dy);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(CW / 2, centerY + dy);
          ctx.lineTo(CW / 2 + lineLen, centerY + dy);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // ── Draw the title text ──────────────────────────────────────────────
    ctx.font = `900 ${fontSize.toFixed(0)}px "Noto Sans SC", "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';

    // Glow: strongest at impact, settles to subtle pulse
    const glowStrength = te < DROP_DUR + IMPACT_DUR
      ? lerp(20, 60, impactT)
      : 40 + 15 * Math.sin(elapsed * 0.002);
    ctx.shadowColor = hex2rgba(accent, 0.95);
    ctx.shadowBlur  = glowStrength;

    // Text scale shake during impact moment (first 150ms of impact phase)
    let drawY = titleY;
    if (te >= DROP_DUR && te < DROP_DUR + 150) {
      const shakeT = (te - DROP_DUR) / 150;
      drawY += Math.sin(shakeT * Math.PI * 6) * (1 - shakeT) * 12;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillText(content.title, CW / 2, drawY);

    ctx.shadowBlur = 0;
    ctx.restore();
    return;
  }

  // ─── Original typewriter branch (all other styles + chinese/typewriter) ──
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

  ctx.font = `900 ${fontSize.toFixed(0)}px "Noto Sans SC", "PingFang SC", sans-serif`;
  const tw = ctx.measureText(visibleText).width;

  let titleX: number;
  if (style === 'aitech') {
    ctx.textAlign = 'left';
    titleX = lerp(CW / 2 - tw / 2, LEFT_PAD, eased);
  } else {
    ctx.textAlign = 'center';
    titleX = CW / 2;
  }
  const textCenterX = style === 'aitech' ? titleX + tw / 2 : CW / 2;

  // Green sun wave (aitech only)
  if (style === 'aitech') {
    const WAVE_DUR = 1000;
    const waveT = clamp((te - (typeEnd + 200)) / WAVE_DUR, 0, 1);
    if (waveT > 0 && waveT < 1) {
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

  ctx.shadowColor = hex2rgba(accent, 0.9);
  ctx.shadowBlur  = 40 + 20 * Math.sin(elapsed * 0.002);

  if (style === 'aitech' && settleT < 0.5) {
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
