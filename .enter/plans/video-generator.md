# Content Editor Feature Plan

## Context
Users want to manually specify what appears in each field of the video (title, label, short, desc),
not just rely on AI-generated content. The feature must be compatible with both modes:
- AI generates content → user can review & edit each field
- User skips AI → directly fills in a blank structured form

## Approach

### Two-phase content area in the left sidebar

**Phase 1 (no content yet): `ContentForm`**
- Existing textarea + "生成视频" button (unchanged)
- Add a small "手动填写" link at the bottom → creates empty GeneratedContent → switches to Phase 2

**Phase 2 (content exists): `ContentEditor`**
- Replaces ContentForm completely
- Shows all fields editable inline (live canvas update on each keystroke)
- "重新生成" button at top → clears content → goes back to Phase 1

### ContentEditor component fields by style

| Style | Fields shown per point |
|---|---|
| `chinese` / `city` / `aitech` | 关键词 (label) · 短句 (short) · 说明 (desc) |
| `subtitle` | 正文 (short only — one field per point) |
| `translation` | Title (CN sentence) + desc (EN translation), single point only |
| `nature` | Read-only notice (NatureContent is a different type, skip editor) |

Title field shown for all styles except `subtitle` (which has its own title).

Add/remove point buttons for multi-point styles. Min 1 point, max 12.

## Files to create / modify

### New: `src/components/ContentEditor.tsx`
```tsx
interface Props {
  content: GeneratedContent;
  style: StyleType;
  onChange: (c: GeneratedContent) => void;
  onReset: () => void;
}
```
- Top bar: "← 重新生成" button (calls onReset) + item count badge
- Title field (hidden for subtitle)
- Per-point fields based on style (see table above)
- "＋ 添加条目" at bottom (hidden for translation/nature)
- "×" delete button per point (if > 1 point)
- All inputs call onChange immediately for live preview

### Modify: `src/components/ContentForm.tsx`
- Add `onManual: () => void` prop
- Add "手动填写" text button below the generate button

### Modify: `src/pages/Index.tsx`
- Add `handleContentChange(c: GeneratedContent)` → `setContent(c)` (already drives canvas)
- Add `handleManual()` → creates empty GeneratedContent → `setContent(empty)` 
- Conditional render: `content ? <ContentEditor> : <ContentForm>`
- Pass `onReset={() => setContent(null)}` to ContentEditor

## Empty content structure (for manual mode)
```ts
const emptyContent = (style): GeneratedContent => ({
  title: '',
  points: style === 'translation'
    ? [{ label: '', short: '', desc: '', formatted: '' }]
    : [{ label: '', short: '', desc: '', formatted: '' },
       { label: '', short: '', desc: '', formatted: '' },
       { label: '', short: '', desc: '', formatted: '' }],
});
```

## Styling
- Match existing dark-panel aesthetic from ContentForm / StyleConfigPanel
- Use `rgba(255,255,255,0.04)` backgrounds, `rgba(255,255,255,0.1)` borders
- Accent color from `ACCENT_BY_STYLE[style]` for focus rings and buttons
- Compact: labels are tiny (10-11px), inputs are small (13px text)
- Each point in a rounded card with subtle border

## Verification
1. AI flow unchanged: paste text → generate → ContentEditor shows pre-filled → edit any field → canvas updates live
2. Manual flow: click "手动填写" → ContentEditor opens empty → fill fields → canvas updates live
3. "← 重新生成" clears editor and shows ContentForm again
4. All 6 styles render correctly in their respective editor modes
