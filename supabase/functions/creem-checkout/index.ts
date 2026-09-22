import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const productForPlan = (planId: string) => ({
  monthly: Deno.env.get('CREEM_PRODUCT_MONTHLY'),
  quarterly: Deno.env.get('CREEM_PRODUCT_QUARTERLY'),
  yearly: Deno.env.get('CREEM_PRODUCT_YEARLY'),
  lifetime: Deno.env.get('CREEM_PRODUCT_LIFETIME'),
}[planId]);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  const authorization = request.headers.get('Authorization');
  if (!authorization) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData } = await userClient.auth.getUser();
  const user = authData.user;
  if (!user?.email) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

  const { planId } = await request.json();
  const productId = typeof planId === 'string' ? productForPlan(planId) : undefined;
  const apiKey = Deno.env.get('CREEM_API_KEY');
  if (!productId || !apiKey) return new Response(JSON.stringify({ error: '支付尚未配置，请联系管理员。' }), { status: 503, headers: corsHeaders });

  const environment = Deno.env.get('CREEM_ENVIRONMENT') === 'production' ? 'production' : 'test';
  const baseUrl = environment === 'production' ? 'https://api.creem.io' : 'https://test-api.creem.io';
  const appUrl = (Deno.env.get('APP_URL') || 'http://127.0.0.1:8080').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/v1/checkouts`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      request_id: `${user.id}_${planId}_${crypto.randomUUID()}`,
      customer: { email: user.email },
      success_url: `${appUrl}/account?payment=processing`,
      metadata: { user_id: user.id, plan_id: planId },
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.checkout_url) {
    console.error('Creem checkout failed', response.status, result?.message || result?.error || 'unknown');
    return new Response(JSON.stringify({ error: '暂时无法创建支付订单。' }), { status: 502, headers: corsHeaders });
  }
  return new Response(JSON.stringify({ url: result.checkout_url }), { headers: corsHeaders });
});
