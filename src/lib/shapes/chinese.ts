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
};

