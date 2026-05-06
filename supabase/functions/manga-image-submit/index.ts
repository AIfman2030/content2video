// manga-image-submit — Submit a text-to-image task to 即梦AI (Volcengine cv service).
// Uses Volcengine HMAC-SHA256 request signing (similar to AWS SigV4).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Volcengine signing helpers ─────────────────────────────────────────────────
const enc = new TextEncoder();

async function sha256hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSHA256(key: ArrayBuffer | Uint8Array, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, enc.encode(msg));
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function buildVolcHeaders(
  ak: string, sk: string,
  action: string, bodyStr: string,
): Promise<Record<string, string>> {
  const service = "cv";
  const region  = "cn-north-1";
  const host    = "visual.volcengineapi.com";

  const now          = new Date();
  const dateStr      = now.toISOString().slice(0, 10).replace(/-/g, "");          // YYYYMMDD
  const datetimeStr  = now.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z"; // YYYYMMDDTHHmmssZ

  const queryStr         = `Action=${action}&Version=2022-08-31`;
  const payloadHash      = await sha256hex(bodyStr);
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-date:${datetimeStr}\n`;
  const signedHeaders    = "content-type;host;x-date";

  const canonicalRequest = ["POST", "/", queryStr, canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const credentialScope   = `${dateStr}/${region}/${service}/request`;
  const canonicalReqHash  = await sha256hex(canonicalRequest);
  const stringToSign      = ["HMAC-SHA256", datetimeStr, credentialScope, canonicalReqHash].join("\n");

  const kDate    = await hmacSHA256(enc.encode(sk), dateStr);
  const kRegion  = await hmacSHA256(kDate, region);
  const kService = await hmacSHA256(kRegion, service);
  const kSign    = await hmacSHA256(kService, "request");
  const sig      = toHex(await hmacSHA256(kSign, stringToSign));

  return {
    Authorization: `HMAC-SHA256 Credential=${ak}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`,
    "Content-Type": "application/json",
    Host: host,
    "X-Date": datetimeStr,
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const AK = Deno.env.get("JIMENG_ACCESS_KEY");
    const SK = Deno.env.get("JIMENG_SECRET_KEY");
    if (!AK || !SK) {
      return new Response(JSON.stringify({ success: false, message: "即梦API密钥未配置" }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { prompt } = await req.json();
    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ success: false, message: "prompt is required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const body = JSON.stringify({
      req_key: "jimeng_t2i_v40",
      prompt: prompt.trim(),
      width: 2560,
      height: 1440,
      force_single: true,
    });

    const action = "CVSync2AsyncSubmitTask";
    const headers = await buildVolcHeaders(AK, SK, action, body);

    const resp = await fetch(
      `https://visual.volcengineapi.com?Action=${action}&Version=2022-08-31`,
      { method: "POST", headers, body },
    );

    const data = await resp.json();
    console.log("jimeng submit resp:", JSON.stringify(data));

    if (data.code !== 10000) {
      return new Response(JSON.stringify({ success: false, message: data.message || "提交失败" }), {
        status: 502, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, task_id: data.data?.task_id }), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("manga-image-submit error:", e);
    return new Response(JSON.stringify({ success: false, message: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
