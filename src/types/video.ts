export type StyleType = 'chinese' | 'city' | 'aitech' | 'nature' | 'subtitle';
export type ColorScheme = 'ink' | 'cinnabar' | 'jade' | 'gold' | 'porcelain';
export type AnimMode = 'grid' | 'single';
export type PolyShape = 'triangle' | 'quad' | 'pentagon' | 'hexagon' | 'octagon' | 'star5' | 'decagon';

export interface AIOptions {
  polyShape: PolyShape;
}

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

export interface ChineseOptions {
  colorScheme: ColorScheme;
  borderWidth: 1 | 2 | 3 | 4;
  lineWidth: 1 | 2 | 3 | 4;
  animMode: AnimMode;
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
