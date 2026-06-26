// ─── Chinese Shapes ────────────────────────────────────────────────────────────
export const CHINESE_SVGS: Record<string, (color: string, lw: number) => string> = {
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

  // ─── New shapes ───────────────────────────────────────────────────────────
  plum: (c, lw) => `
    <circle cx="50" cy="28" r="10" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="72" cy="42" r="10" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="65" cy="66" r="10" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="35" cy="66" r="10" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="28" cy="42" r="10" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="50" r="6" stroke="${c}" fill="none" stroke-width="${lw * 0.6}"/>
    <line x1="50" y1="38" x2="50" y2="44" stroke="${c}" stroke-width="${lw * 0.6}"/>
    <line x1="63" y1="45" x2="58" y2="48" stroke="${c}" stroke-width="${lw * 0.6}"/>
    <line x1="60" y1="60" x2="56" y2="56" stroke="${c}" stroke-width="${lw * 0.6}"/>
    <line x1="40" y1="60" x2="44" y2="56" stroke="${c}" stroke-width="${lw * 0.6}"/>
    <line x1="37" y1="45" x2="42" y2="48" stroke="${c}" stroke-width="${lw * 0.6}"/>`,

  pine: (c, lw) => `
    <line x1="50" y1="90" x2="50" y2="15" stroke="${c}" stroke-width="${lw * 1.5}" stroke-linecap="round"/>
    <path d="M50,25 L28,55 L38,55 L20,75 L36,75 L22,90" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linejoin="round"/>
    <path d="M50,25 L72,55 L62,55 L80,75 L64,75 L78,90" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linejoin="round"/>`,

  wave: (c, lw) => `
    ${[20,38,56,74].map(y => `<path d="M8,${y} Q20,${y-14} 32,${y} Q44,${y+14} 56,${y} Q68,${y-14} 80,${y} Q92,${y+14} 100,${y}" stroke="${c}" fill="none" stroke-width="${lw}"/>`).join('')}`,

  peony: (c, lw) => `
    ${[0,60,120,180,240,300].map(a => {
      const r = a * Math.PI / 180;
      const mx = 50 + 22 * Math.cos(r), my = 50 + 22 * Math.sin(r);
      const cx1 = 50 + 38 * Math.cos(r - 0.5), cy1 = 50 + 38 * Math.sin(r - 0.5);
      const cx2 = 50 + 38 * Math.cos(r + 0.5), cy2 = 50 + 38 * Math.sin(r + 0.5);
      return `<path d="M${mx.toFixed(1)},${my.toFixed(1)} Q${cx1.toFixed(1)},${cy1.toFixed(1)} ${(50 + 36 * Math.cos(r)).toFixed(1)},${(50 + 36 * Math.sin(r)).toFixed(1)} Q${cx2.toFixed(1)},${cy2.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}" stroke="${c}" fill="none" stroke-width="${lw}"/>`;
    }).join('')}
    ${[0,30,60,90,120,150,180,210,240,270,300,330].map(a => {
      const r = a * Math.PI / 180;
      return `<line x1="${(50 + 8 * Math.cos(r)).toFixed(1)}" y1="${(50 + 8 * Math.sin(r)).toFixed(1)}" x2="${(50 + 18 * Math.cos(r)).toFixed(1)}" y2="${(50 + 18 * Math.sin(r)).toFixed(1)}" stroke="${c}" stroke-width="${lw * 0.7}"/>`;
    }).join('')}
    <circle cx="50" cy="50" r="7" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  fenix: (c, lw) => `
    <path d="M50,10 Q60,25 75,20 Q65,35 70,50 Q55,42 50,55 Q45,42 30,50 Q35,35 25,20 Q40,25 50,10 Z" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M50,55 Q45,68 30,72 Q38,62 35,72 Q45,60 50,75 Q55,60 65,72 Q62,62 70,72 Q55,68 50,55" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M40,80 Q50,90 60,80" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linecap="round"/>
    <circle cx="50" cy="30" r="5" stroke="${c}" fill="none" stroke-width="${lw * 0.8}"/>`,

  fish: (c, lw) => `
    <ellipse cx="46" cy="50" rx="28" ry="18" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M74,50 L88,38 L84,50 L88,62 Z" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linejoin="round"/>
    <circle cx="34" cy="46" r="4" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M52,38 Q60,32 66,35" stroke="${c}" fill="none" stroke-width="${lw * 0.7}"/>
    <path d="M52,50 Q60,44 68,47" stroke="${c}" fill="none" stroke-width="${lw * 0.7}"/>
    <path d="M52,62 Q60,56 66,59" stroke="${c}" fill="none" stroke-width="${lw * 0.7}"/>`,

  hexflower: (c, lw) => `
    ${[0,60,120,180,240,300].map(a => {
      const r = a * Math.PI / 180, r2 = (a + 30) * Math.PI / 180;
      const x1 = 50 + 38 * Math.cos(r), y1 = 50 + 38 * Math.sin(r);
      const x2 = 50 + 38 * Math.cos(r2), y2 = 50 + 38 * Math.sin(r2);
      const px = 50 + 22 * Math.cos(r), py = 50 + 22 * Math.sin(r);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="${lw}"/>
<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="50" y2="50" stroke="${c}" stroke-width="${lw * 0.6}"/>`;
    }).join('')}
    <circle cx="50" cy="50" r="38" stroke="${c}" fill="none" stroke-width="${lw * 0.4}"/>
    <circle cx="50" cy="50" r="10" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  fu: (c, lw) => `
    <rect x="14" y="14" width="72" height="72" rx="4" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M30,30 L70,30" stroke="${c}" stroke-width="${lw * 1.2}" stroke-linecap="round"/>
    <path d="M50,30 L50,42" stroke="${c}" stroke-width="${lw * 1.2}" stroke-linecap="round"/>
    <path d="M32,42 Q50,38 68,42" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M28,55 L34,42 M72,55 L66,42" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M28,55 L72,55" stroke="${c}" stroke-width="${lw}" stroke-linecap="round"/>
    <path d="M38,55 L36,72 M62,55 L64,72" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M36,72 L64,72" stroke="${c}" stroke-width="${lw}" stroke-linecap="round"/>`,

  shou: (c, lw) => `
    <circle cx="50" cy="50" r="36" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M38,32 Q50,22 62,32 Q68,42 62,52 Q56,58 50,55 Q44,58 38,52 Q32,42 38,32 Z" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M44,55 L40,72 M56,55 L60,72" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M38,64 L62,64" stroke="${c}" stroke-width="${lw}"/>`,

  xi: (c, lw) => `
    <rect x="14" y="14" width="32" height="72" rx="2" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <line x1="14" y1="50" x2="46" y2="50" stroke="${c}" stroke-width="${lw}"/>
    <line x1="30" y1="14" x2="30" y2="86" stroke="${c}" stroke-width="${lw}"/>
    <rect x="54" y="14" width="32" height="32" rx="2" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <line x1="54" y1="30" x2="86" y2="30" stroke="${c}" stroke-width="${lw}"/>
    <line x1="70" y1="14" x2="70" y2="46" stroke="${c}" stroke-width="${lw}"/>
    <rect x="54" y="54" width="32" height="32" rx="2" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <line x1="54" y1="70" x2="86" y2="70" stroke="${c}" stroke-width="${lw}"/>
    <line x1="70" y1="54" x2="70" y2="86" stroke="${c}" stroke-width="${lw}"/>`,

  fan: (c, lw) => `
    <path d="M50,78 L18,38 A38,38 0 0,1 82,38 Z" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linejoin="round"/>
    ${[0,1,2,3,4,5,6].map(i => {
      const a = (-60 + i * 20) * Math.PI / 180;
      return `<line x1="50" y1="78" x2="${(50 + 40 * Math.sin(a)).toFixed(1)}" y2="${(78 - 40 * Math.cos(a)).toFixed(1)}" stroke="${c}" stroke-width="${lw * 0.6}"/>`;
    }).join('')}
    <path d="M32,62 Q50,72 68,62" stroke="${c}" fill="none" stroke-width="${lw * 0.8}"/>
    <circle cx="50" cy="78" r="4" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  vase: (c, lw) => `
    <path d="M35,88 L30,70 Q22,55 28,40 Q34,26 50,22 Q66,26 72,40 Q78,55 70,70 L65,88 Z" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linejoin="round"/>
    <path d="M38,88 L62,88" stroke="${c}" stroke-width="${lw}" stroke-linecap="round"/>
    <path d="M42,22 Q50,16 58,22" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M32,60 Q50,65 68,60" stroke="${c}" fill="none" stroke-width="${lw * 0.7}"/>
    ${[35,45,55].map(y => `<path d="M34,${y} Q50,${y + 5} 66,${y}" stroke="${c}" fill="none" stroke-width="${lw * 0.5}"/>`).join('')}`,

  seal: (c, lw) => `
    <rect x="16" y="16" width="68" height="68" stroke="${c}" fill="none" stroke-width="${lw * 1.5}"/>
    <rect x="22" y="22" width="56" height="56" stroke="${c}" fill="none" stroke-width="${lw * 0.5}"/>
    <line x1="50" y1="22" x2="50" y2="78" stroke="${c}" stroke-width="${lw * 0.5}"/>
    <line x1="22" y1="50" x2="78" y2="50" stroke="${c}" stroke-width="${lw * 0.5}"/>`,

  ring3: (c, lw) => `
    <circle cx="34" cy="50" r="20" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="50" cy="50" r="20" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <circle cx="66" cy="50" r="20" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  starburst: (c, lw) => `
    ${[0,22.5,45,67.5,90,112.5,135,157.5,180,202.5,225,247.5,270,292.5,315,337.5].map(a => {
      const r = a * Math.PI / 180;
      const inner = a % 45 === 0 ? 14 : 22;
      return `<line x1="${(50 + inner * Math.cos(r)).toFixed(1)}" y1="${(50 + inner * Math.sin(r)).toFixed(1)}" x2="${(50 + 38 * Math.cos(r)).toFixed(1)}" y2="${(50 + 38 * Math.sin(r)).toFixed(1)}" stroke="${c}" stroke-width="${a % 45 === 0 ? lw : lw * 0.5}"/>`;
    }).join('')}
    <circle cx="50" cy="50" r="12" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  diamond4: (c, lw) => `
    ${[0,90,180,270].map(a => {
      const r = a * Math.PI / 180;
      const cx2 = 50 + 28 * Math.cos(r), cy2 = 50 + 28 * Math.sin(r);
      const lx1 = cx2 + 14 * Math.cos((a + 90) * Math.PI / 180);
      const ly1 = cy2 + 14 * Math.sin((a + 90) * Math.PI / 180);
      const lx2 = cx2 - 14 * Math.cos((a + 90) * Math.PI / 180);
      const ly2 = cy2 - 14 * Math.sin((a + 90) * Math.PI / 180);
      return `<path d="M${cx2.toFixed(1)},${(cy2 - 14 * Math.cos(r)).toFixed(1)} L${lx1.toFixed(1)},${ly1.toFixed(1)} L${cx2.toFixed(1)},${(cy2 + 14 * Math.cos(r)).toFixed(1)} L${lx2.toFixed(1)},${ly2.toFixed(1)} Z" stroke="${c}" fill="none" stroke-width="${lw}"/>`;
    }).join('')}
    <circle cx="50" cy="50" r="8" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  lotus8: (c, lw) => `
    ${[0,45,90,135,180,225,270,315].map(a => {
      const r = a * Math.PI / 180;
      const bx = 50 + 10 * Math.cos(r), by = 50 + 10 * Math.sin(r);
      const tx = 50 + 38 * Math.cos(r), ty = 50 + 38 * Math.sin(r);
      const c1x = 50 + 40 * Math.cos((a - 25) * Math.PI / 180);
      const c1y = 50 + 40 * Math.sin((a - 25) * Math.PI / 180);
      const c2x = 50 + 40 * Math.cos((a + 25) * Math.PI / 180);
      const c2y = 50 + 40 * Math.sin((a + 25) * Math.PI / 180);
      return `<path d="M${bx.toFixed(1)},${by.toFixed(1)} Q${c1x.toFixed(1)},${c1y.toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)} Q${c2x.toFixed(1)},${c2y.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}" stroke="${c}" fill="none" stroke-width="${lw}"/>`;
    }).join('')}
    <circle cx="50" cy="50" r="10" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  maze: (c, lw) => `
    <rect x="12" y="12" width="76" height="76" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M12,37 L37,37 L37,12" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M63,12 L63,37 L88,37" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M88,63 L63,63 L63,88" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <path d="M37,88 L37,63 L12,63" stroke="${c}" fill="none" stroke-width="${lw}"/>
    <rect x="37" y="37" width="26" height="26" stroke="${c}" fill="none" stroke-width="${lw}"/>`,

  spiral: (c, lw) => `
    <path d="M50,50 Q60,40 65,50 Q70,65 55,72 Q38,78 28,62 Q18,44 32,30 Q48,15 68,24 Q86,34 84,55 Q82,75 62,82" stroke="${c}" fill="none" stroke-width="${lw}" stroke-linecap="round"/>`,
};


