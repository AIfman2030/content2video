import { CHINESE_SVGS } from './shapes/chinese';
import { cityToSvg } from './shapes/city';
import { AI_SVGS } from './shapes/aitech';

export function getShapeSvg(
  style: 'chinese' | 'city' | 'aitech',
  shapeId: string,
  color = 'white',
  lineWidth = 1.5,
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
  lineWidth = 1.5,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const svg = getShapeSvg(style, shapeId, color, lineWidth);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = svgToDataUrl(svg);
  });
}
