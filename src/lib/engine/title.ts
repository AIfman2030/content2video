import type { GeneratedContent, StyleType } from '../../types/video';
import { CW, CH, clamp, lerp, easeOutCubic, hex2rgba, T } from './helpers';

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
  const visibleText = content.title.slice(0, visibleChars);

  const settleT = clamp((te - typeEnd - 200) / 600, 0, 1);
  const eased = easeOutCubic(settleT);
  const centerY = CH * 0.38;
  const headerY = 80;
  const titleY = lerp(centerY, headerY, eased);
  const fontSize = lerp(108, 72, eased);

  ctx.save();

  if (style === 'chinese') {
    if (te < 600) {
      const circleT = easeOutCubic(clamp(te / 400, 0, 1));
      ctx.beginPath();
      ctx.arc(CW / 2, centerY, 250 * circleT, 0, Math.PI * 2);
      ctx.fillStyle = hex2rgba(accent, 0.12 * circleT);
      ctx.fill();
      ctx.strokeStyle = hex2rgba(accent, 0.4 * circleT);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  } else if (style === 'city') {
    if (te < 800) {
      const beamY = lerp(-200, centerY, easeOutCubic(clamp(te / 600, 0, 1)));
      const bg2 = ctx.createRadialGradient(CW / 2, beamY, 0, CW / 2, beamY, 350);
      bg2.addColorStop(0, hex2rgba(accent, 0.2));
      bg2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg2;
      ctx.fillRect(0, 0, CW, CH);
    }
  } else {
    if (te < 300 && Math.sin(te * 0.08) > 0.3) {
      ctx.fillStyle = hex2rgba(accent, 0.08);
      ctx.fillRect(0, 0, CW, CH);
      for (let gi = 0; gi < 4; gi++) {
        const gy = centerY - 80 + gi * 40;
        ctx.fillStyle = hex2rgba(accent2, 0.15);
        ctx.fillRect(0, gy, CW, 8);
        ctx.fillStyle = hex2rgba(accent, 0.1);
        ctx.fillRect(Math.random() * 200, gy + 4, CW * 0.7, 4);
      }
    }
  }

  ctx.shadowColor = hex2rgba(accent, 0.9);
  ctx.shadowBlur = 40 + 20 * Math.sin(elapsed * 0.002);
  ctx.font = `900 ${fontSize.toFixed(0)}px "Noto Sans SC", "PingFang SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (style === 'aitech' && settleT < 0.5) {
    const cx = CW / 2 - ctx.measureText(visibleText).width / 2;
    for (let ci = 0; ci < visibleChars; ci++) {
      const char = content.title[ci];
      const glitch = ci === visibleChars - 1 ? (Math.random() - 0.5) * 8 : 0;
      ctx.fillStyle = ci % 3 === 0 ? accent2 : '#ffffff';
      ctx.fillText(char, cx + ctx.measureText(content.title.slice(0, ci)).width + glitch, titleY + glitch * 0.5);
    }
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillText(visibleText, CW / 2, titleY);
  }

  if (te < typeEnd + 500 && Math.floor(elapsed / 500) % 2 === 0) {
    ctx.shadowBlur = 0;
    ctx.font = `300 ${fontSize.toFixed(0)}px monospace`;
    const tw = ctx.measureText(visibleText).width;
    ctx.fillStyle = accent;
    ctx.fillText('|', CW / 2 + tw / 2 + 10, titleY);
  }

  ctx.shadowBlur = 0;

  if (eased > 0.3) {
    const lineAlpha = clamp((eased - 0.3) / 0.7, 0, 1);
    const lineY = titleY + fontSize * 0.6;
    const lineLen = 280 * lineAlpha;
    const lg = ctx.createLinearGradient(CW / 2 - lineLen, lineY, CW / 2 + lineLen, lineY);
    lg.addColorStop(0, 'rgba(0,0,0,0)');
    lg.addColorStop(0.3, hex2rgba(accent, lineAlpha));
    lg.addColorStop(0.7, hex2rgba(accent, lineAlpha));
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(CW / 2 - lineLen, lineY);
    ctx.lineTo(CW / 2 + lineLen, lineY);
    ctx.stroke();
    [-lineLen - 12, lineLen + 12].forEach(dx => {
      ctx.save();
      ctx.translate(CW / 2 + dx, lineY);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = hex2rgba(accent2, lineAlpha * 0.8);
      ctx.lineWidth = 2;
      ctx.strokeRect(-6, -6, 12, 12);
      ctx.restore();
    });
  }

  if (eased > 0.7) {
    const tagAlpha = clamp((eased - 0.7) / 0.3, 0, 1);
    const tagY = titleY - fontSize * 0.8;
    ctx.font = `400 30px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = hex2rgba(accent, tagAlpha * 0.7);
    ctx.fillText(
      style === 'chinese' ? '✦ 核心解析 ✦' : style === 'city' ? '▸ INSIGHT REPORT' : '> SYSTEM ANALYSIS',
      CW / 2, tagY,
    );
  }

  ctx.restore();
}
