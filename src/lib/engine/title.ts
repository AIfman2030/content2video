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
  if (style === 'chinese' && te < 600) {
    const circleT = easeOutCubic(clamp(te / 400, 0, 1));
    ctx.beginPath();
    ctx.arc(CW / 2, centerY, 250 * circleT, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, 0.12 * circleT); ctx.fill();
    ctx.strokeStyle = hex2rgba(accent, 0.4 * circleT); ctx.lineWidth = 3; ctx.stroke();
  } else if (style === 'city' && te < 800) {
    const beamY = lerp(-200, centerY, easeOutCubic(clamp(te / 600, 0, 1)));
    const bg2 = ctx.createRadialGradient(CW / 2, beamY, 0, CW / 2, beamY, 350);
    bg2.addColorStop(0, hex2rgba(accent, 0.2)); bg2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg2; ctx.fillRect(0, 0, CW, CH);
  } else if (style !== 'aitech' && te < 300 && Math.sin(te * 0.08) > 0.3) {
    ctx.fillStyle = hex2rgba(accent, 0.08); ctx.fillRect(0, 0, CW, CH);
    for (let gi = 0; gi < 4; gi++) {
      const gy = centerY - 80 + gi * 40;
      ctx.fillStyle = hex2rgba(accent2, 0.15); ctx.fillRect(0, gy, CW, 8);
      ctx.fillStyle = hex2rgba(accent, 0.1); ctx.fillRect(Math.random() * 200, gy + 4, CW * 0.7, 4);
    }
  }

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

  // ── Decorators (only for non-aitech styles) ────────────────────────────────
  if (style !== 'aitech' && eased > 0.3) {
    const lineAlpha = clamp((eased - 0.3) / 0.7, 0, 1);
    const lineY = titleY + fontSize * 0.6;
    const lineLen = 280 * lineAlpha;
    const lg = ctx.createLinearGradient(CW / 2 - lineLen, lineY, CW / 2 + lineLen, lineY);
    lg.addColorStop(0, 'rgba(0,0,0,0)');
    lg.addColorStop(0.3, hex2rgba(accent, lineAlpha));
    lg.addColorStop(0.7, hex2rgba(accent, lineAlpha));
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = lg; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(CW / 2 - lineLen, lineY); ctx.lineTo(CW / 2 + lineLen, lineY); ctx.stroke();
    [-lineLen - 12, lineLen + 12].forEach(dx => {
      ctx.save(); ctx.translate(CW / 2 + dx, lineY); ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = hex2rgba(accent2, lineAlpha * 0.8); ctx.lineWidth = 2;
      ctx.strokeRect(-6, -6, 12, 12); ctx.restore();
    });
  }

  // ── Tag line ───────────────────────────────────────────────────────────────
  if (eased > 0.7) {
    const tagAlpha = clamp((eased - 0.7) / 0.3, 0, 1);
    if (style === 'aitech') {
      // Tag below title, left-aligned in corner
      const tagY = titleY + fontSize * 0.72;
      ctx.font = `600 24px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = hex2rgba(accent2, tagAlpha * 0.90);
      ctx.fillText('> SYSTEM ANALYSIS', LEFT_PAD, tagY);
    } else {
      const tagY = titleY - fontSize * 0.8;
      ctx.font = `600 30px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = hex2rgba(accent, tagAlpha * 0.88);
      ctx.fillText(
        style === 'chinese' ? '✦ 核心解析 ✦' : style === 'city' ? '▸ INSIGHT REPORT' : '▸ NATURE INSIGHT',
        CW / 2, tagY,
      );
    }
  }

  ctx.restore();
}
