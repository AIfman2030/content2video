// manga-image-status — Poll task status from 即梦AI 4.0 (Volcengine cv service).
// Always returns HTTP 200.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  const now         = new Date();
  const dateStr     = now.toISOString().slice(0, 10).replace(/-/g, "");
  const datetimeStr = now.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";

  const queryStr         = `Action=${action}&Version=2022-08-31`;
  const payloadHash      = await sha256hex(bodyStr);
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-date:${datetimeStr}\n`;
  const signedHeaders    = "content-type;host;x-date";

  const canonicalRequest = ["POST", "/", queryStr, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope  = `${dateStr}/${region}/${service}/request`;
  const stringToSign     = ["HMAC-SHA256", datetimeStr, credentialScope, await sha256hex(canonicalRequest)].join("\n");

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const json = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const AK = Deno.env.get("JIMENG_ACCESS_KEY") ?? "";
    const SK = Deno.env.get("JIMENG_SECRET_KEY") ?? "";

    if (!AK || !SK) {
      return json({ code: -1, message: "即梦API密钥未配置" });
    }

    const { task_id } = await req.json();
    if (!task_id) return json({ code: -1, message: "task_id is required" });

    const body = JSON.stringify({
      req_key: "jimeng_t2i_v40",
      task_id,
      req_json: JSON.stringify({ return_url: true }),
    });

    const action  = "CVSync2AsyncGetResult";
    const headers = await buildVolcHeaders(AK, SK, action, body);

    const resp = await fetch(
      `https://visual.volcengineapi.com?Action=${action}&Version=2022-08-31`,
      { method: "POST", headers, body },
    );

    const rawText = await resp.text();
    console.log("[status] task_id:", task_id, "| HTTP:", resp.status, "| body:", rawText.slice(0, 200));

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawText);
    } catch {
      return json({ code: -1, message: `Non-JSON: ${rawText.slice(0, 200)}` });
    }

    return json(data);

  } catch (e) {
    console.error("[status] exception:", String(e));
    return json({ code: -1, message: String(e) });
  }
});
