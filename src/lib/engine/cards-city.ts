// cards-city.ts – 十二生肖风格卡片
// • 每层使用不同图案（混合嵌套）
// • 新增有机图案：螺旋、花形、波浪环、星射线、交叉、弧线等
// • 用生肖图案图标替代文字标签

import type { GeneratedContent } from '../../types/video';
import { CW, CH, clamp, easeOutBack, wrapText, T, PAGE_HOLD, PAGE_TRANS } from './helpers';

// ─── Canvas units ────────────────────────────────────────────────────────────
const CX = CW / 2, CY = CH / 2;
const SQ_SIZE = 420;          // bounding square for the circle of shapes
const SQ_CX   = CX;
const SQ_CY   = CY - 20;
const CARD_W  = 340, CARD_H = 130;
const CARD_RADIUS = 370;      // orbit radius

// City shows up to 12 cards per page (all on one page for small sets)
const CITY_PAGE = 12;

export function cityTotalMs(n: number): number {
  const numPages = Math.ceil(n / CITY_PAGE);
  const pageSlot = CITY_PAGE * T.cardSlot;
  const pageTotal = pageSlot + PAGE_HOLD;
  return T.cardBase + numPages * pageTotal + T.outroDur;
}

// ─── Pattern functions ────────────────────────────────────────────────────────
// Each function draws a centred shape of radius r using ctx's current stroke/fill style.
type DrawFn = (ctx: CanvasRenderingContext2D, r: number, t: number, seed: number) => void;

/** Rotating square */
const pSquare: DrawFn = (ctx, r, t, seed) => {
  const rot = t * 0.3 + seed;
  ctx.save(); ctx.rotate(rot);
  ctx.strokeRect(-r, -r, r * 2, r * 2);
  ctx.restore();
};

/** Circle */
const pCircle: DrawFn = (ctx, r) => {
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
};

/** Polygon (n sides) */
function polygon(n: number, rot = 0): DrawFn {
  return (ctx, r, t, seed) => {
    const a0 = rot + t * 0.25 + seed * 0.5;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * Math.PI * 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else         ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.stroke();
  };
}

/** Star (n tips) */
function star(n: number): DrawFn {
  return (ctx, r, t, seed) => {
    const a0 = t * 0.2 + seed;
    ctx.beginPath();
    for (let i = 0; i <= n * 2; i++) {
      const a  = a0 + (i / (n * 2)) * Math.PI * 2;
      const rr = i % 2 === 0 ? r : r * 0.45;
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else         ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.stroke();
  };
}

/** Spiral (logarithmic-like) */
const pSpiral: DrawFn = (ctx, r, t, seed) => {
  const turns = 3;
  const steps = 100;
  const rot   = t * 0.4 + seed;
  ctx.save(); ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const a  = frac * turns * Math.PI * 2;
    const rr = frac * r;
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else         ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.stroke(); ctx.restore();
};

/** Flower (overlapping circles on orbit) */
const pFlower: DrawFn = (ctx, r, t, seed) => {
  const petals = 6;
  const pR  = r * 0.5;
  const rot = t * 0.35 + seed;
  for (let i = 0; i < petals; i++) {
    const a = rot + (i / petals) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * pR, Math.sin(a) * pR, pR, 0, Math.PI * 2);
    ctx.stroke();
  }
};

/** Wave ring — circle with sinusoidal radius variation */
const pWaveRing: DrawFn = (ctx, r, t, seed) => {
  const waves = 8, amp = r * 0.2;
  const steps = 180;
  const phase = t * 0.8 + seed;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a  = (i / steps) * Math.PI * 2;
    const rr = r + amp * Math.sin(waves * a + phase);
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else         ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.stroke();
};

/** Starburst — many alternating short/long rays */
const pStarburst: DrawFn = (ctx, r, t, seed) => {
  const rays = 20;
  const rot  = t * 0.15 + seed;
  ctx.beginPath();
  for (let i = 0; i <= rays; i++) {
    const a  = rot + (i / rays) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.6;
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else         ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.stroke();
};

/** Cross / plus — thick + shape */
const pCross: DrawFn = (ctx, r, t, seed) => {
  const rot = t * 0.2 + seed;
  ctx.save(); ctx.rotate(rot);
  const th = r * 0.28;
  ctx.strokeRect(-th, -r, th * 2, r * 2);
  ctx.strokeRect(-r, -th, r * 2, th * 2);
  ctx.restore();
};

/** Double ring — two concentric circles with dashes */
const pDoubleRing: DrawFn = (ctx, r, t, seed) => {
  ctx.save();
  ctx.setLineDash([r * 0.25, r * 0.15]);
  ctx.lineDashOffset = t * 40 + seed * 10;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
};

/** Arc trio — three arcs at 120° apart */
const pArcTrio: DrawFn = (ctx, r, t, seed) => {
  const rot = t * 0.5 + seed;
  for (let i = 0; i < 3; i++) {
    const a = rot + i * (Math.PI * 2 / 3);
    ctx.beginPath();
    ctx.arc(0, 0, r, a, a + Math.PI * 0.9);
    ctx.stroke();
  }
};

/** Diamond (rotated square) */
const pDiamond: DrawFn = (ctx, r, t, seed) => {
  ctx.save(); ctx.rotate(Math.PI / 4 + t * 0.22 + seed);
  ctx.strokeRect(-r * 0.75, -r * 0.75, r * 1.5, r * 1.5);
  ctx.restore();
};

/** Lissajous-ish figure */
const pLissajous: DrawFn = (ctx, r, t, seed) => {
  const steps = 150;
  const phase = t * 0.5 + seed;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const x = r * Math.sin(2 * angle + phase);
    const y = r * Math.sin(3 * angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
};

/** Nested hexagon + triangle combo */
const pHexTri: DrawFn = (ctx, r, t, seed) => {
  polygon(6)(ctx, r, t, seed);
  polygon(3, Math.PI)(ctx, r * 0.55, t, seed);
};

const PATTERNS: DrawFn[] = [
  pSquare, pCircle, polygon(6), polygon(3), star(5), pDiamond,
  pDoubleRing, pCross, polygon(8), polygon(5),
  pSpiral, pFlower, pWaveRing, pStarburst, pArcTrio, pLissajous, pHexTri,
];

/** For card i, return 4 different pattern indices (one per layer) */
function layerPatterns(cardIdx: number): [DrawFn, DrawFn, DrawFn, DrawFn] {
  const N  = PATTERNS.length;
  const b  = cardIdx * 4;
  // Use prime-like steps to ensure max variety across cards
  return [
    PATTERNS[b        % N],
    PATTERNS[(b + 3)  % N],
    PATTERNS[(b + 7)  % N],
    PATTERNS[(b + 11) % N],
  ];
}

// ─── Zodiac icon symbols ──────────────────────────────────────────────────────
// 12 distinct geometric icons, one per zodiac, drawn centred at (0,0).
function drawZodiacIcon(
  ctx: CanvasRenderingContext2D,
  idx: number,
  r: number,
  t: number,
) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3;
  ctx.beginPath();

  switch (idx % 12) {
    case 0: // 子鼠 — circle + 6 whiskers
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.stroke();
      for (let w = 0; w < 6; w++) {
        const a = (w / 6) * Math.PI * 2 + t * 0.05;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*r*0.5, Math.sin(a)*r*0.5);
        ctx.lineTo(Math.cos(a)*r*0.85, Math.sin(a)*r*0.85); ctx.stroke();
      }
      break;

    case 1: // 丑牛 — two curved horns
      ctx.arc(-r*0.42, -r*0.1, r*0.42, Math.PI*1.15, Math.PI*2.5); ctx.stroke();
      ctx.beginPath();
      ctx.arc( r*0.42, -r*0.1, r*0.42, Math.PI*0.5, Math.PI*1.85); ctx.stroke();
      break;

    case 2: // 寅虎 — nested triangles (outer + inner inverted)
      polygon(3)(ctx, r * 0.85, t, 0);
      polygon(3, Math.PI)(ctx, r * 0.42, t, 0);
      break;

    case 3: // 卯兔 — oval + two loop ears
      ctx.ellipse(0, r*0.1, r*0.45, r*0.55, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-r*0.32, -r*0.55, r*0.18, r*0.28, -0.3, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse( r*0.32, -r*0.55, r*0.18, r*0.28,  0.3, 0, Math.PI*2); ctx.stroke();
      break;

    case 4: // 辰龙 — spiral
      pSpiral(ctx, r * 0.85, t, 0);
      break;

    case 5: { // 巳蛇 — S-curve
      const pts = 60;
      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const u = (i / pts) * 2 - 1;
        const x = Math.sin(u * Math.PI) * r * 0.5;
        const y = u * r * 0.85;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke(); break;
    }

    case 6: // 午马 — upward arrow / chevron stack
      for (let ch = 0; ch < 3; ch++) {
        const yOff = ch * r * 0.3 - r * 0.3;
        ctx.beginPath();
        ctx.moveTo(-r*0.5, yOff + r*0.2);
        ctx.lineTo(0, yOff - r*0.1);
        ctx.lineTo(r*0.5, yOff + r*0.2);
        ctx.stroke();
      }
      break;

    case 7: // 未羊 — trident (Ψ)
      ctx.moveTo(0, r*0.8); ctx.lineTo(0, -r*0.2);
      ctx.moveTo(-r*0.5, r*0.8); ctx.lineTo(-r*0.5, r*0.1);
      ctx.moveTo( r*0.5, r*0.8); ctx.lineTo( r*0.5, r*0.1);
      // top arc
      ctx.moveTo(-r*0.5, r*0.1);
      ctx.quadraticCurveTo(-r*0.5, -r*0.5, 0, -r*0.7);
      ctx.quadraticCurveTo( r*0.5, -r*0.5, r*0.5, r*0.1);
      ctx.stroke(); break;

    case 8: // 申猴 — diamond + small hook tail
      ctx.moveTo(0, -r*0.8); ctx.lineTo(r*0.55, 0); ctx.lineTo(0, r*0.8); ctx.lineTo(-r*0.55, 0); ctx.closePath(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r*0.55, 0); ctx.quadraticCurveTo(r*0.9, -r*0.2, r*0.75, -r*0.6);
      ctx.stroke(); break;

    case 9: // 酉鸡 — pentagon + beak
      polygon(5)(ctx, r*0.75, t, 0);
      ctx.beginPath();
      ctx.moveTo(r*0.55, -r*0.1); ctx.lineTo(r*0.9, r*0.05); ctx.lineTo(r*0.55, r*0.2);
      ctx.stroke(); break;

    case 10: { // 戌狗 — 4 circles in cross arrangement
      const offsets = [[0,-r*0.45],[r*0.45,0],[0,r*0.45],[-r*0.45,0]];
      for (const [ox,oy] of offsets) {
        ctx.beginPath(); ctx.arc(ox, oy, r*0.28, 0, Math.PI*2); ctx.stroke();
      }
      break;
    }

    case 11: // 亥猪 — fat rounded oval + curly snout
      ctx.ellipse(0, 0, r*0.65, r*0.8, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r*0.65, -r*0.1);
      ctx.quadraticCurveTo(r*1.1, -r*0.1, r*1.05, r*0.3);
      ctx.quadraticCurveTo(r*0.95, r*0.55, r*0.7, r*0.45);
      ctx.stroke(); break;

    default: polygon(6)(ctx, r*0.7, t, idx); break;
  }
}

// ─── Pattern decoration (circle of shapes around centre) ─────────────────────
function drawPatternDecoration(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  accent: string,
  accent2: string,
  coverIndex: number,
) {
  const t = elapsed * 0.001;
  const cx = SQ_CX, cy = SQ_CY;
  const N_RINGS   = 4;
  const BASE_SIZE = SQ_SIZE / 2;

  const [p0, p1, p2, p3] = layerPatterns(coverIndex);
  const ring: [DrawFn, number, number, string][] = [
    [p0, BASE_SIZE * 0.95, 1.5, accent + '55'],
    [p1, BASE_SIZE * 0.72, 1.5, accent  + '90'],
    [p2, BASE_SIZE * 0.50, 2,   accent2 + 'bb'],
    [p3, BASE_SIZE * 0.28, 2,   accent2],
  ];

  ring.forEach(([fn, r, lw, col], ri) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = col;
    ctx.lineWidth   = lw;
    ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 0.7 + ri * 1.2);
    fn(ctx, r, t, ri * 2.3);
    ctx.restore();
  });

  // Centre zodiac icon
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = accent;
  ctx.fillStyle   = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 14;
  ctx.globalAlpha = 0.9 + 0.1 * Math.sin(t * 1.3);
  drawZodiacIcon(ctx, coverIndex, BASE_SIZE * 0.22, t);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── Card rows ────────────────────────────────────────────────────────────────
export function drawCityCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  _shapeImg: HTMLImageElement,
  coverIndex: number,
) {
  if (elapsed < T.cardBase) return;

  const n = content.points.length;
  const pageSlot  = CITY_PAGE * T.cardSlot;
  const pageTotal = pageSlot + PAGE_HOLD;
  const pageElapsed = elapsed - T.cardBase;
  const numPages = Math.ceil(n / CITY_PAGE);
  const curPage  = Math.min(Math.floor(pageElapsed / pageTotal), numPages - 1);
  const withinPage = pageElapsed - curPage * pageTotal;
  const outA = curPage < numPages - 1 ? clamp(1 - (withinPage - pageSlot) / PAGE_TRANS, 0, 1) : 1;

  const startCard = curPage * CITY_PAGE;
  const endCard   = Math.min(startCard + CITY_PAGE, n);

  // Compute orbit positions
  const displayN = endCard - startCard;
  const baseAngle = -Math.PI / 2;

  for (let i = startCard; i < endCard; i++) {
    const localI = i - startCard;
    const te     = withinPage - localI * T.cardSlot;
    if (te <= 0) continue;

    const enterT = clamp(te / 600, 0, 1);
    const eased  = easeOutBack(Math.min(enterT, 0.999));
    const alpha  = clamp(te / 350, 0, 1) * outA;

    const angle = baseAngle + (localI / displayN) * Math.PI * 2;
    const dcx = SQ_CX + Math.cos(angle) * CARD_RADIUS;
    const dcy = SQ_CY + Math.sin(angle) * CARD_RADIUS;

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const isLeft   = cosA < -0.35;
    const isRight  = cosA > 0.35;
    const scale    = 0.5 + 0.5 * eased;
    const CARD_W_S = CARD_W * scale;
    const CARD_H_S = CARD_H * scale;
    const lFsz     = Math.round(44 * scale);
    const sFsz     = Math.round(30 * scale);
    const dFsz     = Math.round(24 * scale);
    const dLineH   = Math.round(32 * scale);
    const cx0      = dcx - CARD_W_S / 2;

    ctx.save();
    ctx.globalAlpha = alpha;

    // ── Card background ─────────────────────────────────────────────────────
    const RADII = Math.round(14 * scale);
    ctx.beginPath();
    ctx.roundRect(cx0, dcy - CARD_H_S / 2, CARD_W_S, CARD_H_S, RADII);
    const cg = ctx.createLinearGradient(cx0, dcy - CARD_H_S/2, cx0 + CARD_W_S, dcy + CARD_H_S/2);
    cg.addColorStop(0, 'rgba(18,8,0,0.82)');
    cg.addColorStop(1, 'rgba(26,14,2,0.88)');
    ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = `${accent}88`; ctx.lineWidth = Math.round(1.5 * scale); ctx.stroke();

    // ── Card content ─────────────────────────────────────────────────────────
    const padL    = Math.round(22 * scale);
    const textX   = cx0 + padL;
    const point   = content.points[i];

    // Label
    ctx.font         = `700 ${lFsz}px "Noto Sans SC", sans-serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle    = accent;
    ctx.shadowColor  = accent; ctx.shadowBlur = 8;
    ctx.fillText(point.label || '', textX, dcy - CARD_H_S/2 + Math.round(16*scale));
    ctx.shadowBlur = 0;

    // Short
    ctx.font      = `500 ${sFsz}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = '#ffffffdd';
    ctx.fillText(point.short || '', textX, dcy - CARD_H_S/2 + Math.round(16*scale) + lFsz + Math.round(6*scale));

    // Desc with wrapping
    if (point.desc) {
      ctx.font = `400 ${dFsz}px "Noto Sans SC", sans-serif`;
      const descMaxW = CARD_W_S - padL * 2;
      const descLines = wrapText(ctx, point.desc, descMaxW).slice(0, 4);

      const posDesc = dcy - CARD_H_S/2 + Math.round(16*scale) + lFsz + Math.round(6*scale) + sFsz + Math.round(8*scale);

      const cosA_ = Math.cos(angle), sinA_ = Math.sin(angle);
      const isLeft_  = cosA_ < -0.35;
      const isRight_ = cosA_ > 0.35;
      const isBottom = !isLeft_ && !isRight_ && sinA_ > 0;
      const GAP      = Math.round(14 * scale);
      const blockH   = descLines.length * dFsz + (descLines.length - 1) * (dLineH - dFsz);

      descLines.forEach((line, li) => {
        const lw = ctx.measureText(line).width;

        if (isLeft_) {
          const rawY = dcy - blockH / 2 + li * dLineH + dFsz / 2;
          const lineY = Math.max(dFsz / 2 + 5, Math.min(rawY, CH - dFsz / 2 - 5));
          const textX_ = cx0 - GAP;
          ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          ctx.save(); ctx.globalAlpha = alpha * 0.72;
          ctx.fillStyle = 'rgba(0,4,18,0.68)';
          ctx.beginPath(); ctx.roundRect(textX_ - lw - 14, lineY - dFsz/2 - 5, lw + 28, dFsz + 10, 8);
          ctx.fill(); ctx.restore();
          ctx.fillStyle = `${accent}ee`;
          ctx.fillText(line, textX_, lineY);

        } else if (isRight_) {
          const rawY = dcy - blockH / 2 + li * dLineH + dFsz / 2;
          const lineY = Math.max(dFsz / 2 + 5, Math.min(rawY, CH - dFsz / 2 - 5));
          const textX_ = cx0 + CARD_W_S + GAP;
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.save(); ctx.globalAlpha = alpha * 0.72;
          ctx.fillStyle = 'rgba(0,4,18,0.68)';
          ctx.beginPath(); ctx.roundRect(textX_ - 14, lineY - dFsz/2 - 5, lw + 28, dFsz + 10, 8);
          ctx.fill(); ctx.restore();
          ctx.fillStyle = `${accent}ee`;
          ctx.fillText(line, textX_, lineY);

        } else if (isBottom) {
          const descEndY = dcy - CARD_H_S / 2 - GAP;
          const rawY = descEndY - (descLines.length - 1 - li) * dLineH - dFsz / 2;
          const lineY = Math.max(dFsz / 2 + 5, Math.min(rawY, CH - dFsz / 2 - 5));
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.save(); ctx.globalAlpha = alpha * 0.72;
          ctx.fillStyle = 'rgba(0,4,18,0.68)';
          ctx.beginPath(); ctx.roundRect(dcx - lw/2 - 14, lineY - dFsz/2 - 5, lw + 28, dFsz + 10, 8);
          ctx.fill(); ctx.restore();
          ctx.fillStyle = `${accent}ee`;
          ctx.fillText(line, dcx, lineY);

        } else {
          const rawY = posDesc + li * dLineH;
          const lineY = Math.max(dFsz / 2 + 5, Math.min(rawY, CH - dFsz / 2 - 5));
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.fillStyle = 'rgba(255,200,130,0.78)';
          ctx.fillText(line, textX, lineY);
        }
      });
    }

    ctx.restore();
  }

  // Page indicator
  if (numPages > 1) {
    const dotR = 8, dotGap = 24, dotY = CH - 28;
    const dotX0 = (CW - numPages * (dotR * 2 + dotGap) + dotGap) / 2;
    for (let p = 0; p < numPages; p++) {
      ctx.save();
      ctx.globalAlpha = p === curPage ? 0.9 : 0.3;
      ctx.fillStyle   = p === curPage ? accent : accent2;
      ctx.shadowColor = accent; ctx.shadowBlur = p === curPage ? 10 : 0;
      ctx.beginPath();
      ctx.arc(dotX0 + p * (dotR * 2 + dotGap) + dotR, dotY, dotR * (p === curPage ? 1 : 0.7), 0, Math.PI * 2);
      ctx.fill(); ctx.restore();
    }
  }
}
