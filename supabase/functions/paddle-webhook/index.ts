import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const encoder = new TextEncoder();

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return result === 0;
}

async function verifySignature(body: string, signature: string, secret: string) {
  const parts = Object.fromEntries(signature.split(';').map((part) => part.split('=')));
  if (!parts.ts || !parts.h1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.ts)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${parts.ts}:${body}`));
  return safeEqual(hex(digest), parts.h1);
}

function planFromPrice(priceId: string | undefined) {
  const plans = new Map([
    [Deno.env.get('PADDLE_PRICE_MONTHLY'), 'monthly'],
    [Deno.env.get('PADDLE_PRICE_QUARTERLY'), 'quarterly'],
    [Deno.env.get('PADDLE_PRICE_YEARLY'), 'yearly'],
    [Deno.env.get('PADDLE_PRICE_LIFETIME'), 'lifetime'],
  ]);
  return priceId ? plans.get(priceId) : undefined;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const body = await request.text();
  const signature = request.headers.get('paddle-signature') || '';
  const secret = Deno.env.get('PADDLE_WEBHOOK_SECRET') || '';
  if (!secret || !(await verifySignature(body, signature, secret))) return new Response('Invalid signature', { status: 401 });

  const event = JSON.parse(body);
  const data = event.data || {};
  const customData = data.custom_data || {};
  const userId = customData.user_id;
  const priceId = data.items?.[0]?.price?.id || data.items?.[0]?.price_id;
  // Never trust the plan name from browser-controlled custom data. The paid
  // Paddle price is the only source of truth for the entitlement granted.
  const planId = planFromPrice(priceId);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  if (event.event_type === 'transaction.completed' && userId && planId) {
    const lifetime = planId === 'lifetime';
    const { error } = await supabase.from('memberships').upsert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      provider_customer_id: data.customer_id,
      provider_subscription_id: data.subscription_id || null,
      provider_transaction_id: data.id,
      expires_at: lifetime ? null : data.billing_period?.ends_at || null,
      lifetime,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) return new Response(error.message, { status: 500 });
  }

  if (event.event_type?.startsWith('subscription.') && data.id) {
    const statusMap: Record<string, string> = { active: 'active', trialing: 'trialing', past_due: 'past_due', canceled: 'canceled', paused: 'canceled' };
    const { error } = await supabase.from('memberships').update({
      status: statusMap[data.status] || 'canceled',
      expires_at: data.current_billing_period?.ends_at || data.canceled_at || null,
      updated_at: new Date().toISOString(),
    }).eq('provider_subscription_id', data.id);
    if (error) return new Response(error.message, { status: 500 });
  }

  return new Response('ok');
});
