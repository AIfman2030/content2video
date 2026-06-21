// suno-callback: Receives webhook from sunoapi.org when generation completes
// Stores result in suno_tasks table for frontend polling

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ERROR_STATUSES = [
  'CREATE_TASK_FAILED',
  'GENERATE_AUDIO_FAILED',
  'CALLBACK_EXCEPTION',
  'SENSITIVE_WORD_ERROR',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json();
    console.log('[suno-callback] received:', JSON.stringify(body).slice(0, 500));

    const taskId   = body.taskId ?? body.task_id ?? body.data?.taskId;
    const status   = body.status ?? body.data?.status ?? 'UNKNOWN';
    const audioUrl = body.audioUrl ?? body.audio_url ??
                     body.response?.sunoData?.[0]?.audioUrl ??
                     body.data?.audioUrl ?? '';

    if (!taskId) {
      console.warn('[suno-callback] no taskId in payload');
      return new Response('ok', { headers: CORS }); // return 200 anyway
    }

    const supabaseUrl     = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(supabaseUrl, serviceRoleKey);

    const isError   = ERROR_STATUSES.includes(status);
    const isSuccess = status === 'SUCCESS';

    await db.from('suno_tasks').upsert({
      task_id:   taskId,
      status:    isSuccess ? 'SUCCESS' : (isError ? 'ERROR' : status),
      audio_url: isSuccess ? audioUrl : null,
      error_msg: isError ? `Generation failed: ${status}` : null,
      updated_at: new Date().toISOString(),
    });

    return new Response('ok', { headers: CORS });
  } catch (err) {
    console.error('[suno-callback] error:', err);
    return new Response('ok', { headers: CORS }); // always return 200 to sunoapi.org
  }
});
