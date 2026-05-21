/**
 * image-proxy: Fetches an external image and returns it as binary.
 * Used to bypass CORS restrictions when drawing external images onto Canvas.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const urlParam = new URL(req.url).searchParams.get("url");
  if (!urlParam) {
    return new Response(JSON.stringify({ error: "Missing ?url= parameter" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(urlParam);
    new URL(targetUrl); // validate URL
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const imgRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)",
        "Accept": "image/*,*/*",
      },
    });

    if (!imgRes.ok) {
      return new Response(JSON.stringify({ error: `Upstream HTTP ${imgRes.status}` }), {
        status: imgRes.status,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const contentType = imgRes.headers.get("Content-Type") ?? "image/jpeg";
    const data = await imgRes.arrayBuffer();

    return new Response(data, {
      headers: {
        ...CORS,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Content-Length": String(data.byteLength),
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
