// sunoRap.ts — Suno API integration for RAP music generation
// Uses the self-hosted suno-api at the configured base URL.

const SUNO_BASE_URL = 'https://suno-api-ecru-theta.vercel.app';

export interface SunoClip {
  id: string;
  status: 'pending' | 'queued' | 'processing' | 'streaming' | 'complete' | 'error';
  audio_url?: string;
  video_url?: string;
  title?: string;
  lyrics?: string;
}

export interface SunoGenerateOptions {
  lyrics: string;
  title?: string;
  style?: string;
}

const DEFAULT_STYLE = 'chinese rap, hip hop, trap beat, male rapper, urban';

/**
 * Submit a custom RAP song generation to Suno API.
 * Returns list of clip IDs immediately (async generation).
 */
async function submitRapGeneration(opts: SunoGenerateOptions): Promise<string[]> {
  const res = await fetch(`${SUNO_BASE_URL}/api/custom_generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: opts.style ?? DEFAULT_STYLE,
      lyrics: opts.lyrics,
      style: opts.style ?? DEFAULT_STYLE,
      title: opts.title ?? 'RAP 视频',
      make_instrumental: false,
      wait_audio: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => String(res.status));
    throw new Error(`Suno API 请求失败: ${err.slice(0, 200)}`);
  }

  const clips: SunoClip[] = await res.json();
  if (!Array.isArray(clips) || clips.length === 0) {
    throw new Error('Suno API 未返回任务');
  }
  return clips.map(c => c.id);
}

/**
 * Poll Suno API until the clip is ready.
 * Resolves with audio_url.
 * Throws on error or timeout (3 minutes).
 */
async function pollClip(clipId: string): Promise<string> {
  const POLL_INTERVAL_MS = 5000;
  const MAX_ATTEMPTS    = 36; // 36 × 5s = 3 minutes

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(`${SUNO_BASE_URL}/api/get?ids=${clipId}`).catch(() => null);
    if (!res || !res.ok) continue;

    const clips: SunoClip[] = await res.json().catch(() => []);
    const clip = clips.find(c => c.id === clipId);
    if (!clip) continue;

    if (clip.status === 'error') {
      throw new Error('Suno 生成失败，请重试');
    }

    if (
      (clip.status === 'streaming' || clip.status === 'complete') &&
      clip.audio_url
    ) {
      return clip.audio_url;
    }
  }

  throw new Error('Suno 生成超时（3分钟），请重试');
}

/**
 * High-level: generate a RAP song from lyrics, returns audio URL.
 * onStatus receives progress messages for UI display.
 */
export async function generateRapSong(
  lyrics: string,
  title?: string,
  onStatus?: (msg: string) => void,
): Promise<string> {
  onStatus?.('正在提交 RAP 生成请求…');
  const ids = await submitRapGeneration({ lyrics, title });

  onStatus?.('RAP 音乐生成中，约需 1-3 分钟…');
  // Take the first clip
  const audioUrl = await pollClip(ids[0]);
  onStatus?.('RAP 音乐生成完成');
  return audioUrl;
}

/**
 * Fetch a remote audio file via server-side proxy (avoids CORS restrictions on CDN URLs).
 * Falls back to direct fetch if proxy fails.
 */
export async function fetchAudioAsBuffer(url: string): Promise<ArrayBuffer> {
  const SUPABASE_URL = 'https://spb-t4ngxi6xsx650369.supabase.opentrust.net';
  const ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5neGk2eHN4NjUwMzY5IiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzY5MjgzNDAsImV4cCI6MjA5MjUwNDM0MH0.EHz1XRSbWC1AktqItCyzJ5uK5bTPVGEpsots4QJMHyI';

  // Try proxy first (server-side fetch, no CORS)
  const proxyUrl = `${SUPABASE_URL}/functions/v1/proxy-audio?url=${encodeURIComponent(url)}`;
  const proxyRes = await fetch(proxyUrl, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
  }).catch(() => null);

  if (proxyRes && proxyRes.ok) {
    return await proxyRes.arrayBuffer();
  }

  // Direct fetch fallback
  const directRes = await fetch(url).catch(() => null);
  if (directRes && directRes.ok) {
    return await directRes.arrayBuffer();
  }

  throw new Error(`无法下载 RAP 音频文件。请检查网络连接。`);
}
