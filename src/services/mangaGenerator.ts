// mangaGenerator.ts
// Orchestrates AI script generation + parallel image generation for manga style.
// Uses Ark API (Doubao Seedream 4.5) — synchronous, no polling needed.
import { supabase } from '../integrations/supabase/client';
import { extractMangaScript } from './deepseek';
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

/** Call Ark API via edge function — returns image URL directly (synchronous). */
async function generateImage(prompt: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('manga-image-submit', {
      body: { prompt },
    });
    if (error) {
      console.error('Edge function error:', error);
      return null;
    }
    if (!data?.success || !data?.imageUrl) {
      console.error('Image generation failed:', data?.message ?? 'unknown error');
      return null;
    }
    return data.imageUrl as string;
  } catch (e) {
    console.error('generateImage exception:', e);
    return null;
  }
}

export async function generateMangaContent(
  inputText: string,
  onProgress: (p: GenerationProgress) => void,
  disclaimer = '仅代表个人观点，无任何不良导向',
): Promise<MangaContent> {
  // ── Phase 1: Extract script ────────────────────────────────────────────────
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

  // ── Phase 2: Generate all images in parallel (synchronous API, no polling) ─
  await Promise.all(
    rawSegments.map(async (s, i) => {
      progressSegments[i].status = 'generating';
      onProgress({
        phase: 'images',
        total: rawSegments.length,
        done: progressSegments.filter(x => x.status === 'done').length,
        segments: [...progressSegments],
      });

      const url = await generateImage(s.scene);
      progressSegments[i].imageUrl = url ?? '';
      progressSegments[i].status = url ? 'done' : 'error';

      onProgress({
        phase: 'images',
        total: rawSegments.length,
        done: progressSegments.filter(x => x.status === 'done').length,
        segments: [...progressSegments],
      });
    })
  );

  // Build final MangaContent
  const segments: MangaSegment[] = progressSegments.map(s => ({
    text: s.text,
    scene: s.scene,
    imageUrl: s.imageUrl,
  }));

  return { segments, disclaimer };
}
