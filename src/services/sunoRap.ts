// sunoRap.ts — Suno RAP music generation via Supabase Edge Functions
// API key is stored server-side (SUNO_API_KEY secret) — never exposed to the browser.
// Third-party provider: sunoapi.org (handles Suno CAPTCHA/auth)

// These are publishable constants (safe to use in frontend code)
const SUPABASE_URL  = 'https://spb-t4ngxi6xsx650369.supabase.opentrust.net';
const ANON_KEY      = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5neGk2eHN4NjUwMzY5IiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzY5MjgzNDAsImV4cCI6MjA5MjUwNDM0MH0.EHz1XRSbWC1AktqItCyzJ5uK5bTPVGEpsots4QJMHyI';

const POLL_INTERVAL_MS = 5_000;
const MAX_ATTEMPTS     = 36; // 36 × 5s = 3 minutes max

function edgeFetch(path: string, options?: RequestInit) {
  return fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    ...options,
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      ...(options?.headers ?? {}),
    },
  });
}

/**
 * Generate a RAP song from lyrics using sunoapi.org (server-side API key).
 * Returns the CDN audio URL when complete.
 */
export async function generateRapSong(
  lyrics: string,
  title = 'RAP 视频',
  onStatus?: (msg: string) => void,
): Promise<string> {
  // ── Step 1: Submit generation ─────────────────────────────────────────────
  onStatus?.('正在提交 RAP 生成请求…');

  const genRes = await edgeFetch('suno-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lyrics,
      title,
      style: 'chinese rap, hip hop, trap beat, male rapper, urban',
    }),
  });

  const genJson = await genRes.json().catch(() => ({}));
  console.log('[sunoRap] generate response:', genJson);

  if (genJson.error) throw new Error(`RAP 生成失败: ${genJson.error}`);
  const taskId: string = genJson.taskId;
  if (!taskId) throw new Error('未返回 taskId，请检查 sunoapi.org 账号余额是否充足');

  // ── Step 2: Poll until SUCCESS ───────────────────────────────────────────
  onStatus?.('RAP 音乐生成中，约需 1-2 分钟…');

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    const pollRes = await edgeFetch(`suno-poll?taskId=${encodeURIComponent(taskId)}`).catch(() => null);
    if (!pollRes?.ok) continue;

    const result = await pollRes.json().catch(() => null);
    if (!result) continue;

    console.log(`[sunoRap] poll ${attempt + 1}/${MAX_ATTEMPTS}: status=${result.status}`);

    if (result.error) throw new Error(result.error);

    if (result.status === 'SUCCESS') {
      if (!result.audioUrl) throw new Error('生成成功但未返回音频 URL');
      onStatus?.('RAP 音乐生成完成！');
      return result.audioUrl;
    }
  }

  throw new Error('RAP 生成超时（3 分钟），请稍后重试');
}

/**
 * Fetch a remote audio file as ArrayBuffer.
 * Routes through proxy-audio Edge Function to avoid CDN CORS restrictions.
 */
export async function fetchAudioAsBuffer(url: string): Promise<ArrayBuffer> {
  // Try proxy first (server-side fetch, no CORS)
  const proxyRes = await edgeFetch(
    `proxy-audio?url=${encodeURIComponent(url)}`,
  ).catch(() => null);

  if (proxyRes?.ok) return await proxyRes.arrayBuffer();

  // Direct fallback
  const directRes = await fetch(url).catch(() => null);
  if (directRes?.ok) return await directRes.arrayBuffer();

  throw new Error('无法下载 RAP 音频，请检查网络连接');
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
