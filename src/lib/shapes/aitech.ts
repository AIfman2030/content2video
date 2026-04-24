// ─── AI Tech Shapes ────────────────────────────────────────────────────────────
export const AI_SVGS: Record<string, (c: string) => string> = {
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

