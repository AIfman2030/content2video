// mangaGenerator.ts
// Orchestrates AI script generation + parallel image generation for manga style.
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

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 60; // 2.5s * 60 = 2.5 min max

async function submitImageTask(prompt: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('manga-image-submit', {
      body: { prompt },
    });
    if (error || !data?.success || !data?.task_id) {
      console.error('Image submit failed:', error || data?.message);
      return null;
    }
    return data.task_id as string;
  } catch {
    return null;
  }
}

async function pollImageTask(taskId: string): Promise<string | null> {
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    try {
      const { data, error } = await supabase.functions.invoke('manga-image-status', {
        body: { task_id: taskId },
      });
      if (error) continue;
      if (data?.status === 'succeed' && data?.images?.[0]?.url) {
        return data.images[0].url as string;
      }
      if (data?.status === 'failed') return null;
    } catch {
      continue;
    }
  }
  return null;
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

  // ── Phase 2: Submit all image tasks in parallel ───────────────────────────
  const taskIds: (string | null)[] = await Promise.all(
    rawSegments.map(async (s, i) => {
      const taskId = await submitImageTask(s.scene);
      progressSegments[i].status = taskId ? 'generating' : 'error';
      onProgress({
        phase: 'images',
        total: rawSegments.length,
        done: progressSegments.filter(x => x.status === 'done').length,
        segments: [...progressSegments],
      });
      return taskId;
    })
  );

  // ── Phase 3: Poll all tasks (each resolves independently) ─────────────────
  await Promise.all(
    taskIds.map(async (taskId, i) => {
      if (!taskId) return;
      const url = await pollImageTask(taskId);
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
