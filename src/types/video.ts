export type StyleType = 'chinese' | 'city' | 'aitech' | 'nature' | 'subtitle' | 'translation' | 'manga';
export type ColorScheme = 'ink' | 'cinnabar' | 'jade' | 'gold' | 'porcelain';
export type AnimMode = 'grid' | 'single';
export type PolyShape = 'triangle' | 'quad' | 'pentagon' | 'hexagon' | 'octagon' | 'star5' | 'decagon';

// ─── Existing ──────────────────────────────────────────────────────────────────
export interface AIOptions {
  polyShape: PolyShape;
}

export interface ChineseOptions {
  colorScheme: ColorScheme;
  borderWidth: 1 | 2 | 3 | 4;
  lineWidth: 1 | 2 | 3 | 4;
  animMode: AnimMode;
  titleEntranceAnim?: 'dropsFromSky' | 'typewriter';  // default 'dropsFromSky'
  // ── Optional text style overrides (undefined = use theme defaults) ──────
  titleFontSize?: number;    // default 68
  titleColor?: string;       // default '' = use accent
  shortFontSize?: number;    // default 36
  shortColor?: string;       // default '' = use accent2
  descFontSize?: number;     // default 32
  descColor?: string;        // default '' = rgba(255,255,255,0.92)
  // ── Optional background overrides ('' = use colorScheme defaults) ───────
  bgColor1?: string;
  bgColor2?: string;
}

// ─── Subtitle style options ────────────────────────────────────────────────────
export type SubtitleEnterAnim =
  | 'slideUp'
  | 'slideLeft'
  | 'slideRight'
  | 'typewriter'
  | 'fadeIn';

export interface SubtitleHighlight {
  text: string;   // keyword to match (exact)
  color: string;  // highlight colour (hex)
}

export interface SubtitleOptions {
  titleText: string;           // account badge name (top-left)
  titleColor: string;          // hex — accent stripe + badge highlight
  accentColor: string;         // hex — even-line colour
  defaultTextColor: string;    // hex — odd-line colour (default #ffffff)
  fontSize: 'auto' | 'sm' | 'md' | 'lg';  // auto = adaptive, others set ceiling
  enterAnim: SubtitleEnterAnim;
  linesPerSlide: 1 | 2 | 3 | 4 | 5 | 6;  // max visual lines per page
  highlights: SubtitleHighlight[];         // keyword → colour overrides
}

export const DEFAULT_SUBTITLE_OPTIONS: SubtitleOptions = {
  titleText: '',
  titleColor: '#ffd700',
  accentColor: '#ffd700',
  defaultTextColor: '#ffffff',
  fontSize: 'auto',
  enterAnim: 'slideUp',
  linesPerSlide: 3,
  highlights: [],
};

// ─── City style options ────────────────────────────────────────────────────────
export interface CityOptions {
  accentColor: string;                     // warm highlight
  secondaryColor: string;                  // contrast (default red)
  animSpeed: 'slow' | 'normal' | 'fast';
  // Text style overrides (optional — fall back to defaults when empty/undefined)
  labelFontSize?: number;   // default 108
  labelColor?: string;      // default '' = use accent
  shortFontSize?: number;   // default 64
  shortColor?: string;      // default '' = white
  descFontSize?: number;    // default 40
  descColor?: string;       // default '' = rgba(220,220,220,0.90)
}

export const DEFAULT_CITY_OPTIONS: CityOptions = {
  accentColor: '#ff8800',
  secondaryColor: '#e52222',
  animSpeed: 'normal',
};

// ─── AI Tech style options ─────────────────────────────────────────────────────
export interface PetCoverConfig {
  enabled: boolean;
  position: 'bottom' | 'center' | 'full';
  imageUrl: string;
}

export const DEFAULT_PET_COVER_CONFIG: PetCoverConfig = {
  enabled: false,
  position: 'bottom',
  imageUrl: '',
};

// ─── AI Tech style options ─────────────────────────────────────────────────────
export interface AItechOptions {
  polyShape: PolyShape;
  accentColor: string;
  glowIntensity: 'off' | 'subtle' | 'normal' | 'strong';
  // ── Text style overrides (undefined = use theme defaults) ────────────────
  labelFontSize?: number;   // default 70 — big title inside card (golden)
  labelColor?: string;      // default '' = '#ffe655'
  shortFontSize?: number;   // default 48 — sub-title inside card
  shortColor?: string;      // default '' = rgba(255,255,255,0.98) (white)
  descFontSize?: number;    // default 42 — description outside card
  descColor?: string;       // default '' = rgba(255,168,48,0.97) (amber)
}

export const DEFAULT_AITECH_OPTIONS: AItechOptions = {
  polyShape: 'hexagon',
  accentColor: '#a855f7',
  glowIntensity: 'normal',
};

// ─── Nature style options ──────────────────────────────────────────────────────
export interface NatureOptions {
  accentColor: string;
  particleStyle: 'default' | 'snow' | 'rain' | 'petals';
}

export const DEFAULT_NATURE_OPTIONS: NatureOptions = {
  accentColor: '#4ade80',
  particleStyle: 'default',
};

// ─── Translation style options ─────────────────────────────────────────────────
export interface TranslationOptions {
  bgStyle: 'warm' | 'cool' | 'dark';
  highlightColor: string;  // "收到，扣1" highlight
}

export const DEFAULT_TRANSLATION_OPTIONS: TranslationOptions = {
  bgStyle: 'warm',
  highlightColor: '#ffe44d',
};

// ─── Manga style ──────────────────────────────────────────────────────────────
export interface MangaSegment {
  text: string;        // subtitle sentence (editable)
  scene: string;       // English scene description for image gen (editable)
  imageUrl: string;    // AI-generated image URL (filled after polling)
}

export interface MangaContent {
  segments: MangaSegment[];
  disclaimer: string;
}

export interface MangaOptions {
  disclaimer: string;
  subtitleFontSize: number;    // default 72
  slideDurationMs: number;     // ms per segment, default 4000
  ttsEnabled: boolean;         // enable voice narration during recording
  ttsVoice: string;            // Ark TTS voice ID (tts.ts TtsVoiceId)
}

export const DEFAULT_MANGA_OPTIONS: MangaOptions = {
  disclaimer: '仅代表个人观点，无任何不良导向',
  subtitleFontSize: 72,
  slideDurationMs: 4000,
  ttsEnabled: false,
  ttsVoice: 'xiao_xiao',
};

// ─── Content / generator ──────────────────────────────────────────────────────
export interface ContentPoint {
  label: string;
  short: string;
  desc: string;
  formatted: string;
}

export interface GeneratedContent {
  title: string;
  points: ContentPoint[];
}

export interface NatureContent {
  title: string;
  leftTitle: string;
  rightTitle: string;
  leftItems: string[];
  rightItems: string[];
  commonItems?: string[];
}

export interface GeneratorConfig {
  style: StyleType;
  coverIndex: number;
  text: string;
  chineseOptions: ChineseOptions;
  aiOptions?: AIOptions;
  natureContent?: NatureContent;
}

export interface ThemeConfig {
  bg: [string, string, string];
  accent: string;
  accent2: string;
  particle: string;
  gridColor: string;
}
