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

export async function generateArkImage(prompt: string): Promise<string> {
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
      size: '2K',
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
