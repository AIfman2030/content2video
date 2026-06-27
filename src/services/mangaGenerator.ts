// mangaGenerator.ts — Orchestrates script + parallel image generation for manga style.
// Images are generated via direct browser fetch to Ark API (no edge function needed).
import { extractMangaScript, extractRapScript } from './deepseek';
import { generateArkImage } from './ark';
import { generateRapSong } from './sunoRap';
import type { MangaContent, MangaSegment, MangaImageStyle } from '../types/video';
import { buildCharacterImagePrompt } from '../lib/engine/characterPrompts';

export type SegmentStatus = 'pending' | 'generating' | 'done' | 'error';

export interface GenerationProgress {
  phase: 'script' | 'images' | 'music';
  total: number;
  done: number;
  segments: Array<{
    text: string;
    scene: string;
    imageUrl: string;
    status: SegmentStatus;
  }>;
  musicStatus?: 'generating' | 'done' | 'error';
  musicMessage?: string;
}

export interface MangaGenerateOptions {
  disclaimer?: string;
  rapMode?: boolean;
  imageStyle?: MangaImageStyle;
}

export async function generateMangaContent(
  inputText: string,
  onProgress: (p: GenerationProgress) => void,
  disclaimerOrOpts: string | MangaGenerateOptions = '仅代表个人观点，无任何不良导向',
): Promise<MangaContent> {
  const opts: MangaGenerateOptions = typeof disclaimerOrOpts === 'string'
    ? { disclaimer: disclaimerOrOpts }
    : disclaimerOrOpts;
  const disclaimer = opts.disclaimer ?? '仅代表个人观点，无任何不良导向';
  const rapMode    = opts.rapMode ?? false;
  const imageStyle = opts.imageStyle ?? 'default';
  const useCharacterPrompt = imageStyle !== 'default';

  // ── Phase 1: Extract subtitle / RAP script ────────────────────────────────
  onProgress({ phase: 'script', total: 0, done: 0, segments: [] });
  const rawSegments = rapMode
    ? await extractRapScript(inputText)
    : await extractMangaScript(inputText);

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
        const prompt = useCharacterPrompt
          ? buildCharacterImagePrompt(s.scene, imageStyle)
          : s.scene;
        const url = await generateArkImage(prompt);
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

  // ── Phase 3 (RAP only): Generate Suno RAP song ────────────────────────────
  let rapAudioUrl: string | undefined;
  if (rapMode) {
    const allLyrics = rawSegments.map((s, i) => `[Verse ${i + 1}]\n${s.subtitle}`).join('\n\n');

    onProgress({
      phase: 'music',
      total: rawSegments.length,
      done: rawSegments.length,
      segments: [...progressSegments],
      musicStatus: 'generating',
      musicMessage: '正在提交 RAP 生成请求…',
    });

    try {
      rapAudioUrl = await generateRapSong(
        allLyrics,
        'RAP 视频',
        (msg) => onProgress({
          phase: 'music',
          total: rawSegments.length,
          done: rawSegments.length,
          segments: [...progressSegments],
          musicStatus: 'generating',
          musicMessage: msg,
        }),
      );

      onProgress({
        phase: 'music',
        total: rawSegments.length,
        done: rawSegments.length,
        segments: [...progressSegments],
        musicStatus: 'done',
        musicMessage: 'RAP 音乐生成完成',
      });
    } catch (e) {
      console.error('Suno RAP generation failed:', e);
      onProgress({
        phase: 'music',
        total: rawSegments.length,
        done: rawSegments.length,
        segments: [...progressSegments],
        musicStatus: 'error',
        musicMessage: e instanceof Error ? e.message : '音乐生成失败',
      });
      // Don't throw — continue with video-only (no music)
    }
  }

  return { segments, disclaimer, rapAudioUrl };
}

