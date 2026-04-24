# Cover Redesign Plan

## Context
User wants two changes to the cover generation system:
1. All covers: remove ALL text, add rainbow gradient border frame (reference image style), single colorful neon icon in lower-center (~1cm from bottom)
2. City covers: each of the 23 cities should have a unique landmark icon (currently all identical tower)

## Reference Design (from image)
- Pure black background (#000)
- Thick rainbow gradient rounded rectangle border (RGB neon glow going: magenta → red → yellow → green → cyan → blue → purple)
- Single large colorful neon line-art icon occupying lower 50% of canvas
- Zero text anywhere on the cover

## Canvas Dimensions
- 1080 × 1920 (9:16)
- 1cm from bottom ≈ 38px → icon bottom at y = 1882, icon center at y = 1580, icon radius ≈ 300

---

## Files to Create/Modify

### 1. `src/lib/cover/registry.ts` — add `drawRainbowBorder` helper
```ts
export function drawRainbowBorder(ctx, W, H, pad, bw, r): void
// Linear gradient: magenta→red→yellow→green→cyan→blue→purple
// Thick stroke with shadowBlur glow on drawRoundRect
// Double pass: outer thick stroke + inner faint glow ring
```

### 2. `src/lib/cover/city-landmarks.ts` — NEW file
Array of 24 drawing functions, one per city in CITY_SHAPES order:
```ts
export type LandmarkFn = (ctx, cx, cy, r) => void;
export const CITY_LANDMARKS: LandmarkFn[] = [ ... 24 functions ... ];
```
Each function draws a neon gradient line-art icon centered at (cx, cy) fitting within radius r.
Colors assigned per city (2-3 harmonious neon colors per icon):
- 0 Beijing: gate tower (Tiananmen style) — gold + red
- 1 Tianjin: Ferris wheel (Eye of Tianjin) — cyan + blue
- 2 Shijiazhuang: abstract skyscrapers — purple + magenta
- 3 Shenyang: pagoda (multi-tier) — orange + red
- 4 Changchun: modern dome — green + teal
- 5 Harbin: onion-dome church — blue + cyan
- 6 Shanghai: Oriental Pearl Tower (sphere on column) — purple + blue
- 7 Nanjing: pagoda tower — orange + yellow
- 8 Hangzhou: Leifeng Pagoda — teal + green
- 9 Hefei: arch bridge — pink + purple
- 10 Fuzhou: white pagoda — yellow + orange
- 11 Nanchang: 3-tiered pavilion — red + orange
- 12 Wuhan: Yellow Crane Tower (5-tier) — blue + cyan
- 13 Changsha: mountain + tower — red + orange
- 14 Guangzhou: Canton Tower (hyperboloid) — purple + magenta
- 15 Nanning: tropical leaves + tower — green + lime
- 16 Haikou: coconut palm + waves — teal + cyan
- 17 Chengdu: panda face circle — green + white
- 18 Kunming: lake + mountain — purple + blue
- 19 Lhasa: Potala Palace (tiered pyramid) — gold + red
- 20 Xi'an: Bell Tower (octagonal multi-roof) — gold + orange
- 21 Lanzhou: bridge over river — blue + cyan
- 22 Ürümqi: dome mosque + snowflake — white + blue
- 23 Chongqing: mountain city bridge — red + orange

File will be split into two if needed to stay ≤280 lines:
- `city-landmarks-a.ts` (cities 0–11)
- `city-landmarks-b.ts` (cities 12–23)

### 3. `src/lib/cover/chinese-cover.ts` — REWRITE
- Remove all text (drawTopBanner, drawItems, drawBg text)
- Black background
- drawRainbowBorder(ctx, W, H, 24, 14, 60)
- Draw Chinese pattern (circular coin/bagua motif with gradient stroke) at (W/2, 1580)
- Use gradient: gold → red → magenta for the dragon/coin icon

### 4. `src/lib/cover/city-cover.ts` — REWRITE
- Remove all text functions
- Black background
- drawRainbowBorder(ctx, W, H, 24, 14, 60)
- Import CITY_LANDMARKS from city-landmarks-a + city-landmarks-b
- Call CITY_LANDMARKS[coverIndex % 24](ctx, W/2, 1580, 300)
- Each landmark draws with its own colors (no accent passed in — self-colored)

### 5. `src/lib/cover/aitech-cover.ts` — REWRITE
- Remove all text
- Black background (keep dot grid for texture)
- drawRainbowBorder(ctx, W, H, 24, 14, 60)
- Draw polygon (sides = [3,4,5,6,8][coverIndex % 5]) with neon gradient at (W/2, 1580)
- Colors: use gradient from accent to accent2 with shadowBlur glow

### 6. `src/lib/cover/nature-cover.ts` — REWRITE
- Remove all text
- Dark green background
- drawRainbowBorder(ctx, W, H, 24, 14, 60)
- Draw two circles side-by-side with scenic spot silhouettes at (W/2, 1580)
- Left circle: accent color, right circle: accent2 color

---

## Icon Positioning (all covers)
```
ICON_CX = 540        (W/2)
ICON_CY = 1580       (H - 340, approximately 1cm from bottom with r=300)
ICON_R  = 300        (fits icon bottom at y=1880, ~2cm from canvas bottom)
```

## Rainbow Border Parameters
```
padding = 24px
borderWidth = 14px  
cornerRadius = 60px
Colors: #ff00cc → #ff4400 → #ffcc00 → #00ff88 → #00ccff → #4400ff → #ff00cc
glow: shadowColor='#ffffff', shadowBlur=18
```

## File Size Check
- `registry.ts`: ~70 lines (add ~14 lines for drawRainbowBorder) ✓
- `city-landmarks-a.ts`: ~150 lines (12 cities) ✓
- `city-landmarks-b.ts`: ~150 lines (12 cities) ✓  
- `chinese-cover.ts`: ~80 lines (simplified) ✓
- `city-cover.ts`: ~60 lines (simplified) ✓
- `aitech-cover.ts`: ~80 lines (simplified) ✓
- `nature-cover.ts`: ~90 lines (simplified) ✓

## Key Principle
**No text anywhere on any cover** — pure geometric/iconic visual design only.
The landmark icons should look like neon line-art drawn with gradient colored strokes on black, matching the reference image aesthetic.
