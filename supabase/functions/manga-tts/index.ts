/**
 * manga-tts: TTS synthesis for manga subtitle recording.
 * Strategy:
 *   1. Try Alibaba Bailian DashScope CosyVoice (HTTP REST, compatible-mode)
 *   2. Fall back to Google Translate TTS (free, no key needed)
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Alibaba Bailian DashScope CosyVoice via OpenAI-compatible HTTP endpoint */
async function bailianTTS(
  text: string,
  voiceId: string,
  apiKey: string,
  rate: number,
): Promise<ArrayBuffer> {
  const res = await fetch(
    "https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "cosyvoice-v1",
        input: text,
        voice: voiceId,
        response_format: "mp3",
        speed: Math.max(0.5, Math.min(2.0, rate)),
      }),
    },
  );

  const ct = res.headers.get("Content-Type") ?? "";
  if (!res.ok || ct.includes("application/json")) {
    let msg = `HTTP ${res.status}`;
    try {
      const e = await res.json();
      msg = e?.error?.message ?? e?.message ?? e?.error ?? msg;
    } catch (_) { /* ignore */ }
    throw new Error(msg);
  }
  return res.arrayBuffer();
}

/** Google Translate TTS — free, HTTP GET, no API key, supports zh-CN */
async function googleTTS(text: string): Promise<ArrayBuffer> {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, 200));
    remaining = remaining.slice(200);
  }

  const buffers: ArrayBuffer[] = [];
  for (const chunk of chunks) {
    const url =
      "https://translate.googleapis.com/translate_tts" +
      "?ie=UTF-8&tl=zh-CN&client=gtx&ttsspeed=1&q=" +
      encodeURIComponent(chunk);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/",
      },
    });
    if (!res.ok) throw new Error(`Google TTS HTTP ${res.status}`);
    buffers.push(await res.arrayBuffer());
  }

  const total = buffers.reduce((s, b) => s + b.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const buf of buffers) {
    merged.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return merged.buffer;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  let text = "", voiceId = "longxiaochun", apiKey = "", rate = 1.0;
  try {
    const b = await req.json();
    text    = String(b.text    ?? "").trim();
    voiceId = String(b.voiceId ?? b.voice ?? "longxiaochun");
    apiKey  = String(b.apiKey  ?? "");
    rate    = Number(b.rate    ?? 1.0);
    if (isNaN(rate)) rate = 1.0;
  } catch (_) {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if (!text) {
    return new Response(JSON.stringify({ error: "empty text" }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // 1. Try Bailian DashScope CosyVoice (requires valid API key)
  if (apiKey) {
    try {
      const mp3 = await bailianTTS(text, voiceId, apiKey, rate);
      return new Response(mp3, {
        headers: { ...CORS, "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
      });
    } catch (e) {
      console.log("Bailian TTS unavailable:", (e as Error).message, "— falling back to Google TTS");
    }
  }

  // 2. Fallback: Google Translate TTS (free, no key, always available)
  try {
    const mp3 = await googleTTS(text);
    return new Response(mp3, {
      headers: { ...CORS, "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: `TTS failed: ${(e as Error).message}` }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
