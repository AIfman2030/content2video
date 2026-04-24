import type { StyleType, ColorScheme, ThemeConfig, ChineseOptions } from '../types/video';

// ─── Color Schemes (Chinese theme) ────────────────────────────────────────────
export const COLOR_SCHEMES: Record<ColorScheme, { primary: string; secondary: string; tertiary: string }> = {
  ink: { primary: '#c0c0c0', secondary: '#8b8b8b', tertiary: '#4a4a4a' },
  cinnabar: { primary: '#e74c3c', secondary: '#f39c12', tertiary: '#c0392b' },
  jade: { primary: '#1abc9c', secondary: '#27ae60', tertiary: '#16a085' },
  gold: { primary: '#f0c040', secondary: '#d4a017', tertiary: '#8b6914' },
  porcelain: { primary: '#2980b9', secondary: '#ecf0f1', tertiary: '#2c3e50' },
};

// ─── Theme Configs ─────────────────────────────────────────────────────────────
export function getThemeConfig(style: StyleType, chineseOptions?: ChineseOptions): ThemeConfig {
  if (style === 'chinese') {
    const scheme = COLOR_SCHEMES[chineseOptions?.colorScheme ?? 'cinnabar'];
    return {
      bg: ['#0a0a14', '#12121f', '#1a1a2e'],
      accent: scheme.primary,
      accent2: scheme.secondary,
      particle: scheme.primary,
      gridColor: scheme.primary,
    };
  }
  if (style === 'city') {
    return {
      bg: ['#0d1b2a', '#1a2a4a', '#0f1c30'],
      accent: '#f5d87a',
      accent2: '#c8a240',
      particle: '#f5d87a',
      gridColor: '#f5d87a',
    };
  }
  if (style === 'nature') {
    return {
      bg: ['#060e06', '#0d1a0e', '#111f12'],
      accent: '#4ade80',
      accent2: '#86efac',
      particle: '#4ade80',
      gridColor: '#4ade80',
    };
  }
  // aitech
  return {
    bg: ['#080c14', '#0f172a', '#1e1b4b'],
    accent: '#a855f7',
    accent2: '#06b6d4',
    particle: '#a855f7',
    gridColor: '#06b6d4',
  };
}

// ─── Shape Metadata ────────────────────────────────────────────────────────────
export interface ShapeItem {
  id: string;
  label: string;
  group: string;
}

export const CHINESE_SHAPES: ShapeItem[] = [
  // 自然
  { id: 'mountain', label: '水墨山水', group: '自然' },
  { id: 'koi', label: '锦鲤波浪', group: '自然' },
  { id: 'bamboo', label: '竹石图', group: '自然' },
  { id: 'crane', label: '仙鹤云纹', group: '自然' },
  { id: 'lotus', label: '荷花蜻蜓', group: '自然' },
  // 纹样
  { id: 'cloud', label: '祥云瑞气', group: '纹样' },
  { id: 'taichi', label: '太极八卦', group: '纹样' },
  { id: 'swastika', label: '万字纹', group: '纹样' },
  { id: 'meander', label: '回纹边框', group: '纹样' },
  { id: 'icecrack', label: '冰裂纹', group: '纹样' },
  { id: 'knot', label: '盘长结', group: '纹样' },
  // 瑞兽
  { id: 'dragon', label: '龙纹', group: '瑞兽' },
  { id: 'opera', label: '京剧脸谱', group: '瑞兽' },
  { id: 'toad', label: '金蟾', group: '瑞兽' },
  { id: 'magpie', label: '喜鹊登梅', group: '瑞兽' },
  // 器物
  { id: 'guqin', label: '古琴', group: '器物' },
  { id: 'tile', label: '瓦当纹', group: '器物' },
  { id: 'lantern', label: '灯笼纹', group: '器物' },
  { id: 'ruyi', label: '玉如意', group: '器物' },
  // 几何
  { id: 'coin', label: '铜钱纹', group: '几何' },
  { id: 'papercut', label: '窗花剪纸', group: '几何' },
  { id: 'jade', label: '玉佩纹', group: '几何' },
  { id: 'heaven', label: '天圆地方', group: '几何' },
  { id: 'bagua', label: '八卦阵', group: '几何' },
];

export const CITY_SHAPES: ShapeItem[] = [
  // 华北东北
  { id: 'beijing', label: '北京', group: '华北东北' },
  { id: 'tianjin', label: '天津', group: '华北东北' },
  { id: 'shijiazhuang', label: '石家庄', group: '华北东北' },
  { id: 'shenyang', label: '沈阳', group: '华北东北' },
  { id: 'changchun', label: '长春', group: '华北东北' },
  { id: 'harbin', label: '哈尔滨', group: '华北东北' },
  // 华东
  { id: 'shanghai', label: '上海', group: '华东' },
  { id: 'nanjing', label: '南京', group: '华东' },
  { id: 'hangzhou', label: '杭州', group: '华东' },
  { id: 'hefei', label: '合肥', group: '华东' },
  { id: 'fuzhou', label: '福州', group: '华东' },
  { id: 'nanchang', label: '南昌', group: '华东' },
  // 华中华南
  { id: 'wuhan', label: '武汉', group: '华中华南' },
  { id: 'changsha', label: '长沙', group: '华中华南' },
  { id: 'guangzhou', label: '广州', group: '华中华南' },
  { id: 'nanning', label: '南宁', group: '华中华南' },
  { id: 'haikou', label: '海口', group: '华中华南' },
  // 西南西北
  { id: 'chengdu', label: '成都', group: '西南西北' },
  { id: 'kunming', label: '昆明', group: '西南西北' },
  { id: 'lhasa', label: '拉萨', group: '西南西北' },
  { id: 'xian', label: '西安', group: '西南西北' },
  { id: 'lanzhou', label: '兰州', group: '西南西北' },
  { id: 'urumqi', label: '乌鲁木齐', group: '西南西北' },
  { id: 'chongqing', label: '重庆', group: '西南西北' },
];

export const AI_SHAPES: ShapeItem[] = [
  // 大模型
  { id: 'chatgpt', label: 'ChatGPT', group: '大模型' },
  { id: 'claude', label: 'Claude', group: '大模型' },
  { id: 'gemini', label: 'Gemini', group: '大模型' },
  { id: 'deepseek', label: 'DeepSeek', group: '大模型' },
  // AI工具
  { id: 'midjourney', label: 'Midjourney', group: 'AI工具' },
  { id: 'stablediff', label: 'StableDiff', group: 'AI工具' },
  { id: 'dalle', label: 'DALL·E', group: 'AI工具' },
  { id: 'sora', label: 'Sora', group: 'AI工具' },
  // 搜索代码
  { id: 'perplexity', label: 'Perplexity', group: '搜索代码' },
  { id: 'cursor', label: 'Cursor', group: '搜索代码' },
  { id: 'copilot', label: 'Copilot', group: '搜索代码' },
  { id: 'grok', label: 'Grok', group: '搜索代码' },
  // 开源模型
  { id: 'llama', label: 'LLaMA', group: '开源模型' },
  { id: 'gemma', label: 'Gemma', group: '开源模型' },
  { id: 'mistral', label: 'Mistral', group: '开源模型' },
  { id: 'qwen', label: 'Qwen', group: '开源模型' },
  // 中国AI
  { id: 'kimi', label: 'Kimi', group: '中国AI' },
  { id: 'doubao', label: '豆包', group: '中国AI' },
  { id: 'wenxin', label: '文心一言', group: '中国AI' },
  { id: 'tongyi', label: '通义千问', group: '中国AI' },
  { id: 'xunfei', label: '讯飞星火', group: '中国AI' },
  // 科技公司
  { id: 'nvidia', label: 'NVIDIA', group: '科技公司' },
  { id: 'tesla', label: 'Tesla', group: '科技公司' },
  { id: 'apple', label: 'Apple', group: '科技公司' },
];

export const NATURE_PAIRS: ShapeItem[] = [
  { id: 'pair0', label: '黄山 | 西湖', group: '名山胜水' },
  { id: 'pair1', label: '泰山 | 九寨沟', group: '名山胜水' },
  { id: 'pair2', label: '张家界 | 桂林', group: '名山胜水' },
  { id: 'pair3', label: '峨眉山 | 三峡', group: '名山胜水' },
  { id: 'pair4', label: '长城 | 雪山', group: '名山胜水' },
  { id: 'pair5', label: '武夷山 | 青海湖', group: '名山胜水' },
];

export function getShapeList(style: StyleType): ShapeItem[] {
  if (style === 'chinese') return CHINESE_SHAPES;
  if (style === 'city') return CITY_SHAPES;
  if (style === 'nature') return NATURE_PAIRS;
  return AI_SHAPES;
}
