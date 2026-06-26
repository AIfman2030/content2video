// ─── Abstract geometric shapes for city-style cover ──────────────────────────
// All paths in 0–100 viewBox, stroke-only, colour injected at runtime.
export const CITY_ABSTRACT_SVGS: Record<string, (c: string, lw: number) => string> = {

  // 1 · Nested hexagons + radial spokes
  hex: (c, lw) => {
    const poly = (r: number) => [0,1,2,3,4,5].map(i => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    const spokes = [0,1,2,3,4,5].map(i => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      return `<line x1="50" y1="50" x2="${(50 + 38*Math.cos(a)).toFixed(1)}" y2="${(50 + 38*Math.sin(a)).toFixed(1)}" stroke="${c}" stroke-width="${lw * 0.45}"/>`;
    }).join('');
    return `<polygon points="${poly(38)}" stroke="${c}" fill="none" stroke-width="${lw}"/>
            <polygon points="${poly(24)}" stroke="${c}" fill="none" stroke-width="${lw}"/>
            <polygon points="${poly(11)}" stroke="${c}" fill="none" stroke-width="${lw * 0.7}"/>
            ${spokes}
            <circle cx="50" cy="50" r="3.5" stroke="${c}" fill="${c}"/>`;
  },

  // 2 · Diamond prism with facets
  prism: (c, lw) => `
    <polygon points="50,8 88,50 50,92 12,50" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <polygon points="50,22 74,50 50,78 26,50" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <line x1="50" y1="8"  x2="74" y2="50" stroke="${c}" stroke-width="${lw * 0.45}"/>
    <line x1="88" y1="50" x2="50" y2="78" stroke="${c}" stroke-width="${lw * 0.45}"/>
    <line x1="50" y1="92" x2="26" y2="50" stroke="${c}" stroke-width="${lw * 0.45}"/>
    <line x1="12" y1="50" x2="50" y2="22" stroke="${c}" stroke-width="${lw * 0.45}"/>
    <circle cx="50" cy="50" r="4" stroke="${c}" fill="${c}"/>`,

  // 3 · Six-pointed snowflake
  snowflake: (c, lw) => {
    const arms = [0,60,120,180,240,300].map(deg => {
      const r = deg * Math.PI / 180;
      const ex = 50 + 38*Math.cos(r), ey = 50 + 38*Math.sin(r);
      const mx = 50 + 22*Math.cos(r), my = 50 + 22*Math.sin(r);
      const p = Math.PI / 2;
      return `<line x1="50" y1="50" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${c}" stroke-width="${lw}"/>
              <line x1="${mx.toFixed(1)}" y1="${my.toFixed(1)}" x2="${(mx+10*Math.cos(r+p)).toFixed(1)}" y2="${(my+10*Math.sin(r+p)).toFixed(1)}" stroke="${c}" stroke-width="${lw * 0.7}"/>
              <line x1="${mx.toFixed(1)}" y1="${my.toFixed(1)}" x2="${(mx+10*Math.cos(r-p)).toFixed(1)}" y2="${(my+10*Math.sin(r-p)).toFixed(1)}" stroke="${c}" stroke-width="${lw * 0.7}"/>`;
    }).join('');
    return arms + `<circle cx="50" cy="50" r="4" stroke="${c}" fill="${c}"/>`;
  },

  // 4 · Atomic orbitals (3 ellipses at 60° each)
  atom: (c, lw) => `
    <ellipse cx="50" cy="50" rx="38" ry="14" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <g transform="rotate(60 50 50)"><ellipse cx="50" cy="50" rx="38" ry="14" stroke="${c}" fill="none" stroke-width="${lw}"/></g>
    <g transform="rotate(120 50 50)"><ellipse cx="50" cy="50" rx="38" ry="14" stroke="${c}" fill="none" stroke-width="${lw}"/></g>
    <circle cx="50" cy="50" r="6" stroke="${c}" fill="${c}"/>`,

  // 5 · Target rings with crosshair
  target: (c, lw) => `
    <circle cx="50" cy="50" r="38" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="50" r="26" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="50" r="14" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="50" r="4"  stroke="${c}" fill="${c}"/>
    <line x1="12" y1="50" x2="36" y2="50" stroke="${c}" stroke-width="${lw * 0.7}"/>
    <line x1="64" y1="50" x2="88" y2="50" stroke="${c}" stroke-width="${lw * 0.7}"/>
    <line x1="50" y1="12" x2="50" y2="36" stroke="${c}" stroke-width="${lw * 0.7}"/>
    <line x1="50" y1="64" x2="50" y2="88" stroke="${c}" stroke-width="${lw * 0.7}"/>`,

  // 6 · Crystal gem (outer + inner hex, connected)
  crystal: (c, lw) => {
    const poly = (r: number, off = 0) => [0,1,2,3,4,5].map(i => {
      const a = (i / 6) * Math.PI * 2 + off;
      return [`${(50 + r * Math.cos(a)).toFixed(1)}`, `${(50 + r * Math.sin(a)).toFixed(1)}`];
    });
    const outer = poly(38, 0), inner = poly(18, Math.PI / 6);
    const lines = outer.map(([ox, oy], i) => {
      const [ix, iy] = inner[i];
      return `<line x1="${ox}" y1="${oy}" x2="${ix}" y2="${iy}" stroke="${c}" stroke-width="${lw * 0.5}"/>`;
    }).join('');
    return `<polygon points="${outer.map(p => p.join(',')).join(' ')}" stroke="${c}" fill="none" stroke-width="${lw}"/>
            <polygon points="${inner.map(p => p.join(',')).join(' ')}" stroke="${c}" fill="none" stroke-width="${lw}"/>
            ${lines}`;
  },

  // 7 · Spiral (4 expanding arcs)
  spiral: (c, lw) => {
    const arcs = [1,2,3,4].map(i => {
      const r = 9 * i;
      const r2 = r + 7;
      return `<path d="M${50+r},50 A${r},${r} 0 0,1 ${50},${50-r} A${r},${r} 0 0,1 ${50-r},50 A${r},${r} 0 0,1 ${50+r2},50" stroke="${c}" fill="none" stroke-width="${lw}"/>`;
    }).join('');
    return arcs + `<circle cx="50" cy="50" r="4" stroke="${c}" fill="${c}"/>`;
  },

  // 8 · Network nodes (7 nodes connected)
  network: (c, lw) => {
    const nodes = [[50,50],[50,18],[80,35],[80,65],[50,82],[20,65],[20,35]];
    const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]];
    const edgeSvg = edges.map(([a, b]) =>
      `<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" stroke="${c}" stroke-width="${lw * 0.5}"/>`
    ).join('');
    const dotSvg = nodes.map(([x,y], i) =>
      `<circle cx="${x}" cy="${y}" r="${i === 0 ? 5 : 3}" stroke="${c}" fill="${c}"/>`
    ).join('');
    return edgeSvg + dotSvg;
  },

  // 9 · Star / compass rose (8-pointed)
  star8: (c, lw) => {
    const pts = [0,45,90,135,180,225,270,315].map(deg => {
      const r = deg * Math.PI / 180;
      const outer = [50 + 38*Math.cos(r), 50 + 38*Math.sin(r)];
      const mid   = [50 + 16*Math.cos(r + Math.PI/8), 50 + 16*Math.sin(r + Math.PI/8)];
      return [outer, mid];
    });
    const path = pts.map(([o, m]) => `${o[0].toFixed(1)},${o[1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)}`).join(' ');
    return `<polygon points="${path}" stroke="${c}" fill="none" stroke-width="${lw}"/>
            <circle cx="50" cy="50" r="10" stroke="${c}" fill="none" stroke-width="${lw}"/>
            <circle cx="50" cy="50" r="4"  stroke="${c}" fill="${c}"/>`;
  },

  // 10 · Vortex (3 curved arms)
  vortex: (c, lw) => {
    const arms = [0,1,2].map(i => {
      const a = (i / 3) * Math.PI * 2;
      const sx = 50 + 6*Math.cos(a), sy = 50 + 6*Math.sin(a);
      const ex = 50 + 38*Math.cos(a + 2.2), ey = 50 + 38*Math.sin(a + 2.2);
      const cx1 = 50 + 30*Math.cos(a + 0.6), cy1 = 50 + 30*Math.sin(a + 0.6);
      const cx2 = 50 + 38*Math.cos(a + 1.6), cy2 = 50 + 38*Math.sin(a + 1.6);
      return `<path d="M${sx.toFixed(1)},${sy.toFixed(1)} C${cx1.toFixed(1)},${cy1.toFixed(1)} ${cx2.toFixed(1)},${cy2.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" stroke="${c}" fill="none" stroke-width="${lw}"/>`;
    }).join('');
    return arms + `<circle cx="50" cy="50" r="5" stroke="${c}" fill="${c}"/>`;
  },

  // 11 · Double helix / DNA
  helix: (c, lw) => {
    const pts1: string[] = [], pts2: string[] = [], rungs: string[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const y = 8 + t * 84;
      const x1 = 50 + 26 * Math.cos(t * Math.PI * 3);
      const x2 = 50 - 26 * Math.cos(t * Math.PI * 3);
      pts1.push(`${x1.toFixed(1)},${y.toFixed(1)}`);
      pts2.push(`${x2.toFixed(1)},${y.toFixed(1)}`);
      if (i % 2 === 0)
        rungs.push(`<line x1="${x1.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${c}" stroke-width="${lw * 0.6}"/>`);
    }
    return `<polyline points="${pts1.join(' ')}" stroke="${c}" fill="none" stroke-width="${lw}"/>
            <polyline points="${pts2.join(' ')}" stroke="${c}" fill="none" stroke-width="${lw}"/>
            ${rungs.join('')}`;
  },

  // 12 · Pentagon fractal (outer + inner + pentagon star)
  pentagon: (c, lw) => {
    const pPts = (r: number) => [0,1,2,3,4].map(i => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    const starPts = [0,1,2,3,4].map(i => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const b = ((i + 2) / 5) * Math.PI * 2 - Math.PI / 2;
      return `${(50 + 38*Math.cos(a)).toFixed(1)},${(50 + 38*Math.sin(a)).toFixed(1)} ${(50 + 38*Math.cos(b)).toFixed(1)},${(50 + 38*Math.sin(b)).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pPts(38)}" stroke="${c}" fill="none" stroke-width="${lw}"/>
            <polygon points="${pPts(20)}" stroke="${c}" fill="none" stroke-width="${lw}"/>
            <polygon points="${starPts}"  stroke="${c}" fill="none" stroke-width="${lw * 0.7}"/>
            <circle cx="50" cy="50" r="4" stroke="${c}" fill="${c}"/>`;
  },
};

/** IDs of all abstract city cover shapes (in display order) */
export const CITY_ABSTRACT_IDS = Object.keys(CITY_ABSTRACT_SVGS);

const CITY_PROFILES: Record<string, number[]> = {
  beijing: [20,35,55,70,90,80,65,100,85,70,50,40,30],
  tianjin: [25,40,60,75,65,50,85,70,55,40,30,45,35],
  shijiazhuang: [30,45,55,65,50,70,55,45,35,50,40,30,25],
  shenyang: [25,40,65,80,70,55,90,75,60,45,35,50,30],
  changchun: [20,35,50,65,55,45,75,60,45,35,25,40,30],
  harbin: [30,50,70,85,75,60,55,80,65,50,40,35,25],
  shanghai: [20,30,40,55,80,100,90,75,60,45,35,50,70],
  nanjing: [25,40,60,80,70,55,85,70,55,40,30,45,35],
  hangzhou: [20,35,50,65,55,45,70,60,45,35,25,40,30],
  hefei: [25,40,55,70,60,50,75,62,48,38,28,42,32],
  fuzhou: [20,35,52,68,58,46,72,60,46,35,26,40,30],
  nanchang: [22,38,54,70,60,48,74,62,48,36,27,41,31],
  wuhan: [25,40,60,80,70,55,90,75,60,45,35,50,40],
  changsha: [22,38,55,72,62,50,78,65,50,38,28,42,32],
  guangzhou: [20,35,55,75,95,85,70,55,40,65,80,60,45],
  nanning: [20,35,50,65,55,45,70,58,44,34,25,38,28],
  haikou: [18,30,45,60,50,40,62,52,40,30,22,35,26],
  chengdu: [22,38,55,72,62,50,78,65,50,38,28,42,32],
  kunming: [20,35,50,65,55,45,68,56,43,33,24,38,28],
  lhasa: [30,50,70,90,80,65,75,85,70,55,45,35,25],
  xian: [30,50,70,85,75,60,90,80,65,50,40,55,35],
  lanzhou: [20,35,52,68,58,46,72,60,46,35,26,40,30],
  urumqi: [22,38,54,70,60,48,74,62,48,36,27,41,31],
  chongqing: [25,42,60,80,70,55,88,75,60,45,35,50,38],
};

export function cityToSvg(id: string, color: string, lineWidth = 1.5): string {
  // Abstract geometric shapes take priority
  const abstractFn = CITY_ABSTRACT_SVGS[id];
  if (abstractFn) return abstractFn(color, lineWidth);
  const profile = CITY_PROFILES[id] ?? CITY_PROFILES.shanghai;
  const numBuildings = profile.length;
  const bw = 100 / numBuildings;
  const buildings = profile.map((h, i) => {
    const x = i * bw + bw * 0.1;
    const w = bw * 0.8;
    const y = 95 - h * 0.75;
    const bh = h * 0.75;
    const winRows = Math.floor(bh / 8);
    const winCols = Math.max(1, Math.floor(w / 5));
    const wins = Array.from({ length: winRows }).flatMap((_, r) =>
      Array.from({ length: winCols }).map((_, c) => {
        const wx = x + c * (w / winCols) + 1;
        const wy = y + r * 8 + 2;
        return `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="2" height="3" fill="${color}" opacity="0.5"/>`;
      })
    );
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${bh.toFixed(1)}" stroke="${color}" fill="none" stroke-width="0.8"/>${wins.join('')}`;
  });
  return `<line x1="0" y1="95" x2="100" y2="95" stroke="${color}" stroke-width="1"/>${buildings.join('')}`;
}
