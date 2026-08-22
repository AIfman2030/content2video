import type { GeneratedContent, StyleType, TitleOptions, TitleLineConfig, CityOptions } from '../../types/video';
import { CW, CH, clamp, lerp, easeOutCubic, easeOutBack, hex2rgba } from './helpers';

// ── Timing (absolute ms from elapsed = 0) ─────────────────────────────────────
const T_L1_START  =    0;   // line 1 (withScene) fades in with black screen
const T_L2_START  =  700;   // line 2 dropsFromSky begins
const T_L2_LAND   = 1200;   // line 2 hits center → smoke burst
const T_SUB_IN    = 1350;   // subtitle fades in
const T_FLY_START = 1900;   // title begins flying to header
const T_FLY_END   = 2500;   // title settled at header

// Drop start Y (off-screen above)
const DROP_FROM_Y  = -280;

// Header settle Y
const HEADER_Y = 78;

// ── Smoke particles (deterministic, pre-generated) ────────────────────────────
interface SmokeP {
  x0: number; y0: number;
  vx: number; vy: number;
  size: number; baseAlpha: number;
}

function buildSmoke(): SmokeP[] {
  return Array.from({ length: 48 }, (_, i) => {
    const s = i * 2.3713;
    const sin  = (x: number) => Math.sin(x * 0.9999);   // cheap pseudo-random via sin
    const frac = (x: number) => ((x % 1) + 1) % 1;

    const rand1 = frac(sin(s * 127.1) * 43758.5);
    const rand2 = frac(sin(s * 311.7) * 43758.5);
    const rand3 = frac(sin(s * 74.3)  * 43758.5);
    const rand4 = frac(sin(s * 209.1) * 43758.5);
    const rand5 = frac(sin(s * 53.9)  * 43758.5);

    // Upper-semicircle angle: smoke rises upward
    const a = rand1 * Math.PI;
    const speed = 3 + rand2 * 10;
    return {
      x0: (rand3 - 0.5) * 500,
      y0: (rand4 - 0.3) * 60,   // slight vertical scatter at origin
      vx: Math.cos(a) * speed,
      vy: -Math.abs(Math.sin(a) * speed) * 1.6,
      size: 5 + rand5 * 22,
      baseAlpha: 0.3 + rand1 * 0.5,
    };
  });
}
const SMOKE: SmokeP[] = buildSmoke();

// ── Text / gradient fill ───────────────────────────────────────────────────────
function applyFill(
  ctx: CanvasRenderingContext2D,
  cfg: TitleLineConfig,
  cx: number, cy: number, halfW: number,
  forceSolid = false,
) {
  const baseColor = cfg.color || '#ffffff';
  if (!forceSolid && cfg.colorEnd && cfg.colorEnd !== baseColor) {
    const g = ctx.createLinearGradient(cx - halfW, cy, cx + halfW, cy);
    g.addColorStop(0, baseColor);
    g.addColorStop(1, cfg.colorEnd);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = baseColor;
  }
}

// ── Auto-split title into lines ───────────────────────────────────────────────
function resolveLineText(cfg: TitleLineConfig, i: number, title: string): string {
  if (cfg.text) return cfg.text;
  const mid = Math.ceil(title.length / 2);
  if (i === 0) return title.slice(0, mid);
  if (i === 1) return title.slice(mid);
  return title;  // fallback for 3rd line: full title
}

function fontStr(cfg: TitleLineConfig, fsz: number) {
  const ff = cfg.fontFamily ? `"${cfg.fontFamily}", sans-serif` : '"Noto Sans SC", "PingFang SC", sans-serif';
  return `${cfg.fontWeight} ${fsz.toFixed(0)}px ${ff}`;
}

// ── Enter-time for each line ──────────────────────────────────────────────────
function lineT0(cfg: TitleLineConfig, idx: number): number {
  switch (cfg.enterAnim) {
    case 'withScene':    return T_L1_START + idx * 250;
    case 'dropsFromSky': return T_L2_START;
    case 'slideUp':      return T_L1_START + 200 + idx * 300;
    case 'fadeIn':       return T_L1_START + idx * 350;
    case 'typewriter':   return T_L1_START + idx * 400;
    default:             return T_L1_START;
  }
}

// ── Smoke burst ───────────────────────────────────────────────────────────────
function drawSmoke(ctx: CanvasRenderingContext2D, cx: number, cy: number, smokeT: number) {
  if (smokeT <= 0 || smokeT >= 1) return;
  ctx.save();
  for (const p of SMOKE) {
    const t  = smokeT;
    const px = cx + p.x0 + p.vx * t * 140;
    const py = cy + p.y0 + p.vy * t * 140 + 280 * t * t;  // gravity pulls down
    const al = p.baseAlpha * (1 - t * t);
    if (al <= 0.01) continue;
    const r = p.size * (0.6 + t * 2.2);
    ctx.globalAlpha = al;
    ctx.shadowColor = 'rgba(255,255,255,0.7)';
    ctx.shadowBlur  = r * 0.6;
    ctx.fillStyle   = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur  = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Shockwave rings ───────────────────────────────────────────────────────────
function drawShockwaves(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  accent: string, impactT: number,
) {
  for (let ring = 0; ring < 3; ring++) {
    const rt = clamp(impactT - ring * 0.14, 0, 1);
    if (rt <= 0) continue;
    const al  = (1 - rt) * 0.7;
    const r   = rt * 700;
    ctx.save();
    ctx.globalAlpha = al;
    ctx.shadowColor = accent;
    ctx.shadowBlur  = 22;
    ctx.strokeStyle = accent;
    ctx.lineWidth   = Math.max(0.5, (1 - rt) * 5);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Horizontal shockwave lines
  const lineAl = Math.max(0, (1 - impactT * 1.6) * 0.55);
  if (lineAl > 0) {
    const len = impactT * CW * 0.72;
    ctx.save();
    ctx.globalAlpha = lineAl;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 3;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur  = 18;
    for (const dy of [-55, 55]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy); ctx.lineTo(cx - len, cy + dy); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy); ctx.lineTo(cx + len, cy + dy); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ── Screen flash ──────────────────────────────────────────────────────────────
function drawFlash(ctx: CanvasRenderingContext2D, accent: string, flashT: number) {
  const al = Math.max(0, (1 - flashT * 2.2)) * 0.4;
  if (al <= 0) return;
  ctx.save();
  ctx.globalAlpha = al;
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();
}

// ── Single line Y layout in settled state ─────────────────────────────────────
function settledLineY(lines: TitleLineConfig[], idx: number): number {
  // Total height of all lines stacked
  const totalH = lines.reduce((s, ln) => s + ln.fontSize + 16, 0) - 16;
  const top = CH * 0.48 - totalH / 2;
  let y = top;
  for (let i = 0; i < idx; i++) y += lines[i].fontSize + 16;
  y += lines[idx].fontSize / 2;
  return y;
}

// ── Subtitle dissolve ─────────────────────────────────────────────────────────
function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  opts: TitleOptions,
  lines: TitleLineConfig[],
) {
  if (!opts.subtitleText) return;

  const subAlphaIn = clamp((elapsed - T_SUB_IN) / 300, 0, 1);
  if (subAlphaIn <= 0) return;

  // Sub Y: below last line
  const lastLine = lines[lines.length - 1];
  const lastY    = settledLineY(lines, lines.length - 1) + lastLine.fontSize / 2 + 28;
  const subY     = lastY + opts.subtitleFontSize / 2;

  // Fly-out dissolve
  const flyT = clamp((elapsed - T_FLY_START) / 400, 0, 1);
  const subAlphaOut = 1 - flyT * flyT;
  const finalAlpha  = subAlphaIn * subAlphaOut;
  if (finalAlpha <= 0.01) return;

  // Shake during dissolve
  const shakeX = flyT > 0.1
    ? Math.sin(elapsed * 0.06 + 1.2) * flyT * 22
    : 0;

  ctx.save();
  ctx.globalAlpha = finalAlpha;
  ctx.font = `600 ${opts.subtitleFontSize}px "Noto Sans SC", sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = opts.subtitleColor || 'rgba(180,200,255,0.75)';
  ctx.shadowColor  = opts.subtitleColor || 'rgba(180,200,255,0.75)';
  ctx.shadowBlur   = 12;
  ctx.fillText(opts.subtitleText, CW / 2 + shakeX, subY);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Main export ───────────────────────────────────────────────────────────────
export function drawTitle(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  _accent2: string,
  _style: StyleType,
  titleOptions?: TitleOptions,
  cityOptions?: CityOptions,
  hideCityAccount = false,
) {
  const crispKnowledgeText = _style === 'city';
  // Use provided options or fall back to default 2-line split
  const opts = titleOptions ?? {
    lines: [
      { text: '', fontSize: 88,  fontFamily: '', fontWeight: 700 as const, color: '#ffffff', colorEnd: '',        enterAnim: 'withScene'    as const },
      { text: '', fontSize: 172, fontFamily: '', fontWeight: 900 as const, color: '#ffffff', colorEnd: '#3b9ef5', enterAnim: 'dropsFromSky' as const },
    ],
    subtitleText: '',
    subtitleColor: 'rgba(180,200,255,0.75)',
    subtitleFontSize: 40,
    headerFontSize: 60,
  };

  const lines  = opts.lines;
  const flyT   = clamp((elapsed - T_FLY_START) / (T_FLY_END - T_FLY_START), 0, 1);
  const flyEased = easeOutCubic(flyT);

  // ── Impact effects: screen flash + shockwaves ──────────────────────────────
  // Triggered when any dropsFromSky line lands
  for (let li = 0; li < lines.length; li++) {
    const cfg = lines[li];
    if (cfg.enterAnim !== 'dropsFromSky') continue;
    const land  = T_L2_LAND;
    const afterT = elapsed - land;
    if (afterT >= 0 && afterT < 800) {
      const ef = clamp(afterT / 600, 0, 1);
      drawFlash(ctx, accent, ef);
      const cx = CW / 2;
      const cy = settledLineY(lines, li);
      drawShockwaves(ctx, cx, cy, accent, ef);
    }
    // Smoke: T_L2_LAND → T_L2_LAND + 1000ms
    if (afterT >= 0) {
      const smokeT = clamp(afterT / 1000, 0, 1);
      drawSmoke(ctx, CW / 2, settledLineY(lines, li), smokeT);
    }
  }

  // ── Draw each line ─────────────────────────────────────────────────────────
  for (let li = 0; li < lines.length; li++) {
    const cfg  = lines[li];
    const text = resolveLineText(cfg, li, content.title);
    const t0   = lineT0(cfg, li);
    const te   = elapsed - t0;
    if (te < 0) continue;

    const settledY = settledLineY(lines, li);

    // Compute per-anim enter progress
    let alpha  = 1;
    let drawY  = settledY;
    let drawFsz = cfg.fontSize;
    let shakeY = 0;

    switch (cfg.enterAnim) {
      case 'withScene': {
        alpha = clamp(te / 500, 0, 1);
        const slideIn = easeOutCubic(clamp(te / 600, 0, 1));
        drawY = lerp(settledY + 50, settledY, slideIn);
        break;
      }
      case 'dropsFromSky': {
        const dropDur = 480;
        const prog = clamp(te / dropDur, 0, 1);
        drawY  = lerp(DROP_FROM_Y, settledY, easeOutBack(Math.min(prog, 0.999)));
        alpha  = clamp(te / 200, 0, 1);
        // Shake on landing
        if (te >= dropDur && te < dropDur + 160) {
          const st = (te - dropDur) / 160;
          shakeY = Math.sin(st * Math.PI * 5) * (1 - st) * 14;
        }
        // Glow pulse during impact hold
        if (te >= dropDur) {
          const holdT = clamp((te - dropDur) / 600, 0, 1);
          ctx.shadowColor = hex2rgba(accent, 0.9);
          ctx.shadowBlur  = lerp(60, 24, holdT);
        }
        break;
      }
      case 'slideUp': {
        const prog = clamp(te / 550, 0, 1);
        drawY = lerp(settledY + 90, settledY, easeOutCubic(prog));
        alpha = clamp(te / 300, 0, 1);
        break;
      }
      case 'fadeIn': {
        alpha = easeOutCubic(clamp(te / 600, 0, 1));
        break;
      }
      case 'typewriter': {
        const CHAR_MS = 70;
        const chars = Math.min(Math.floor(te / CHAR_MS), text.length);
        alpha = 1;

        // Draw only partial text now (override below)
        if (flyT >= 0.05) {
          // After fly starts, just show full text
        } else {
          // Typewriter: measure + draw partial manually
          ctx.save();
          ctx.globalAlpha = 1;
          const fsz = cfg.fontSize;
          ctx.font = fontStr(cfg, fsz);
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor  = hex2rgba(accent, 0.75);
          ctx.shadowBlur   = 32;
          if (crispKnowledgeText) {
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          }
          const partial = text.slice(0, chars);
          const hw = ctx.measureText(partial).width / 2;
          applyFill(ctx, cfg, CW / 2, drawY, hw, crispKnowledgeText);
          ctx.fillText(partial, CW / 2, drawY);
          // Blinking cursor
          if (chars < text.length && Math.floor(elapsed / 500) % 2 === 0) {
            ctx.fillStyle = accent;
            ctx.shadowBlur = 0;
            ctx.fillText('|', CW / 2 + hw + 10, drawY);
          }
          ctx.shadowBlur = 0;
          ctx.restore();
          // Skip default draw below
          continue;
        }
        break;
      }
    }

    // ── Fly-up: all lines merge to header ─────────────────────────────────
    if (flyT > 0) {
      // During fly, converge all lines to a single merged row at headerY
      // Font shrinks to headerFontSize
      const mergedParts = lines.map((ln, i) => resolveLineText(ln, i, content.title)).filter(Boolean);
      const merged = mergedParts.join(crispKnowledgeText && mergedParts.length > 1 ? '｜' : '');
      let targetFsz = opts.headerFontSize;
      if (crispKnowledgeText) {
        ctx.font = fontStr(cfg, targetFsz);
        while (targetFsz > 28 && ctx.measureText(merged).width > CW * 0.7) {
          targetFsz -= 2;
          ctx.font = fontStr(cfg, targetFsz);
        }
      }
      drawFsz = lerp(cfg.fontSize, targetFsz, flyEased);
      drawY   = lerp(settledY, HEADER_Y, flyEased);

      // After settle, only draw the first line (merged text), skip subsequent
      if (flyT >= 1 && li > 0) continue;
      if (flyT >= 1 && li === 0) {
        // Settled: draw merged text at header
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.font = fontStr(cfg, targetFsz);
        ctx.textAlign    = crispKnowledgeText ? 'left' : 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor  = hex2rgba(accent, 0.8);
        ctx.shadowBlur   = 24 + 10 * Math.sin(elapsed * 0.002);
        if (crispKnowledgeText && !hideCityAccount) {
          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        }
        const hw = ctx.measureText(merged).width / 2;
        const titleX = crispKnowledgeText ? 72 : CW / 2;
        applyFill(ctx, cfg, titleX, HEADER_Y, hw, crispKnowledgeText);
        ctx.fillText(merged, titleX, HEADER_Y);
        if (crispKnowledgeText) {
          ctx.font = `700 32px "Noto Sans SC", "PingFang SC", sans-serif`;
          ctx.textAlign = 'right';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(cityOptions?.accountName?.trim() || '思享稼', CW - 72, HEADER_Y);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
        break;
      }

      // During transition: each line individually moves to headerY + shrinks
      if (flyT > 0 && flyT < 1) {
        const lineFly = crispKnowledgeText
          ? clamp((flyT - li * 0.14) / Math.max(0.01, 1 - li * 0.14), 0, 1)
          : flyT;
        const lineFlyEased = easeOutCubic(lineFly);
        const partText = lineFly > 0.68
          ? (li === 0 ? merged : '')  // collapse all text into line 0 midway
          : text;
        if (!partText) continue;

        ctx.save();
        ctx.globalAlpha = li === 0 ? 1 : clamp(1 - lineFlyEased * 1.35, 0, 1);
        ctx.font = fontStr(cfg, drawFsz);
        ctx.textAlign    = crispKnowledgeText ? 'left' : 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor  = hex2rgba(accent, 0.75);
        ctx.shadowBlur   = 28;
        if (crispKnowledgeText) {
          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        }
        const hw = ctx.measureText(partText).width / 2;
        const startX = CW / 2 - (crispKnowledgeText ? hw : 0);
        const drawX = crispKnowledgeText ? lerp(startX, 72, lineFlyEased) : CW / 2;
        const lineY = crispKnowledgeText ? lerp(settledY, HEADER_Y, lineFlyEased) : drawY;
        applyFill(ctx, cfg, drawX, lineY, hw, crispKnowledgeText);
        ctx.fillText(partText, drawX, lineY + shakeY);
        ctx.shadowBlur = 0;
        ctx.restore();
        continue;
      }
    }

    // ── Normal (pre-fly) draw ──────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha  = alpha * (1 - flyT);  // fade out as fly begins
    ctx.font         = fontStr(cfg, drawFsz);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Border box (drawn BEFORE text so text appears on top)
    if (cfg.borderEnabled && flyT < 0.8) {
      const textW   = ctx.measureText(text).width;
      const padX    = cfg.borderPadX ?? 48;
      const padY    = cfg.borderPadY ?? 22;
      const boxW    = textW + padX * 2;
      const boxH    = drawFsz + padY * 2;
      const bx      = CW / 2 - boxW / 2;
      const by      = drawY + shakeY - drawFsz / 2 - padY;
      const br      = cfg.borderRadius ?? 20;
      const bc      = cfg.borderColor || accent;

      // Solid fill behind text
      const bgA = cfg.borderBgAlpha ?? 0.75;
      if (bgA > 0.01) {
        ctx.fillStyle = hex2rgba(bc, bgA);
        ctx.beginPath();
        ctx.roundRect(bx, by, boxW, boxH, br);
        ctx.fill();
      }

      // Glowing border stroke
      ctx.save();
      ctx.shadowColor = bc;
      ctx.shadowBlur  = 28 + 10 * Math.sin(elapsed * 0.004);
      ctx.strokeStyle = bc;
      ctx.lineWidth   = 4;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, br);
      ctx.stroke();
      ctx.shadowBlur  = 0;
      ctx.restore();
    }

    ctx.shadowColor  = hex2rgba(accent, 0.8);
    ctx.shadowBlur   = cfg.enterAnim === 'dropsFromSky'
      ? lerp(60, 32, clamp((elapsed - T_L2_LAND) / 600, 0, 1))
      : 32 + 12 * Math.sin(elapsed * 0.002);
    if (crispKnowledgeText) {
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }
    const hw = ctx.measureText(text).width / 2;
    applyFill(ctx, cfg, CW / 2, drawY, hw, crispKnowledgeText);
    ctx.fillText(text, CW / 2, drawY + shakeY);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Subtitle ───────────────────────────────────────────────────────────────
  drawSubtitle(ctx, elapsed, opts, lines);
}
