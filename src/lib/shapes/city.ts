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

export function cityToSvg(id: string, color: string): string {
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
