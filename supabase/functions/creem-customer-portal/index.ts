import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const authorization = request.headers.get('Authorization');
  if (!authorization) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData } = await userClient.auth.getUser();
  if (!authData.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: membership } = await admin.from('memberships').select('provider_customer_id').eq('user_id', authData.user.id).maybeSingle();
  if (!membership?.provider_customer_id) return new Response(JSON.stringify({ error: 'No billing account' }), { status: 404, headers: corsHeaders });

  const apiKey = Deno.env.get('CREEM_API_KEY');
  const environment = Deno.env.get('CREEM_ENVIRONMENT') === 'production' ? 'production' : 'test';
  const baseUrl = environment === 'production' ? 'https://api.creem.io' : 'https://test-api.creem.io';
  const response = await fetch(`${baseUrl}/v1/customers/billing`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey || '', 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: membership.provider_customer_id }),
  });
  const result = await response.json();
  if (!response.ok || !result.customer_portal_link) return new Response(JSON.stringify({ error: 'Portal unavailable' }), { status: 502, headers: corsHeaders });
  return new Response(JSON.stringify({ url: result.customer_portal_link }), { headers: corsHeaders });
});
