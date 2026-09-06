import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const authorization = request.headers.get('Authorization');
  if (!authorization) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const { data: authData } = await userClient.auth.getUser();
  if (!authData.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: membership } = await admin.from('memberships').select('provider_customer_id').eq('user_id', authData.user.id).maybeSingle();
  if (!membership?.provider_customer_id) return new Response(JSON.stringify({ error: 'No billing account' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const environment = Deno.env.get('PADDLE_ENVIRONMENT') || 'sandbox';
  const baseUrl = environment === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';
  const response = await fetch(`${baseUrl}/customers/${membership.provider_customer_id}/portal-sessions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('PADDLE_API_KEY')}`, 'Content-Type': 'application/json' },
  });
  const result = await response.json();
  if (!response.ok) return new Response(JSON.stringify({ error: 'Portal unavailable' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  return new Response(JSON.stringify({ url: result.data?.urls?.general?.overview }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
