/**
 * manga-tts: TTS synthesis for manga subtitle recording.
 * Strategy: Try Ark TTS first (if apiKey provided), fall back to Google Translate TTS.
 * Both are plain HTTP — no WebSocket.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VOICE_MAP: Record<string, string> = {
  "xiao_xiao": "zh_female_wanwanxiaohe_moon_bigtts",
  "yun_xi":    "zh_male_M392_conversation_wvae_bigtts",
  "xiao_yi":   "zh_female_qingxin_moon_bigtts",
  "yun_jian":  "zh_male_guonan_moon_bigtts",
  "xiao_han":  "zh_female_cangjingkong_moon_bigtts",
};

/** Try ByteDance Ark TTS (requires user API key, model must be enabled in Ark console) */
async function arkTTS(text: string, voiceId: string, apiKey: string): Promise<ArrayBuffer> {
  const arkVoice = VOICE_MAP[voiceId] ?? VOICE_MAP["xiao_xiao"];
  const res = await fetch("https://ark.cn-beijing.volces.com/api/v3/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "doubao-tts",
      input: text,
      voice: arkVoice,
      response_format: "mp3",
    }),
  });
  const ct = res.headers.get("Content-Type") ?? "";
  if (!res.ok || ct.includes("application/json")) {
    let msg = `HTTP ${res.status}`;
    try { const e = await res.json(); msg = e?.error?.message ?? e?.message ?? msg; } catch (_) { /* ignore */ }
    throw new Error(msg);
  }
  return res.arrayBuffer();
}

/** Google Translate TTS — free, HTTP GET, no API key, supports zh-CN */
async function googleTTS(text: string): Promise<ArrayBuffer> {
  // Split into ≤200-char chunks (Google TTS limit)
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

  // Merge all chunks
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

  let text = "", voiceId = "xiao_xiao", apiKey = "";
  try {
    const b = await req.json();
    text    = String(b.text    ?? "").trim();
    voiceId = String(b.voiceId ?? b.voice ?? "xiao_xiao");
    apiKey  = String(b.apiKey  ?? "");
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

  // 1. Try Ark TTS (requires activated doubao-tts model in user's Ark console)
  if (apiKey) {
    try {
      const mp3 = await arkTTS(text, voiceId, apiKey);
      return new Response(mp3, {
        headers: { ...CORS, "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
      });
    } catch (e) {
      console.log("Ark TTS unavailable:", (e as Error).message, "— falling back to Google TTS");
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
