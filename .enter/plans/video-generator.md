# Plan: Manga Style — AI Image + Subtitle Video

## Context
User wants a new `'manga'` style that:
1. Takes input text → AI rewrites into punchy short subtitle sentences + scene descriptions
2. For each sentence, AI generates an anime/manga illustration (Seedream 4.5, 16:9)
3. Canvas renders: full-screen image (Ken-Burns) + bottom subtitle text + top-left disclaimer
4. All subtitle text is user-editable after generation

## User Decisions
- Image model: **Seedream 4.5** (`doubao/seedream-4.5`), 16:9, 2k
- One image per subtitle segment
- No TTS
- Text must be editable after AI generation

---

## Architecture Overview

### New Data Types (`src/types/video.ts`)
```typescript
export interface MangaSegment {
  text: string;        // subtitle sentence (editable)
  scene: string;       // scene description for image gen (editable)
  imageUrl: string;    // filled in after polling completes
}

export interface MangaContent {
  segments: MangaSegment[];
  disclaimer: string;  // top-left text, default: "仅代表个人观点，无任何不良导向"
}

export interface MangaOptions {
  disclaimer: string;
  subtitleFontSize: number;   // default 72
  slideDurationMs: number;    // ms per segment, default 4000
}

export const DEFAULT_MANGA_OPTIONS: MangaOptions = {
  disclaimer: '仅代表个人观点，无任何不良导向',
  subtitleFontSize: 72,
  slideDurationMs: 4000,
};
```
Add `'manga'` to `StyleType`.

---

## Phase 1: Backend (Edge Functions)

### `supabase/functions/manga-image-submit/index.ts`
- Accepts `{ prompt: string }`
- Calls `POST /code/api/v1/ai/images` with `X-Async: true`
  - model: `doubao/seedream-4.5`
  - type: `txt_2_img`
  - image_option: `{ ratio: "16:9", resolution: "2k", format: "jpg" }`
- Returns `{ success, task_id }`

### `supabase/functions/manga-image-status/index.ts`
- Accepts `{ task_id: string }`
- Calls `GET /code/api/v1/ai/tasks/:task_id`
- Returns task status + images array

Both follow the skill template pattern with CORS headers.

---

## Phase 2: AI Script Service

### `src/services/deepseek.ts` — add `extractMangaScript()`
New system prompt that converts input text into:
```json
{
  "segments": [
    { "subtitle": "但你要想在这个社会上", "scene": "young man looking determined in an office" }
  ]
}
```
Rules: 5–8 segments, subtitle ≤ 20 chars, scene in English for image gen.

---

## Phase 3: Canvas Engine

### `src/lib/engine/manga.ts`
```
mangaTotalMs(n, slideDurMs) = n * slideDurMs + 600  // +600 final fadeout
```

`drawMangaScene(ctx, elapsed, mangaContent, mangaOptions, images: HTMLImageElement[])`:

**Per segment rendering:**
- `segIdx = Math.floor(elapsed / slideDurMs)`
- `segElapsed = elapsed % slideDurMs`
- `TRANS_DUR = 500ms` (cross-fade at end of each slide)

**Image (Ken-Burns):**
- Scale: `lerp(1.0, 1.08, segElapsed / slideDurMs)` — slow zoom in
- Pan: slight horizontal shift per segment (alternate left/right based on `segIdx % 2`)
- Cover full canvas maintaining aspect ratio

**Cross-fade:**
- In last `TRANS_DUR` ms of a segment: draw next image at `alpha = (segElapsed - (slideDurMs - TRANS_DUR)) / TRANS_DUR`

**Subtitle text:**
- Bottom center, `y = CH - 120`
- Font: bold 72px, white, `textAlign: center`
- Drop shadow: `shadowBlur=12, shadowColor='rgba(0,0,0,0.85)'`
- Black stroke: `lineWidth=8, strokeStyle='rgba(0,0,0,0.6)'`
- Enter: slides up + fade-in during first 400ms
- Exit: fade-out during last 300ms

**Disclaimer:**
- Top-left, `x=60, y=50`, 28px, `rgba(255,255,255,0.65)`

### `src/lib/canvasEngine.ts` — wire up manga style
- Add `mangaContent?: MangaContent` param to `createAnimEngine`
- In `async createAnimEngine`: if `isManga`, load all image URLs as `HTMLImageElement[]`
- Add `isManga` render path in `render()` function
- Export `mangaTotalMs`

---

## Phase 4: Generation Flow Service

### `src/services/mangaGenerator.ts`
```typescript
interface GenerationProgress {
  phase: 'script' | 'images';
  total: number;
  done: number;
  segments: { text: string; scene: string; imageUrl: string; status: 'pending'|'generating'|'done'|'error' }[];
}

async function generateMangaContent(
  inputText: string,
  onProgress: (p: GenerationProgress) => void
): Promise<MangaContent>
```

Steps:
1. Call `extractMangaScript(text)` → segments array
2. Report phase = 'images'
3. For each segment, call `supabase.functions.invoke('manga-image-submit')` → taskId
4. Poll all tasks (2s interval), update progress as each resolves
5. Return `MangaContent` with all imageUrls filled

Uses `supabase` client from `@/integrations/supabase/client`.

---

## Phase 5: Components

### `src/components/MangaContentEditor.tsx`
- Prop: `{ content: MangaContent, onChange: (c: MangaContent) => void, onReset: () => void }`
- Per-segment card: image thumbnail (left) + editable subtitle text (right)
- "← 重新生成" button (calls onReset)
- Edit propagates immediately to canvas via onChange

### `src/components/MangaGenerationProgress.tsx`
- Prop: `{ progress: GenerationProgress }`
- Phase 1: single spinner "AI 正在优化文案…"
- Phase 2: grid of N segment status badges (pending/generating/done with image thumbnail)

### `src/pages/Index.tsx` changes
```typescript
const [mangaContent, setMangaContent] = useState<MangaContent | null>(null);
const [mangaProgress, setMangaProgress] = useState<GenerationProgress | null>(null);
const [mangaOptions, setMangaOptions] = useState<MangaOptions>(DEFAULT_MANGA_OPTIONS);
```

For manga style, the "内容配置" section shows:
- `mangaProgress !== null && mangaContent === null` → `<MangaGenerationProgress>`
- `mangaContent !== null` → `<MangaContentEditor>`
- else → `<ContentForm>` (with manga-specific placeholder)

`handleGenerateManga(text)`:
1. `setMangaProgress({ phase: 'script', total: 0, done: 0, segments: [] })`
2. Call `generateMangaContent(text, setMangaProgress)`
3. On success: `setMangaContent(result); setMangaProgress(null)`
   Also set `content = { title: '', points: [] }` so StudioCanvas is woken up
4. On error: show error

### `src/components/StudioCanvas.tsx` + `VideoGenerator.tsx`
- Add `mangaContent?: MangaContent` + `mangaOptions?: MangaOptions` props
- Pass to `createAnimEngine`

### `src/components/StyleSelector.tsx`
- Add `'manga'` entry with appropriate icon (e.g. `BookOpen`) and label "漫画字幕"

### `src/components/StyleConfigPanel.tsx`
- Add `MangaPanel` for `style === 'manga'`:
  - Disclaimer text field
  - Font size slider (48–100)
  - Slide duration slider (2000–6000ms)

---

## Canvas Image Loading in `createAnimEngine`

```typescript
// Inside createAnimEngine, after existing setup:
const isManga = style === 'manga';
let mangaImages: HTMLImageElement[] = [];
if (isManga && mangaContent) {
  mangaImages = await Promise.all(
    mangaContent.segments.map(s => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = s.imageUrl;
    }))
  );
}
```

---

## Files to Create
1. `supabase/functions/manga-image-submit/index.ts`
2. `supabase/functions/manga-image-status/index.ts`
3. `src/lib/engine/manga.ts`
4. `src/services/mangaGenerator.ts`
5. `src/components/MangaContentEditor.tsx`
6. `src/components/MangaGenerationProgress.tsx`

## Files to Modify
1. `src/types/video.ts` — add manga types + DEFAULT_MANGA_OPTIONS
2. `src/lib/canvasEngine.ts` — wire manga engine
3. `src/components/StudioCanvas.tsx` — pass mangaContent/Options
4. `src/components/VideoGenerator.tsx` — pass mangaContent/Options
5. `src/components/StyleSelector.tsx` — add manga option
6. `src/components/StyleConfigPanel.tsx` — add MangaPanel
7. `src/pages/Index.tsx` — full manga orchestration + state
8. `src/services/deepseek.ts` — add extractMangaScript()

---

## Verification
1. Select manga style → ContentForm shows manga-specific placeholder
2. Enter text → click 生成 → MangaGenerationProgress shows script phase then image phase
3. All images load → MangaContentEditor appears → canvas preview starts playing
4. Edit subtitle text → canvas updates in real-time
5. Click 重新生成 → clears content, shows ContentForm again
6. Canvas: images scroll with Ken-Burns, subtitles slide in at bottom, disclaimer top-left
7. Style config: disclaimer/font-size/slide-duration affect canvas in real-time
