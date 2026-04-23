// Returns SVG string (viewBox 0 0 100 100) for a given shape
// All shapes use white stroke, no fill (Chinese-style outline)

// ─── Chinese Shapes ────────────────────────────────────────────────────────────
const CHINESE_SVGS: Record<string, (color: string, lw: number) => string> = {
  mountain: (c, lw) => `
    <path d="M10,88 L35,42 L50,18 L65,42 L90,88" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linejoin="round"/>
    <path d="M15,75 L32,52 L48,65" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linejoin="round"/>
    <path d="M52,65 L68,52 L85,75" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linejoin="round"/>
    <path d="M12,68 Q30,63 50,66 Q70,63 88,68" stroke="${c}" fill="none" stroke-width="${lw * 0.7}"/>
    <path d="M18,74 Q40,69 50,72 Q60,69 82,74" stroke="${c}" fill="none" stroke-width="${lw * 0.7}"/>`,

  koi: (c, lw) => `
    <ellipse cx="50" cy="45" rx="14" ry="24" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M50,21 L38,10 L50,16 L62,10 Z" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M50,69 L40,82 L50,76 L60,82 Z" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M10,80 Q20,70 30,75 Q40,65 50,70 Q60,60 70,65 Q80,60 90,70" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M10,88 Q20,78 30,83 Q40,73 50,78 Q60,68 70,73 Q80,68 90,78" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  bamboo: (c, lw) => `
    <line x1="30" y1="10" x2="30" y2="90" stroke="${c}" stroke-width="${lw * 1.5}"/>
    <line x1="50" y1="5" x2="50" y2="90" stroke="${c}" stroke-width="${lw * 1.5}"/>
    <line x1="70" y1="10" x2="70" y2="90" stroke="${c}" stroke-width="${lw * 1.5}"/>
    ${[25,40,55,70].map(y => `<line x1="25" y1="${y}" x2="35" y2="${y}" stroke="${c}" stroke-width="${lw}"/>
    <line x1="45" y1="${y - 5}" x2="55" y2="${y - 5}" stroke="${c}" stroke-width="${lw}"/>
    <line x1="65" y1="${y}" x2="75" y2="${y}" stroke="${c}" stroke-width="${lw}"/>`).join('')}
    <path d="M30,40 Q15,30 8,20" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M50,35 Q65,22 72,12" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  crane: (c, lw) => `
    <ellipse cx="50" cy="55" rx="18" ry="22" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="28" r="8" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M50,36 L50,45" stroke="${c}" stroke-width="${lw}"/>
    <path d="M32,55 Q20,50 10,55 Q20,62 32,58" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M68,55 Q80,50 90,55 Q80,62 68,58" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M42,77 L38,90" stroke="${c}" stroke-width="${lw}"/>
    <path d="M58,77 L62,90" stroke="${c}" stroke-width="${lw}"/>
    <path d="M20,25 Q30,18 40,22" stroke="${c}" fill="none" stroke-width="${lw * 0.7}"/>
    <path d="M60,20 Q70,15 80,20" stroke="${c}" fill="none" stroke-width="${lw * 0.7}"/>`,

  lotus: (c, lw) => `
    <circle cx="50" cy="50" r="14" stroke="${c}" fill="none" stroke-width="${lw}"/>
    ${[0,45,90,135,180,225,270,315].map(a => {
      const rad = a * Math.PI / 180;
      const x1 = 50 + 14 * Math.cos(rad);
      const y1 = 50 + 14 * Math.sin(rad);
      const x2 = 50 + 32 * Math.cos(rad);
      const y2 = 50 + 32 * Math.sin(rad);
      const cx1 = 50 + 28 * Math.cos(rad - 0.3);
      const cy1 = 50 + 28 * Math.sin(rad - 0.3);
      const cx2 = 50 + 28 * Math.cos(rad + 0.3);
      const cy2 = 50 + 28 * Math.sin(rad + 0.3);
      return `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} C${cx1.toFixed(1)},${cy1.toFixed(1)} ${cx2.toFixed(1)},${cy2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" stroke="${c}" fill="none" stroke-width="${lw}"/>`;
    }).join('')}`,

  cloud: (c, lw) => `
    <path d="M20,60 Q15,50 22,42 Q28,35 38,38 Q40,28 50,26 Q60,24 64,34 Q72,33 76,40 Q84,38 86,48 Q90,55 84,62 Z" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linejoin="round"/>
    <path d="M15,75 Q20,65 30,68 Q35,60 45,62 Q48,55 56,57 Q64,55 66,63 Q74,61 78,68 Q86,68 88,76 Z" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linejoin="round"/>`,

  taichi: (c, lw) => `
    <circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M50,14 A18,18 0 0,1 50,50 A18,18 0 0,0 50,86 A36,36 0 0,1 50,14" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="32" r="6" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="68" r="6" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  swastika: (c, lw) => `
    <path d="M35,20 L35,50 L20,50" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linecap="round"/>
    <path d="M80,35 L50,35 L50,20" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linecap="round"/>
    <path d="M65,80 L65,50 L80,50" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linecap="round"/>
    <path d="M20,65 L50,65 L50,80" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linecap="round"/>`,

  meander: (c, lw) => `
    <rect x="10" y="10" width="80" height="80" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M20,20 L30,20 L30,30 L80,30 L80,20 M20,20 L20,80 L30,80 L30,70 L80,70 L80,80 M70,30 L70,40 L40,40 L40,60 L70,60 L70,70 M20,50 L40,50 M30,40 L30,60" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linejoin="round"/>`,

  icecrack: (c, lw) => `
    <path d="M50,10 L30,35 L10,45 L25,65 L15,85 L40,75 L55,90 L65,70 L85,80 L80,55 L95,40 L72,30 L60,12 Z" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M50,10 L60,40 L80,55" stroke="${c}" stroke-width="${lw * 0.7}"/>
    <path d="M30,35 L55,50 L65,70" stroke="${c}" stroke-width="${lw * 0.7}"/>
    <path d="M10,45 L40,50 L55,90" stroke="${c}" stroke-width="${lw * 0.7}"/>
    <path d="M25,65 L50,55 L72,30" stroke="${c}" stroke-width="${lw * 0.7}"/>`,

  knot: (c, lw) => `
    <path d="M50,15 C60,15 70,25 70,35 C70,45 60,50 50,50 C40,50 30,45 30,35 C30,25 40,15 50,15" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M50,85 C60,85 70,75 70,65 C70,55 60,50 50,50 C40,50 30,55 30,65 C30,75 40,85 50,85" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M15,50 C15,40 25,30 35,30 C45,30 50,40 50,50 C50,60 45,70 35,70 C25,70 15,60 15,50" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M85,50 C85,40 75,30 65,30 C55,30 50,40 50,50 C50,60 55,70 65,70 C75,70 85,60 85,50" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  dragon: (c, lw) => `
    <path d="M15,80 C20,60 15,40 25,30 C35,20 45,25 50,35 C55,45 60,55 70,50 C80,45 85,30 80,20" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linecap="round"/>
    <path d="M80,20 L85,15 M80,20 L75,12" stroke="${c}" stroke-width="${lw}" stroke-linecap="round"/>
    <circle cx="82" cy="22" r="3" stroke="${c}" fill="none" stroke-width="${lw * 0.8}"/>
    <path d="M40,28 Q35,18 28,15" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M60,52 Q55,62 60,68" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  opera: (c, lw) => `
    <ellipse cx="50" cy="48" rx="28" ry="34" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <line x1="22" y1="48" x2="78" y2="48" stroke="${c}" stroke-width="${lw * 0.7}"/>
    <path d="M32,35 Q38,28 44,33" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M56,33 Q62,28 68,35" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M36,58 Q44,55 50,58 Q56,55 64,58" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M22,40 Q15,35 12,28" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M78,40 Q85,35 88,28" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  toad: (c, lw) => `
    <ellipse cx="50" cy="60" rx="30" ry="22" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="35" cy="48" r="8" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="65" cy="48" r="8" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M30,72 L20,85" stroke="${c}" stroke-width="${lw}" stroke-linecap="round"/>
    <path d="M40,78 L35,90" stroke="${c}" stroke-width="${lw}" stroke-linecap="round"/>
    <path d="M60,78 L65,90" stroke="${c}" stroke-width="${lw}" stroke-linecap="round"/>
    <path d="M70,72 L80,85" stroke="${c}" stroke-width="${lw}" stroke-linecap="round"/>
    <circle cx="50" cy="55" r="5" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  magpie: (c, lw) => `
    <path d="M20,70 L25,55 L35,50 L45,52 L50,45 L55,38" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linecap="round"/>
    <path d="M50,45 L60,42 L65,45 L60,50 L50,45" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linejoin="round"/>
    <path d="M55,38 L60,30 L55,25" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linecap="round"/>
    <circle cx="62" cy="28" r="4" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M40,65 L40,20" stroke="${c}" stroke-width="${lw * 1.5}" stroke-linecap="round"/>
    <path d="M40,30 Q50,25 55,30" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M40,40 Q30,35 25,40" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M40,50 Q52,45 58,50" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  guqin: (c, lw) => `
    <path d="M35,15 Q28,15 28,25 L28,75 Q28,85 35,85 L65,85 Q72,85 72,75 L72,25 Q72,15 65,15 Z" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <rect x="38" y="10" width="24" height="8" rx="2" stroke="${c}" fill="none" stroke-width="${lw}"/>
    ${[1,2,3,4,5,6,7].map((_, i) => `<line x1="36" y1="${25 + i * 8}" x2="64" y2="${25 + i * 8}" stroke="${c}" stroke-width="${lw * 0.5}"/>`).join('')}`,

  tile: (c, lw) => `
    <circle cx="50" cy="50" r="38" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="50" r="28" stroke="${c}" fill="none" stroke-width="${lw}"/>
    ${[0,90,180,270].map(a => {
      const r = a * Math.PI / 180;
      return `<path d="M${(50 + 28*Math.cos(r)).toFixed(1)},${(50 + 28*Math.sin(r)).toFixed(1)} Q${(50 + 33*Math.cos(r-0.3)).toFixed(1)},${(50 + 33*Math.sin(r-0.3)).toFixed(1)} ${(50 + 38*Math.cos(r)).toFixed(1)},${(50 + 38*Math.sin(r)).toFixed(1)}" stroke="${c}" fill="none" stroke-width="${lw * 1.5}"/>`;
    }).join('')}`,

  lantern: (c, lw) => `
    <ellipse cx="50" cy="50" rx="22" ry="32" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <line x1="50" y1="18" x2="50" y2="10" stroke="${c}" stroke-width="${lw}" stroke-linecap="round"/>
    <line x1="42" y1="10" x2="58" y2="10" stroke="${c}" stroke-width="${lw}" stroke-linecap="round"/>
    ${[30,40,50,60,70].map(y => `<line x1="${50 - 22 * Math.sqrt(1 - Math.pow((y-50)/32, 2))}" y1="${y}" x2="${50 + 22 * Math.sqrt(1 - Math.pow((y-50)/32, 2))}" y2="${y}" stroke="${c}" stroke-width="${lw * 0.5}"/>`).join('')}
    <path d="M46,82 L44,92 M50,82 L50,92 M54,82 L56,92" stroke="${c}" stroke-width="${lw}" stroke-linecap="round"/>`,

  ruyi: (c, lw) => `
    <path d="M50,85 C50,75 42,68 35,60 C28,52 28,42 35,36 C42,30 52,32 55,40" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linecap="round"/>
    <circle cx="55" cy="35" r="12" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M50,85 C55,80 65,75 70,68" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linecap="round"/>
    <circle cx="70" cy="62" r="8" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  coin: (c, lw) => `
    <circle cx="50" cy="50" r="38" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <rect x="40" y="40" width="20" height="20" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="50" r="24" stroke="${c}" fill="none" stroke-width="${lw * 0.5}"/>`,

  papercut: (c, lw) => `
    ${[0,45,90,135,180,225,270,315].map(a => {
      const r = a * Math.PI / 180;
      const x1 = 50 + 8 * Math.cos(r), y1 = 50 + 8 * Math.sin(r);
      const x2 = 50 + 36 * Math.cos(r), y2 = 50 + 36 * Math.sin(r);
      const x3 = 50 + 28 * Math.cos(r - 0.3), y3 = 50 + 28 * Math.sin(r - 0.3);
      const x4 = 50 + 28 * Math.cos(r + 0.3), y4 = 50 + 28 * Math.sin(r + 0.3);
      return `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} L${x3.toFixed(1)},${y3.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} L${x4.toFixed(1)},${y4.toFixed(1)} Z" stroke="${c}" fill="none" stroke-width="${lw}"/>`;
    }).join('')}`,

  jade: (c, lw) => `
    <path d="M50,10 A30,42 0 1,0 50,10.001" stroke="${c}" fill="none" stroke-width="${lw}" stroke-dasharray="5 0"/>
    <path d="M50,10 L50,20 M50,90 L50,80" stroke="${c}" stroke-width="${lw * 2}" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="10" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <ellipse cx="50" cy="50" rx="28" ry="36" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  heaven: (c, lw) => `
    <rect x="12" y="12" width="76" height="76" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="50" r="28" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="50" r="8" stroke="${c}" fill="none" stroke-width="${lw * 0.7}"/>`,

  bagua: (c, lw) => `
    ${[0,1,2,3,4,5,6,7].map(i => {
      const a = (i * 45 - 90) * Math.PI / 180;
      const x1 = 50 + 36 * Math.cos(a), y1 = 50 + 36 * Math.sin(a);
      const x2 = 50 + 20 * Math.cos(a), y2 = 50 + 20 * Math.sin(a);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="${lw}"/>`;
    }).join('')}
    <circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="50" r="16" stroke="${c}" fill="none" stroke-width="${lw}"/>`,
};

// ─── City Skylines ─────────────────────────────────────────────────────────────
// Each city has a unique building profile
const CITY_PROFILES: Record<string, number[]> = {
  beijing: [20,35,55,70,90,80,65,100,85,70,50,40,30],   // Tiananmen + modern
  tianjin: [25,40,60,75,65,50,85,70,55,40,30,45,35],
  shijiazhuang: [30,45,55,65,50,70,55,45,35,50,40,30,25],
  shenyang: [25,40,65,80,70,55,90,75,60,45,35,50,30],
  changchun: [20,35,50,65,55,45,75,60,45,35,25,40,30],
  harbin: [30,50,70,85,75,60,55,80,65,50,40,35,25],
  shanghai: [20,30,40,55,80,100,90,75,60,45,35,50,70],  // Oriental Pearl
  nanjing: [25,40,60,80,70,55,85,70,55,40,30,45,35],
  hangzhou: [20,35,50,65,55,45,70,60,45,35,25,40,30],   // West Lake gentle
  hefei: [25,40,55,70,60,50,75,62,48,38,28,42,32],
  fuzhou: [20,35,52,68,58,46,72,60,46,35,26,40,30],
  nanchang: [22,38,54,70,60,48,74,62,48,36,27,41,31],
  wuhan: [25,40,60,80,70,55,90,75,60,45,35,50,40],      // Yellow Crane Tower
  changsha: [22,38,55,72,62,50,78,65,50,38,28,42,32],
  guangzhou: [20,35,55,75,95,85,70,55,40,65,80,60,45],  // Canton Tower
  nanning: [20,35,50,65,55,45,70,58,44,34,25,38,28],
  haikou: [18,30,45,60,50,40,62,52,40,30,22,35,26],
  chengdu: [22,38,55,72,62,50,78,65,50,38,28,42,32],
  kunming: [20,35,50,65,55,45,68,56,43,33,24,38,28],
  lhasa: [30,50,70,90,80,65,75,85,70,55,45,35,25],      // Potala Palace
  xian: [30,50,70,85,75,60,90,80,65,50,40,55,35],       // Bell Tower
  lanzhou: [20,35,52,68,58,46,72,60,46,35,26,40,30],
  urumqi: [22,38,54,70,60,48,74,62,48,36,27,41,31],
  chongqing: [25,42,60,80,70,55,88,75,60,45,35,50,38],  // Hillside buildings
};

function cityToSvg(id: string, color: string): string {
  const profile = CITY_PROFILES[id] ?? CITY_PROFILES.shanghai;
  const numBuildings = profile.length;
  const bw = 100 / numBuildings;
  const buildings = profile.map((h, i) => {
    const x = i * bw + bw * 0.1;
    const w = bw * 0.8;
    const y = 95 - h * 0.75;
    const bh = h * 0.75;
    // Windows
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

// ─── AI Tech Shapes ────────────────────────────────────────────────────────────
const AI_SVGS: Record<string, (c: string) => string> = {
  chatgpt: (c) => `<circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M34,38 L50,28 L66,38 L66,62 L50,72 L34,62 Z" stroke="${c}" fill="none" stroke-width="2"/>
    <circle cx="50" cy="50" r="10" stroke="${c}" fill="none" stroke-width="2"/>`,

  claude: (c) => `<circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M28,50 Q38,30 50,35 Q62,40 60,55 Q58,70 50,68 Q38,65 32,58" stroke="${c}" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path d="M50,35 Q62,28 68,40" stroke="${c}" fill="none" stroke-width="2"/>`,

  gemini: (c) => `<circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M50,15 C60,30 70,40 72,50 C70,60 60,70 50,85 C40,70 30,60 28,50 C30,40 40,30 50,15Z" stroke="${c}" fill="none" stroke-width="2"/>`,

  deepseek: (c) => `<circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M30,50 A20,20 0 1,1 70,50 A20,20 0 1,1 30,50" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M50,30 L50,70 M30,50 L70,50" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`,

  midjourney: (c) => `<path d="M20,80 L50,20 L80,80" stroke="${c}" fill="none" stroke-width="3" stroke-linejoin="round"/>
    <path d="M50,20 L50,80" stroke="${c}" stroke-width="1.5"/>
    <circle cx="50" cy="55" r="15" stroke="${c}" fill="none" stroke-width="2"/>`,

  stablediff: (c) => `<rect x="18" y="18" width="64" height="64" rx="8" stroke="${c}" fill="none" stroke-width="2"/>
    <circle cx="50" cy="50" r="18" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M36,36 L64,64 M64,36 L36,64" stroke="${c}" stroke-width="1.5" opacity="0.5"/>`,

  dalle: (c) => `<circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M28,50 Q35,20 50,18 Q65,20 72,50 Q65,80 50,82 Q35,80 28,50Z" stroke="${c}" fill="none" stroke-width="2"/>
    <circle cx="50" cy="50" r="8" stroke="${c}" fill="none" stroke-width="2"/>`,

  sora: (c) => `<rect x="15" y="25" width="70" height="50" rx="6" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M42,38 L62,50 L42,62Z" stroke="${c}" fill="none" stroke-width="2"/>
    <circle cx="22" cy="32" r="3" stroke="${c}" fill="none" stroke-width="1.5"/>`,

  perplexity: (c) => `<circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M50,20 L50,80 M30,40 L70,40 M28,60 L72,60" stroke="${c}" stroke-width="2"/>
    <path d="M35,28 Q50,14 65,28" stroke="${c}" fill="none" stroke-width="2"/>`,

  cursor: (c) => `<rect x="18" y="18" width="64" height="64" rx="10" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M32,32 L52,68 L56,52 L72,48Z" stroke="${c}" fill="none" stroke-width="2"/>`,

  copilot: (c) => `<path d="M50,15 A35,35 0 1,0 50,85 A35,35 0 1,0 50,15" stroke="${c}" fill="none" stroke-width="2"/>
    <circle cx="38" cy="45" r="8" stroke="${c}" fill="none" stroke-width="2"/>
    <circle cx="62" cy="45" r="8" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M38,55 Q50,65 62,55" stroke="${c}" fill="none" stroke-width="2"/>`,

  grok: (c) => `<path d="M20,20 L80,80 M20,80 L80,20" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="2"/>
    <circle cx="50" cy="50" r="16" stroke="${c}" fill="none" stroke-width="2"/>`,

  llama: (c) => `<path d="M30,80 L30,45 Q30,20 50,20 Q70,20 70,45 L70,80" stroke="${c}" fill="none" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M50,20 Q55,12 65,12 Q72,12 72,20" stroke="${c}" fill="none" stroke-width="2"/>
    <circle cx="44" cy="38" r="3" stroke="${c}" fill="none" stroke-width="2"/>`,

  gemma: (c) => `<polygon points="50,15 82,32 82,68 50,85 18,68 18,32" stroke="${c}" fill="none" stroke-width="2"/>
    <circle cx="50" cy="50" r="18" stroke="${c}" fill="none" stroke-width="2"/>`,

  mistral: (c) => `<path d="M20,20 L40,20 L40,80 L20,80 M60,20 L80,20 L80,80 L60,80 M40,20 L60,20 M40,50 L60,50 M40,80 L60,80" stroke="${c}" fill="none" stroke-width="2.5" stroke-linecap="round"/>`,

  qwen: (c) => `<circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M34,34 L50,20 L66,34 M34,66 L50,80 L66,66" stroke="${c}" fill="none" stroke-width="2" stroke-linejoin="round"/>
    <rect x="38" y="38" width="24" height="24" stroke="${c}" fill="none" stroke-width="2"/>`,

  kimi: (c) => `<path d="M35,20 L35,80 M65,20 L65,80" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
    <path d="M35,50 L65,50" stroke="${c}" stroke-width="2"/>
    <path d="M35,30 Q50,20 65,30" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M35,70 Q50,80 65,70" stroke="${c}" fill="none" stroke-width="2"/>`,

  doubao: (c) => `<circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M30,45 Q40,30 50,35 Q60,40 65,55 Q60,70 50,68 Q38,65 32,55Z" stroke="${c}" fill="none" stroke-width="2"/>`,

  wenxin: (c) => `<circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M50,20 Q70,35 65,50 Q60,65 50,70 Q40,65 35,50 Q30,35 50,20Z" stroke="${c}" fill="none" stroke-width="2"/>
    <line x1="50" y1="20" x2="50" y2="70" stroke="${c}" stroke-width="1.5" opacity="0.5"/>`,

  tongyi: (c) => `<rect x="18" y="18" width="64" height="64" rx="32" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M30,50 A20,20 0 1,1 70,50" stroke="${c}" fill="none" stroke-width="2.5"/>
    <circle cx="50" cy="68" r="6" stroke="${c}" fill="none" stroke-width="2"/>`,

  xunfei: (c) => `<path d="M50,15 Q70,20 75,40 Q80,60 65,75 Q50,85 35,75 Q20,60 25,40 Q30,20 50,15Z" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M38,45 Q50,35 62,45 Q55,60 50,65 Q45,60 38,45Z" stroke="${c}" fill="none" stroke-width="2"/>`,

  nvidia: (c) => `<rect x="18" y="30" width="64" height="40" rx="4" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M18,42 L82,42" stroke="${c}" stroke-width="1.5"/>
    <text x="50" y="56" text-anchor="middle" fill="${c}" font-size="10" font-weight="bold" font-family="sans-serif">NVIDIA</text>`,

  tesla: (c) => `<path d="M20,30 L80,30 M50,30 L50,80 M20,30 Q35,18 50,30 Q65,18 80,30" stroke="${c}" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,

  apple: (c) => `<path d="M50,85 C30,85 18,72 18,55 C18,38 30,26 42,26 C46,26 50,28 50,28 C50,28 54,26 58,26 C70,26 82,38 82,55 C82,72 70,85 50,85Z" stroke="${c}" fill="none" stroke-width="2"/>
    <path d="M50,26 Q58,16 60,10" stroke="${c}" fill="none" stroke-width="2" stroke-linecap="round"/>`,
};

// ─── Public API ────────────────────────────────────────────────────────────────
export function getShapeSvg(
  style: 'chinese' | 'city' | 'aitech',
  shapeId: string,
  color = 'white',
  lineWidth = 1.5
): string {
  let inner = '';
  if (style === 'chinese') {
    const fn = CHINESE_SVGS[shapeId];
    inner = fn ? fn(color, lineWidth) : CHINESE_SVGS['mountain'](color, lineWidth);
  } else if (style === 'city') {
    inner = cityToSvg(shapeId, color);
  } else {
    const fn = AI_SVGS[shapeId];
    inner = fn ? fn(color) : AI_SVGS['chatgpt'](color);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${inner}</svg>`;
}

export function svgToDataUrl(svgString: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
}

export async function loadShapeImage(
  style: 'chinese' | 'city' | 'aitech',
  shapeId: string,
  color = 'white',
  lineWidth = 1.5
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const svg = getShapeSvg(style, shapeId, color, lineWidth);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = svgToDataUrl(svg);
  });
}
