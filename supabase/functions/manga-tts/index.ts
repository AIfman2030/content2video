// manga-tts — Microsoft Edge TTS proxy
// Free, no API key, high-quality Chinese neural voices.
// Connects to Edge TTS WebSocket, collects MP3 audio, returns as audio/mpeg.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function json200(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  let text = "", voice = "zh-CN-XiaoxiaoNeural", rate = "+0%", pitch = "+0Hz";
  try {
    const body = await req.json();
    text = String(body.text ?? "").trim();
    voice = String(body.voice ?? voice);
    rate = String(body.rate ?? rate);
    pitch = String(body.pitch ?? pitch);
  } catch {
    return json200({ error: "invalid JSON" });
  }

  if (!text) return json200({ error: "empty text" });

  const uuid = crypto.randomUUID().replace(/-/g, "");
  const ts = new Date().toISOString();
  const wsUrl =
    `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
    `?trustedclienttoken=${TRUSTED_TOKEN}&ConnectionId=${uuid}`;

  const audioChunks: Uint8Array[] = [];

  return new Promise<Response>((resolve) => {
    let settled = false;
    const done = (res: Response) => { if (!settled) { settled = true; resolve(res); } };

    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";

    const timer = setTimeout(() => {
      ws.close();
      done(json200({ error: "TTS timeout after 20s" }));
    }, 20_000);

    ws.onopen = () => {
      // 1. Config message
      ws.send(
        `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`
      );
      // 2. SSML request
      const ssml =
        `<speak version='1.0' xml:lang='zh-CN'>` +
        `<voice name='${escapeXml(voice)}'>` +
        `<prosody rate='${rate}' pitch='${pitch}'>${escapeXml(text)}</prosody>` +
        `</voice></speak>`;
      ws.send(
        `X-Timestamp:${ts}\r\nX-RequestId:${uuid}\r\n` +
        `Content-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`
      );
    };

    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        // Text frame — check for turn.end
        if (event.data.includes("Path:turn.end")) {
          clearTimeout(timer);
          ws.close();
          // Merge all audio chunks and return
          const total = audioChunks.reduce((s, c) => s + c.byteLength, 0);
          const merged = new Uint8Array(total);
          let offset = 0;
          for (const chunk of audioChunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
          done(new Response(merged.buffer, {
            status: 200,
            headers: { ...CORS, "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
          }));
        }
      } else {
        // Binary frame: [2-byte header-len][header-text][audio-bytes]
        const buf = event.data as ArrayBuffer;
        if (buf.byteLength < 2) return;
        const headerLen = new DataView(buf).getUint16(0);
        const audioStart = 2 + headerLen;
        if (buf.byteLength > audioStart) {
          audioChunks.push(new Uint8Array(buf.slice(audioStart)));
        }
      }
    };

    ws.onerror = () => {
      clearTimeout(timer);
      done(json200({ error: "WebSocket connection failed" }));
    };

    ws.onclose = () => { clearTimeout(timer); };
  });
});
