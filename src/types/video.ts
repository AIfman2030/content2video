export type StyleType = 'chinese' | 'city' | 'aitech' | 'nature' | 'subtitle' | 'translation';
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
}

// ─── Subtitle style options ────────────────────────────────────────────────────
export type SubtitleEnterAnim =
  | 'slideUp'
  | 'slideLeft'
  | 'slideRight'
  | 'typewriter'
  | 'fadeIn';

export interface SubtitleOptions {
  titleText: string;           // account badge name (top-left)
  titleColor: string;          // hex — accent stripe + badge highlight
  accentColor: string;         // hex — even-line colour
  defaultTextColor: string;    // hex — odd-line colour (default #ffffff)
  fontSize: 'auto' | 'sm' | 'md' | 'lg';  // auto = adaptive, others set ceiling
  enterAnim: SubtitleEnterAnim;
  linesPerSlide: 1 | 2 | 3 | 4 | 5 | 6;  // max visual lines per page
}

export const DEFAULT_SUBTITLE_OPTIONS: SubtitleOptions = {
  titleText: '小福分享舍',
  titleColor: '#ffd700',
  accentColor: '#ffd700',
  defaultTextColor: '#ffffff',
  fontSize: 'auto',
  enterAnim: 'slideUp',
  linesPerSlide: 3,
};

// ─── City style options ────────────────────────────────────────────────────────
export interface CityOptions {
  accentColor: string;                     // warm highlight
  secondaryColor: string;                  // contrast (default red)
  animSpeed: 'slow' | 'normal' | 'fast';
}

export const DEFAULT_CITY_OPTIONS: CityOptions = {
  accentColor: '#ff8800',
  secondaryColor: '#e52222',
  animSpeed: 'normal',
};

// ─── AI Tech style options ─────────────────────────────────────────────────────
export interface AItechOptions {
  polyShape: PolyShape;
  accentColor: string;
  glowIntensity: 'off' | 'subtle' | 'normal' | 'strong';
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
