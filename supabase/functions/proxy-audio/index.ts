// proxy-audio: Server-side fetch for remote audio URLs (avoids browser CORS)
// GET ?url={encoded-url} → returns audio bytes

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url = new URL(req.url).searchParams.get('url');
  if (!url) {
    return new Response(JSON.stringify({ error: 'url param required' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(decodeURIComponent(url));
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);

    const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      headers: {
        ...CORS,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
