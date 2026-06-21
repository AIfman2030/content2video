// suno-poll: Check suno_tasks DB for generation status
// GET ?taskId={id} → { status, audioUrl?, error? }
// DB is updated by suno-callback webhook from sunoapi.org

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const url    = new URL(req.url);
    const taskId = url.searchParams.get('taskId');
    if (!taskId) throw new Error('taskId is required');

    const supabaseUrl    = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await db
      .from('suno_tasks')
      .select('status, audio_url, error_msg')
      .eq('task_id', taskId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    // Task not found yet — still PENDING
    if (!data) {
      return new Response(JSON.stringify({ status: 'PENDING' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    if (data.status === 'SUCCESS') {
      return new Response(JSON.stringify({ status: 'SUCCESS', audioUrl: data.audio_url }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    if (data.status === 'ERROR') {
      return new Response(JSON.stringify({ status: 'ERROR', error: data.error_msg }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Still processing
    return new Response(JSON.stringify({ status: data.status }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[suno-poll] error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
