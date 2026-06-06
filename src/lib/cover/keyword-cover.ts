/**
 * keyword-cover.ts  v3
 * 1080×1440 (3:4) — matches all other cover styles.
 * 35 pure-canvas geometric icon patterns, NO text.
 * Reference style: dark bg + radiating spikes + golden glow icon.
 */

import {
  COVER_W, COVER_H, ICON_CX, ICON_CY, ICON_R, CoverOpts,
  hex2rgbaCover, drawRainbowBorder, registerCover,
} from './registry';

const W = COVER_W, H = COVER_H;
const CX = ICON_CX, CY = ICON_CY;

type DC = CanvasRenderingContext2D;
type PatFn = (ctx: DC, cx: number, cy: number, r: number, ac: string) => void;

/** moveTo on first point, lineTo thereafter */
function mv(ctx: DC, i: number, x: number, y: number): void {
  if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
}

// ─── 35 icon pattern renderers ────────────────────────────────────────────────
// Each draws the icon at (cx, cy) with radius r using accent color ac.
// ctx.shadowColor and ctx.globalAlpha may already be set; restore when needed.

const PATTERNS: PatFn[] = [

  // 1. Hexagon + 6 orbit nodes (mind-map)
  (ctx, cx, cy, r, ac) => {
    const hr = r * 0.38;
    ctx.strokeStyle = ac; ctx.lineWidth = 5; ctx.shadowBlur = 25;
    ctx.fillStyle = hex2rgbaCover(ac, 0.12);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      mv(ctx, i, cx + Math.cos(a) * hr, cy + Math.sin(a) * hr);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ac; ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const nx = cx + Math.cos(a) * r * 0.72, ny = cy + Math.sin(a) * r * 0.72;
      ctx.setLineDash([4, 8]); ctx.lineWidth = 1.5; ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (hr + 4), cy + Math.sin(a) * (hr + 4));
      ctx.lineTo(nx, ny); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 0.85; ctx.fillStyle = ac;
      ctx.beginPath(); ctx.arc(nx, ny, 13, 0, Math.PI * 2); ctx.fill();
    }
  },

  // 2. 3×3 knowledge grid
  (ctx, cx, cy, r, ac) => {
    const sp = r * 0.46;
    for (let row = -1; row <= 1; row++) for (let col = -1; col <= 1; col++) {
      const x = cx + col * sp, y = cy + row * sp;
      const isC = row === 0 && col === 0;
      ctx.globalAlpha = isC ? 1 : 0.65;
      ctx.fillStyle = ac; ctx.shadowBlur = isC ? 35 : 14;
      ctx.beginPath(); ctx.arc(x, y, isC ? 24 : 15, 0, Math.PI * 2); ctx.fill();
      if (col < 1) {
        ctx.globalAlpha = 0.3; ctx.strokeStyle = ac; ctx.lineWidth = 2; ctx.setLineDash([4, 8]);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx + (col + 1) * sp, y); ctx.stroke();
        ctx.setLineDash([]);
      }
      if (row < 1) {
        ctx.globalAlpha = 0.3; ctx.strokeStyle = ac; ctx.lineWidth = 2; ctx.setLineDash([4, 8]);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, cy + (row + 1) * sp); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  },

  // 3. Double diamond
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.shadowBlur = 28;
    [[r * 0.44, 1], [r * 0.7, 0.55]].forEach(([s, a]) => {
      ctx.globalAlpha = a as number; ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - (s as number)); ctx.lineTo(cx + (s as number), cy);
      ctx.lineTo(cx, cy + (s as number)); ctx.lineTo(cx - (s as number), cy);
      ctx.closePath(); ctx.stroke();
    });
    ctx.globalAlpha = 0.14; ctx.fillStyle = ac;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.44); ctx.lineTo(cx + r * 0.44, cy);
    ctx.lineTo(cx, cy + r * 0.44); ctx.lineTo(cx - r * 0.44, cy);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
  },

  // 4. 3-axis atom model
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.lineWidth = 3; ctx.shadowBlur = 20;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      ctx.globalAlpha = 0.65;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.72, r * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
  },

  // 5. 12-pointed starburst
  (ctx, cx, cy, r, ac) => {
    ctx.fillStyle = ac; ctx.shadowBlur = 30;
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
      const rd = i % 2 === 0 ? r * 0.55 : r * 0.27;
      mv(ctx, i, cx + Math.cos(a) * rd, cy + Math.sin(a) * rd);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.2; ctx.fill();
    ctx.globalAlpha = 0.85; ctx.strokeStyle = ac; ctx.lineWidth = 3; ctx.stroke();
    ctx.globalAlpha = 0.18; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.27, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.11, 0, Math.PI * 2); ctx.fill();
  },

  // 6. Concentric hexagons
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.shadowBlur = 20;
    [0.24, 0.47, 0.7].forEach((s, i) => {
      ctx.globalAlpha = 1 - i * 0.25; ctx.lineWidth = 4 - i;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2 - Math.PI / 6;
        mv(ctx, j, cx + Math.cos(a) * r * s, cy + Math.sin(a) * r * s);
      }
      ctx.closePath(); ctx.stroke();
    });
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
  },

  // 7. Pentagon star (pentagram)
  (ctx, cx, cy, r, ac) => {
    ctx.shadowBlur = 28;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rd = i % 2 === 0 ? r * 0.6 : r * 0.25;
      mv(ctx, i, cx + Math.cos(a) * rd, cy + Math.sin(a) * rd);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.22; ctx.fillStyle = ac; ctx.fill();
    ctx.globalAlpha = 0.9; ctx.strokeStyle = ac; ctx.lineWidth = 4; ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
  },

  // 8. Cross with circles at ends
  (ctx, cx, cy, r, ac) => {
    const arms: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    ctx.strokeStyle = ac; ctx.lineWidth = 8; ctx.shadowBlur = 25; ctx.globalAlpha = 0.85;
    arms.forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx * r * 0.68, cy + dy * r * 0.68); ctx.stroke();
    });
    arms.forEach(([dx, dy]) => {
      ctx.fillStyle = ac; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(cx + dx * r * 0.68, cy + dy * r * 0.68, 22, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();
  },

  // 9. Flower of life (7 circles)
  (ctx, cx, cy, r, ac) => {
    const cr = r * 0.34;
    ctx.strokeStyle = ac; ctx.lineWidth = 2.5; ctx.shadowBlur = 15;
    const centers: [number, number][] = [[0, 0], ...Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return [Math.cos(a) * cr, Math.sin(a) * cr] as [number, number];
    })];
    centers.forEach(([x, y], i) => {
      ctx.globalAlpha = i === 0 ? 0.9 : 0.55;
      ctx.beginPath(); ctx.arc(cx + x, cy + y, cr, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
  },

  // 10. Radial sector chart
  (ctx, cx, cy, r, ac) => {
    const heights = [0.45, 0.7, 0.55, 0.85, 0.6, 0.75, 0.5, 0.9];
    for (let i = 0; i < 8; i++) {
      const a1 = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((i + 0.78) / 8) * Math.PI * 2 - Math.PI / 2;
      ctx.fillStyle = ac; ctx.shadowBlur = 18;
      ctx.globalAlpha = 0.28 + heights[i] * 0.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r * heights[i], a1, a2); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
  },

  // 11. Infinity figure-8
  (ctx, cx, cy, r, ac) => {
    const a = r * 0.47;
    ctx.strokeStyle = ac; ctx.lineWidth = 7; ctx.shadowBlur = 28; ctx.globalAlpha = 0.88;
    ctx.beginPath(); ctx.arc(cx - a, cy, a, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + a, cy, a, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = ac;
    [-a, 0, a].forEach(x => {
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(cx + x, cy, x === 0 ? 18 : 12, 0, Math.PI * 2); ctx.fill();
    });
  },

  // 12. Spiral arms (galaxy 3-arm)
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.lineWidth = 3; ctx.shadowBlur = 18;
    for (let arm = 0; arm < 3; arm++) {
      const offset = (arm / 3) * Math.PI * 2;
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const t = i / 60, angle = t * Math.PI * 2.5 + offset;
        const dist = t * r * 0.78;
        mv(ctx, i, cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
  },

  // 13. Triangle fractal (3 sub-triangles)
  (ctx, cx, cy, r, ac) => {
    const tri = (x: number, y: number, s: number, alpha: number) => {
      ctx.globalAlpha = alpha; ctx.strokeStyle = ac; ctx.lineWidth = 3; ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.866, y + s * 0.5);
      ctx.lineTo(x - s * 0.866, y + s * 0.5); ctx.closePath(); ctx.stroke();
    };
    tri(cx, cy, r * 0.7, 0.9);
    tri(cx, cy - r * 0.23, r * 0.35, 0.7);
    tri(cx + r * 0.3, cy + r * 0.17, r * 0.35, 0.6);
    tri(cx - r * 0.3, cy + r * 0.17, r * 0.35, 0.6);
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
  },

  // 14. Circuit board fragment
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.lineWidth = 3; ctx.shadowBlur = 14;
    const segs: [number, number][][] = [
      [[cx, cy], [cx + r * 0.35, cy], [cx + r * 0.35, cy - r * 0.35], [cx + r * 0.58, cy - r * 0.35]],
      [[cx, cy], [cx, cy + r * 0.42], [cx - r * 0.3, cy + r * 0.42], [cx - r * 0.3, cy + r * 0.6]],
      [[cx, cy], [cx - r * 0.44, cy], [cx - r * 0.44, cy - r * 0.22], [cx - r * 0.62, cy - r * 0.22]],
      [[cx, cy], [cx + r * 0.22, cy + r * 0.44], [cx + r * 0.22, cy + r * 0.62]],
    ];
    segs.forEach(pts => {
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(([x, y]) => ctx.lineTo(x, y)); ctx.stroke();
      const [ex, ey] = pts[pts.length - 1];
      ctx.fillStyle = ac; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(ex, ey, 11, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fill();
  },

  // 15. Concentric squares (nested, rotated)
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.shadowBlur = 18;
    [0.7, 0.5, 0.3].forEach((s, i) => {
      ctx.globalAlpha = 0.85 - i * 0.2; ctx.lineWidth = 4 - i;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate((Math.PI / 4) * i * 0.5);
      const hs = r * s;
      ctx.beginPath(); ctx.rect(-hs, -hs, hs * 2, hs * 2); ctx.stroke();
      ctx.restore();
    });
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
  },

  // 16. Gear / cog (12 teeth)
  (ctx, cx, cy, r, ac) => {
    const teeth = 12, iR = r * 0.42, oR = r * 0.6, th = r * 0.1;
    ctx.fillStyle = ac; ctx.shadowBlur = 22; ctx.globalAlpha = 0.82;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a1 = (i / teeth) * Math.PI * 2, a2 = ((i + 0.38) / teeth) * Math.PI * 2;
      const a3 = ((i + 0.62) / teeth) * Math.PI * 2, a4 = ((i + 1) / teeth) * Math.PI * 2;
      if (i === 0) ctx.moveTo(cx + Math.cos(a1) * iR, cy + Math.sin(a1) * iR);
      ctx.lineTo(cx + Math.cos(a1) * (iR + th), cy + Math.sin(a1) * (iR + th));
      ctx.lineTo(cx + Math.cos(a2) * oR, cy + Math.sin(a2) * oR);
      ctx.lineTo(cx + Math.cos(a3) * oR, cy + Math.sin(a3) * oR);
      ctx.lineTo(cx + Math.cos(a4) * (iR + th), cy + Math.sin(a4) * (iR + th));
      ctx.lineTo(cx + Math.cos(a4) * iR, cy + Math.sin(a4) * iR);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#000'; ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.1, 0, Math.PI * 2); ctx.fill();
  },

  // 17. Eye of insight
  (ctx, cx, cy, r, ac) => {
    const ew = r * 0.72, eh = r * 0.34;
    ctx.strokeStyle = ac; ctx.lineWidth = 4; ctx.shadowBlur = 24; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.ellipse(cx, cy, ew, eh, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.18; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.ellipse(cx, cy, ew, eh, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.14, 0, Math.PI * 2); ctx.fill();
    for (let i = -2; i <= 2; i++) {
      const x = cx + i * ew / 3;
      const y1 = cy - Math.sqrt(Math.max(0, eh * eh * (1 - ((x - cx) / ew) ** 2)));
      ctx.strokeStyle = ac; ctx.lineWidth = 2; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y1 - r * 0.12); ctx.stroke();
    }
  },

  // 18. Shield / crest
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.lineWidth = 5; ctx.shadowBlur = 24; ctx.globalAlpha = 0.9;
    const tw = r * 0.6, th = r * 0.72;
    ctx.beginPath();
    ctx.moveTo(cx - tw, cy - th * 0.5);
    ctx.lineTo(cx - tw, cy + th * 0.14);
    ctx.quadraticCurveTo(cx - tw, cy + th, cx, cy + th);
    ctx.quadraticCurveTo(cx + tw, cy + th, cx + tw, cy + th * 0.14);
    ctx.lineTo(cx + tw, cy - th * 0.5);
    ctx.quadraticCurveTo(cx + tw, cy - th * 0.82, cx, cy - th * 0.82);
    ctx.quadraticCurveTo(cx - tw, cy - th * 0.82, cx - tw, cy - th * 0.5);
    ctx.closePath();
    ctx.globalAlpha = 0.12; ctx.fillStyle = ac; ctx.fill();
    ctx.globalAlpha = 0.88; ctx.stroke();
    ctx.lineWidth = 3; ctx.globalAlpha = 0.65;
    ctx.beginPath(); ctx.moveTo(cx, cy - th * 0.55); ctx.lineTo(cx, cy + th * 0.68); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - tw * 0.58, cy); ctx.lineTo(cx + tw * 0.58, cy); ctx.stroke();
    ctx.fillStyle = ac; ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  },

  // 19. Mandala (12-fold symmetry)
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      ctx.globalAlpha = 0.6; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(0, r * 0.15); ctx.lineTo(0, r * 0.68); ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(0, r * 0.46, r * 0.1, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 0.4; ctx.lineWidth = 1.5;
    [0.25, 0.48, 0.7].forEach(s => {
      ctx.beginPath(); ctx.arc(cx, cy, r * s, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
  },

  // 20. DNA double helix (vertical cross-section)
  (ctx, cx, cy, r, ac) => {
    const N = 8;
    ctx.strokeStyle = ac; ctx.lineWidth = 2.5; ctx.shadowBlur = 18;
    for (let i = 0; i <= N; i++) {
      const t = i / N, y = cy - r * 0.72 + t * r * 1.44;
      const x1 = cx + Math.sin(t * Math.PI * 3) * r * 0.36;
      const x2 = cx - Math.sin(t * Math.PI * 3) * r * 0.36;
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      ctx.globalAlpha = 0.9; ctx.fillStyle = ac;
      ctx.beginPath(); ctx.arc(x1, y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x2, y, 9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 0.6; ctx.lineWidth = 2.5;
    for (const sign of [1, -1]) {
      ctx.beginPath();
      for (let i = 0; i <= 48; i++) {
        const t = i / 48, y = cy - r * 0.72 + t * r * 1.44;
        const x = cx + sign * Math.sin(t * Math.PI * 3) * r * 0.36;
        mv(ctx, i, x, y);
      }
      ctx.stroke();
    }
  },

  // 21. Network graph (8 nodes)
  (ctx, cx, cy, r, ac) => {
    const nodes: [number, number][] = [
      [cx, cy], [cx + r * 0.5, cy - r * 0.28], [cx + r * 0.58, cy + r * 0.3],
      [cx, cy + r * 0.6], [cx - r * 0.5, cy + r * 0.32], [cx - r * 0.52, cy - r * 0.22],
      [cx + r * 0.15, cy - r * 0.62], [cx - r * 0.2, cy - r * 0.62],
    ];
    const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,5],[1,6]];
    ctx.strokeStyle = ac; ctx.lineWidth = 1.5; ctx.shadowBlur = 8;
    edges.forEach(([a, b]) => {
      ctx.globalAlpha = 0.35; ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(nodes[a][0], nodes[a][1]); ctx.lineTo(nodes[b][0], nodes[b][1]); ctx.stroke();
    });
    ctx.setLineDash([]);
    nodes.forEach(([x, y], i) => {
      ctx.globalAlpha = i === 0 ? 1 : 0.78; ctx.fillStyle = ac; ctx.shadowBlur = i === 0 ? 28 : 14;
      ctx.beginPath(); ctx.arc(x, y, i === 0 ? 22 : 13, 0, Math.PI * 2); ctx.fill();
    });
  },

  // 22. Target rings + crosshair
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.shadowBlur = 18;
    [0.7, 0.47, 0.25].forEach((s, i) => {
      ctx.globalAlpha = 0.88 - i * 0.22; ctx.lineWidth = 3 - i * 0.5;
      ctx.beginPath(); ctx.arc(cx, cy, r * s, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.lineWidth = 2; ctx.globalAlpha = 0.52;
    ([[0,-1],[0,1],[1,0],[-1,0]] as [number,number][]).forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(cx + dx * r * 0.3, cy + dy * r * 0.3);
      ctx.lineTo(cx + dx * r * 0.82, cy + dy * r * 0.82); ctx.stroke();
    });
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  },

  // 23. Compass rose (8 points)
  (ctx, cx, cy, r, ac) => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const isPrimary = i % 2 === 0;
      const len = isPrimary ? r * 0.7 : r * 0.48;
      const wid = isPrimary ? r * 0.12 : r * 0.07;
      ctx.globalAlpha = isPrimary ? 0.9 : 0.55;
      ctx.fillStyle = ac; ctx.shadowBlur = 22;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -len); ctx.lineTo(-wid, 0); ctx.lineTo(0, wid * 0.5); ctx.lineTo(wid, 0);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ac; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2); ctx.stroke();
  },

  // 24. Wave interference pattern
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.lineWidth = 2.5; ctx.shadowBlur = 14;
    for (let row = -3; row <= 3; row++) {
      ctx.globalAlpha = 0.5 - Math.abs(row) * 0.05;
      ctx.beginPath();
      for (let i = -80; i <= 80; i++) {
        const x = cx + (i / 80) * r * 0.88;
        const d1 = Math.sqrt(i * i + (row * 38) ** 2) / 30;
        const d2 = Math.sqrt((i - 52) ** 2 + (row * 38) ** 2) / 30;
        const y = cy + row * 38 + Math.sin(d1) * 14 + Math.sin(d2) * 10;
        if (i === -80) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
  },

  // 25. Seed of life (7 circles)
  (ctx, cx, cy, r, ac) => {
    const cr = r * 0.36;
    ctx.strokeStyle = ac; ctx.lineWidth = 2.5; ctx.shadowBlur = 14; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * cr, cy + Math.sin(a) * cr, cr, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill();
  },

  // 26. Chain ring cluster
  (ctx, cx, cy, r, ac) => {
    const ring: [number, number][] = [
      [cx - r * 0.48, cy - r * 0.26], [cx, cy], [cx + r * 0.48, cy - r * 0.26],
      [cx - r * 0.24, cy + r * 0.44], [cx + r * 0.24, cy + r * 0.44],
    ];
    ctx.strokeStyle = ac; ctx.shadowBlur = 18;
    ring.forEach(([x, y], i) => {
      ctx.globalAlpha = 0.72; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(x, y, r * 0.22, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.9; ctx.fillStyle = ac;
      ctx.beginPath(); ctx.arc(x, y, r * 0.07, 0, Math.PI * 2); ctx.fill();
      if (i > 0) {
        const [px, py] = ring[i - 1];
        ctx.strokeStyle = ac; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.28;
        ctx.setLineDash([4, 8]);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  },

  // 27. Branching tree (knowledge tree)
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac;
    const branch = (x: number, y: number, len: number, angle: number, depth: number) => {
      if (depth === 0) return;
      const ex = x + Math.cos(angle) * len, ey = y + Math.sin(angle) * len;
      ctx.globalAlpha = depth * 0.2 + 0.12; ctx.lineWidth = depth * 1.5; ctx.shadowBlur = depth * 5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
      if (depth === 1) { ctx.fillStyle = ac; ctx.beginPath(); ctx.arc(ex, ey, 7, 0, Math.PI * 2); ctx.fill(); }
      branch(ex, ey, len * 0.64, angle - 0.48, depth - 1);
      branch(ex, ey, len * 0.64, angle + 0.48, depth - 1);
    };
    branch(cx, cy + r * 0.54, r * 0.44, -Math.PI / 2, 4);
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.54, 15, 0, Math.PI * 2); ctx.fill();
  },

  // 28. Venn diagram (3 overlapping circles)
  (ctx, cx, cy, r, ac) => {
    const cr = r * 0.46, off = r * 0.27;
    const centers: [number, number][] = [[0, -off], [off * 0.866, off * 0.5], [-off * 0.866, off * 0.5]];
    ctx.strokeStyle = ac; ctx.lineWidth = 3; ctx.shadowBlur = 18;
    centers.forEach(([dx, dy]) => {
      ctx.globalAlpha = 0.17; ctx.fillStyle = ac;
      ctx.beginPath(); ctx.arc(cx + dx, cy + dy, cr, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.72; ctx.stroke();
    });
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  },

  // 29. Layered diamond pyramid
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.shadowBlur = 18;
    const layers = [r * 0.7, r * 0.5, r * 0.3, r * 0.14];
    const offsets = [0, r * 0.12, r * 0.24, r * 0.34];
    layers.forEach((s, i) => {
      ctx.globalAlpha = 0.88 - i * 0.14; ctx.lineWidth = 4 - i * 0.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy - s + offsets[i]);
      ctx.lineTo(cx + s, cy + offsets[i]);
      ctx.lineTo(cx, cy + s + offsets[i]);
      ctx.lineTo(cx - s, cy + offsets[i]);
      ctx.closePath();
      ctx.globalAlpha = 0.06; ctx.fillStyle = ac; ctx.fill();
      ctx.globalAlpha = 0.78 - i * 0.14; ctx.stroke();
    });
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
  },

  // 30. 16-pointed burst star
  (ctx, cx, cy, r, ac) => {
    const N = 16;
    ctx.shadowBlur = 32;
    ctx.beginPath();
    for (let i = 0; i < N * 2; i++) {
      const a = (i / (N * 2)) * Math.PI * 2 - Math.PI / 2;
      const rd = i % 2 === 0 ? r * 0.64 : r * 0.36;
      mv(ctx, i, cx + Math.cos(a) * rd, cy + Math.sin(a) * rd);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.2; ctx.fillStyle = ac; ctx.fill();
    ctx.globalAlpha = 0.82; ctx.strokeStyle = ac; ctx.lineWidth = 3; ctx.stroke();
    ctx.globalAlpha = 0.24; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.13, 0, Math.PI * 2); ctx.fill();
  },

  // 31. Octagon with inner radial lines
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.lineWidth = 5; ctx.shadowBlur = 22; ctx.globalAlpha = 0.88;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
      mv(ctx, i, cx + Math.cos(a) * r * 0.63, cy + Math.sin(a) * r * 0.63);
    }
    ctx.closePath(); ctx.stroke();
    ctx.globalAlpha = 0.12; ctx.fillStyle = ac; ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
      ctx.globalAlpha = 0.38; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r * 0.53, cy + Math.sin(a) * r * 0.53); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
  },

  // 32. Honeycomb (7 hexagons)
  (ctx, cx, cy, r, ac) => {
    const cr = r * 0.27;
    const centers: [number, number][] = [[cx, cy]];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      centers.push([cx + Math.cos(a) * cr * 1.73, cy + Math.sin(a) * cr * 1.73]);
    }
    ctx.strokeStyle = ac; ctx.lineWidth = 2.5; ctx.shadowBlur = 14;
    centers.forEach(([hx, hy], i) => {
      ctx.globalAlpha = i === 0 ? 0.9 : 0.52;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2 - Math.PI / 6;
        mv(ctx, j, hx + Math.cos(a) * cr, hy + Math.sin(a) * cr);
      }
      ctx.closePath(); ctx.stroke();
      if (i === 0) { ctx.globalAlpha = 0.18; ctx.fillStyle = ac; ctx.fill(); }
    });
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  },

  // 33. Arrow burst (8 outward arrows)
  (ctx, cx, cy, r, ac) => {
    const arrow = (angle: number, len: number) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
      ctx.strokeStyle = ac; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.stroke();
      ctx.fillStyle = ac;
      ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(-len * 0.2, -len * 0.64); ctx.lineTo(len * 0.2, -len * 0.64); ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    [0, Math.PI / 2, Math.PI, -Math.PI / 2, Math.PI / 4, -Math.PI / 4, Math.PI * 3 / 4, -Math.PI * 3 / 4]
      .forEach((a, i) => { ctx.globalAlpha = i < 4 ? 0.9 : 0.5; ctx.shadowBlur = 18; arrow(a, i < 4 ? r * 0.62 : r * 0.4); });
    ctx.globalAlpha = 1; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
  },

  // 34. Metatron lite (inner 6 + outer 6 circles)
  (ctx, cx, cy, r, ac) => {
    const cr = r * 0.25;
    ctx.strokeStyle = ac; ctx.lineWidth = 1.5; ctx.shadowBlur = 10; ctx.globalAlpha = 0.65;
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * cr, cy + Math.sin(a) * cr, cr, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 0.32;
    const c2r = cr * 1.73;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * c2r, cy + Math.sin(a) * c2r, cr, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = ac; ctx.shadowBlur = 28;
    ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill();
  },

  // 35. Radar sweep (half arcs)
  (ctx, cx, cy, r, ac) => {
    ctx.strokeStyle = ac; ctx.shadowBlur = 18;
    [0.22, 0.42, 0.6, 0.76].forEach((s, i) => {
      ctx.globalAlpha = 0.88 - i * 0.16; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, r * s, -Math.PI / 2, Math.PI, false); ctx.stroke();
      ctx.globalAlpha = 0.12; ctx.beginPath(); ctx.arc(cx, cy, r * s, Math.PI, -Math.PI / 2, false); ctx.stroke();
    });
    ctx.lineWidth = 3; ctx.globalAlpha = 0.82;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r * 0.76, cy); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
      ctx.globalAlpha = 0.48; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 0.73, cy + Math.sin(a) * r * 0.73);
      ctx.lineTo(cx + Math.cos(a) * r * 0.84, cy + Math.sin(a) * r * 0.84);
      ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = ac;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
  },
];

// ─── Main cover draw function ─────────────────────────────────────────────────

async function drawKeywordCover(ctx: DC, opts: CoverOpts): Promise<void> {
  const { accent, coverIndex = 0 } = opts;
  const ac = accent || '#00d4ff';

  // 1. Dark background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const bgGlow = ctx.createRadialGradient(CX, CY, 0, CX, CY, W * 0.88);
  bgGlow.addColorStop(0, hex2rgbaCover(ac, 0.09));
  bgGlow.addColorStop(0.5, hex2rgbaCover(ac, 0.03));
  bgGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, W, H);

  // 2. Rainbow border (consistent with all other styles)
  drawRainbowBorder(ctx, W, H);

  // 3. Radiating spikes (reference image style: 24 long/short alternating rays)
  ctx.save();
  ctx.shadowColor = ac;
  const innerR = ICON_R * 0.56;
  const outerR = ICON_R * 1.48;
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const isPrimary = i % 2 === 0;
    ctx.globalAlpha = isPrimary ? 0.7 : 0.32;
    ctx.strokeStyle = ac;
    ctx.lineWidth = isPrimary ? 2.8 : 1.4;
    ctx.shadowBlur = isPrimary ? 16 : 8;
    ctx.beginPath();
    ctx.moveTo(CX + Math.cos(angle) * innerR, CY + Math.sin(angle) * innerR);
    ctx.lineTo(CX + Math.cos(angle) * (isPrimary ? outerR : outerR * 0.76), CY + Math.sin(angle) * (isPrimary ? outerR : outerR * 0.76));
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  // 4. Decorative rings
  ctx.save();
  ctx.shadowColor = ac;
  // Outer dashed ring
  ctx.strokeStyle = hex2rgbaCover(ac, 0.42); ctx.lineWidth = 1.8;
  ctx.setLineDash([8, 14]); ctx.shadowBlur = 10; ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.arc(CX, CY, ICON_R * 1.2, 0, Math.PI * 2); ctx.stroke();
  // Inner solid ring
  ctx.setLineDash([]);
  ctx.strokeStyle = hex2rgbaCover(ac, 0.58); ctx.lineWidth = 2.8; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(CX, CY, ICON_R * 0.54, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // 5. Strong center glow (matching reference image golden halo)
  const glowGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, ICON_R * 0.72);
  glowGrad.addColorStop(0, hex2rgbaCover(ac, 0.52));
  glowGrad.addColorStop(0.38, hex2rgbaCover(ac, 0.18));
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(CX - ICON_R, CY - ICON_R, ICON_R * 2, ICON_R * 2);

  // 6. Icon pattern (35 total, selected by coverIndex)
  ctx.save();
  ctx.shadowColor = ac;
  ctx.globalAlpha = 1;
  const patIdx = ((coverIndex % PATTERNS.length) + PATTERNS.length) % PATTERNS.length;
  PATTERNS[patIdx](ctx, CX, CY, ICON_R, ac);
  ctx.restore();
}

registerCover('keyword', drawKeywordCover);
