// suno-generate: Submit lyrics to sunoapi.org with webhook callback
// POST body: { lyrics, title?, style?, model? }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CALLBACK_URL = 'https://spb-t4ngxi6xsx650369.supabase.opentrust.net/functions/v1/suno-callback';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const apiKey = Deno.env.get('SUNO_API_KEY');
    if (!apiKey) throw new Error('SUNO_API_KEY not configured');

    const {
      lyrics,
      title  = 'RAP 视频',
      style  = 'chinese rap, hip hop, trap beat, male rapper, urban',
      model  = 'V3_5',   // cheapest model by default
    } = await req.json();

    if (!lyrics) throw new Error('lyrics is required');

    const res = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customMode:  true,
        style,
        title,
        prompt:      lyrics,
        instrumental: false,
        model,
        callBackUrl: CALLBACK_URL,
      }),
    });

    const json = await res.json();
    console.log('[suno-generate] sunoapi response:', JSON.stringify(json).slice(0, 400));

    // sunoapi.org uses { code: 200 } for success, or { error: "..." } / { code: 4xx } for failure
    const isOk = json.code === 200 || (!json.error && json.data?.taskId);
    if (!isOk) {
      throw new Error(json.msg || json.error || `sunoapi.org error: ${JSON.stringify(json)}`);
    }

    const taskId = json.data?.taskId;
    if (!taskId) throw new Error('No taskId returned from sunoapi.org');

    // Save initial PENDING state
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await db.from('suno_tasks').upsert({ task_id: taskId, status: 'PENDING', updated_at: new Date().toISOString() });

    return new Response(JSON.stringify({ taskId }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[suno-generate] error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
