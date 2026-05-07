// mangaGenerator.ts — Orchestrates script + parallel image generation for manga style.
// Images are generated via direct browser fetch to Ark API (no edge function needed).
import { extractMangaScript } from './deepseek';
import { generateArkImage } from './ark';
import type { MangaContent, MangaSegment } from '../types/video';

export type SegmentStatus = 'pending' | 'generating' | 'done' | 'error';

export interface GenerationProgress {
  phase: 'script' | 'images';
  total: number;
  done: number;
  segments: Array<{
    text: string;
    scene: string;
    imageUrl: string;
    status: SegmentStatus;
  }>;
}

export async function generateMangaContent(
  inputText: string,
  onProgress: (p: GenerationProgress) => void,
  disclaimer = '仅代表个人观点，无任何不良导向',
): Promise<MangaContent> {
  // ── Phase 1: Extract subtitle script ──────────────────────────────────────
  onProgress({ phase: 'script', total: 0, done: 0, segments: [] });
  const rawSegments = await extractMangaScript(inputText);

  const progressSegments: GenerationProgress['segments'] = rawSegments.map(s => ({
    text: s.subtitle,
    scene: s.scene,
    imageUrl: '',
    status: 'pending' as SegmentStatus,
  }));

  onProgress({
    phase: 'images',
    total: rawSegments.length,
    done: 0,
    segments: [...progressSegments],
  });

  // ── Phase 2: Generate all images in parallel (direct Ark API call) ─────────
  await Promise.all(
    rawSegments.map(async (s, i) => {
      progressSegments[i].status = 'generating';
      onProgress({
        phase: 'images',
        total: rawSegments.length,
        done: progressSegments.filter(x => x.status === 'done').length,
        segments: [...progressSegments],
      });

      try {
        const url = await generateArkImage(s.scene);
        progressSegments[i].imageUrl = url;
        progressSegments[i].status = 'done';
      } catch (e) {
        console.error(`Image ${i} failed:`, e instanceof Error ? e.message : e);
        progressSegments[i].status = 'error';
      }

      onProgress({
        phase: 'images',
        total: rawSegments.length,
        done: progressSegments.filter(x => x.status === 'done').length,
        segments: [...progressSegments],
      });
    })
  );

  const segments: MangaSegment[] = progressSegments.map(s => ({
    text: s.text,
    scene: s.scene,
    imageUrl: s.imageUrl,
  }));

  return { segments, disclaimer };
}
