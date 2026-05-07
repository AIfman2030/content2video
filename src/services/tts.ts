// tts.ts — Microsoft Edge TTS via direct browser WebSocket
// Free, no API key needed. WebSocket bypasses CORS restrictions.
// Same service used by Microsoft Edge's "Read Aloud" feature.

const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const EDGE_TTS_WS = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?trustedclienttoken=${TRUSTED_TOKEN}`;

export const TTS_VOICES = [
  { id: 'zh-CN-XiaoxiaoNeural', label: '晓晓（女·温暖）' },
  { id: 'zh-CN-YunxiNeural',    label: '云希（男·活泼）' },
  { id: 'zh-CN-XiaoyiNeural',   label: '晓伊（女·少女）' },
  { id: 'zh-CN-YunjianNeural',  label: '云健（男·有力）' },
  { id: 'zh-CN-XiaohanNeural',  label: '晓涵（女·沉稳）' },
] as const;

export type TtsVoiceId = (typeof TTS_VOICES)[number]['id'];
export const DEFAULT_TTS_VOICE: TtsVoiceId = 'zh-CN-XiaoxiaoNeural';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Synthesize text via Edge TTS WebSocket (runs in browser, no edge function needed).
 * Returns raw MP3 bytes as ArrayBuffer. Rejects on error or timeout.
 */
export function synthesize(
  text: string,
  voice: string = DEFAULT_TTS_VOICE,
  rate = '+0%',
  pitch = '+0Hz',
): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const uuid = crypto.randomUUID().replace(/-/g, '');
    const ts = new Date().toISOString();
    const ws = new WebSocket(`${EDGE_TTS_WS}&ConnectionId=${uuid}`);
    ws.binaryType = 'arraybuffer';

    const audioChunks: Uint8Array[] = [];
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      ws.close();
      reject(new Error('TTS timeout (15s)'));
    }, 15_000);

    const done = (val: ArrayBuffer | Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (val instanceof Error) reject(val);
      else resolve(val);
    };

    ws.onopen = () => {
      const CRLF = '\r\n';
      // 1. Config message
      ws.send(
        'X-Timestamp:' + ts + CRLF +
        'Content-Type:application/json; charset=utf-8' + CRLF +
        'Path:speech.config' + CRLF + CRLF +
        '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}'
      );
      // 2. SSML request
      const ssml =
        "<speak version='1.0' xml:lang='zh-CN'>" +
        "<voice name='" + escapeXml(voice) + "'>" +
        "<prosody rate='" + rate + "' pitch='" + pitch + "'>" + escapeXml(text) + '</prosody>' +
        '</voice></speak>';
      ws.send(
        'X-Timestamp:' + ts + CRLF +
        'X-RequestId:' + uuid + CRLF +
        'Content-Type:application/ssml+xml' + CRLF +
        'Path:ssml' + CRLF + CRLF +
        ssml
      );
    };

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) {
          // Merge all audio chunks into one ArrayBuffer
          const total = audioChunks.reduce((s, c) => s + c.byteLength, 0);
          const merged = new Uint8Array(total);
          let offset = 0;
          for (const chunk of audioChunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
          ws.close();
          done(merged.buffer);
        }
      } else {
        // Binary frame: [uint16 header-len][header bytes][mp3 audio bytes]
        const buf = event.data as ArrayBuffer;
        if (buf.byteLength < 2) return;
        const headerLen = new DataView(buf).getUint16(0);
        const audioStart = 2 + headerLen;
        if (buf.byteLength > audioStart) {
          audioChunks.push(new Uint8Array(buf.slice(audioStart)));
        }
      }
    };

    ws.onerror = () => done(new Error('WebSocket connection failed'));
    ws.onclose = () => {
      if (!settled) done(new Error('WebSocket closed unexpectedly'));
    };
  });
}
