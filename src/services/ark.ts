// ark.ts — Direct browser calls to ByteDance Ark API (Doubao Seedream 4.5)
// No edge function needed — same pattern as deepseek.ts

const ARK_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
const ARK_LS_KEY = 'ark_api_key';
const ARK_MODEL = 'doubao-seedream-4-5-251128';

export function getStoredArkKey(): string {
  try { return localStorage.getItem(ARK_LS_KEY) ?? ''; }
  catch { return ''; }
}

export function setStoredArkKey(key: string) {
  try { localStorage.setItem(ARK_LS_KEY, key); }
  catch { /* ignore */ }
}

export async function generateArkImage(
  prompt: string,
  size = '2K',
): Promise<string> {
  const apiKey = getStoredArkKey();
  if (!apiKey) throw new Error('NO_ARK_KEY');

  const res = await fetch(ARK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: ARK_MODEL,
      prompt,
      sequential_image_generation: 'disabled',
      response_format: 'url',
      size,
      stream: false,
      watermark: false,
    }),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err?.error?.message ?? err?.message ?? msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  const data = await res.json();
  const url: string | undefined = (data?.data as Array<{ url: string }>)?.[0]?.url;
  if (!url) throw new Error('API 未返回图片 URL');
  return url;
}

/**
 * Build a prompt for the AI pet-character cover.
 * The Shiba Inu character's outfit and pose adapt to match the video title's theme.
 */
export function buildPetCoverPrompt(title: string): string {
  return (
    `An anthropomorphic Shiba Inu dog character wearing thematic costume that matches the topic "${title}", ` +
    `highly detailed 3D anime render, cinematic dramatic side-backlit lighting, ` +
    `character positioned in the lower 60% of frame, looking upward with confident cheerful expression, ` +
    `upper 40% of the image is clean atmospheric gradient sky with soft bokeh out-of-focus background, ` +
    `empty space at the top intentionally left for title text overlay, ` +
    `vibrant rich colors, sharp detailed fur texture, professional digital art, portrait 3:4`
  );
}
