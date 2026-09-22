import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const encoder = new TextEncoder();

const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return result === 0;
}

async function verifySignature(body: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return safeEqual(hex(digest), signature);
}

function planForProduct(productId: string | undefined) {
  if (!productId) return undefined;
  const plans = [
    ['CREEM_PRODUCT_MONTHLY', 'monthly'],
    ['CREEM_PRODUCT_QUARTERLY', 'quarterly'],
    ['CREEM_PRODUCT_YEARLY', 'yearly'],
    ['CREEM_PRODUCT_LIFETIME', 'lifetime'],
  ] as const;
  return plans.find(([key]) => Deno.env.get(key) === productId)?.[1];
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const body = await request.text();
  const signature = request.headers.get('creem-signature') || '';
  const secret = Deno.env.get('CREEM_WEBHOOK_SECRET') || '';
  if (!secret || !(await verifySignature(body, signature, secret))) return new Response('Invalid signature', { status: 401 });

  const event = JSON.parse(body);
  const object = event.object || {};
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: handled } = await supabase.from('payment_webhook_events').select('id').eq('id', event.id).maybeSingle();
  if (handled) return new Response('ok');

  if (event.eventType === 'checkout.completed') {
    const userId = object.metadata?.user_id;
    const productId = object.product?.id || object.product;
    const planId = planForProduct(productId);
    if (userId && planId && object.order?.status === 'paid') {
      const lifetime = planId === 'lifetime';
      const subscription = object.subscription || {};
      const { error } = await supabase.from('memberships').upsert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        provider_customer_id: object.customer?.id || object.order?.customer || null,
        provider_subscription_id: subscription.id || null,
        provider_transaction_id: object.order?.id || object.id,
        expires_at: lifetime ? null : subscription.current_period_end_date || null,
        lifetime,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) return new Response(error.message, { status: 500 });
    }
  }

  if (event.eventType?.startsWith('subscription.') && object.id) {
    const futureEnd = object.current_period_end_date && new Date(object.current_period_end_date).getTime() > Date.now();
    const activeEvents = ['subscription.active', 'subscription.paid', 'subscription.trialing', 'subscription.update'];
    const status = activeEvents.includes(event.eventType) || (event.eventType === 'subscription.canceled' && futureEnd)
      ? (object.status === 'trialing' ? 'trialing' : 'active')
      : event.eventType === 'subscription.paused' ? 'past_due' : 'canceled';
    const { error } = await supabase.from('memberships').update({
      status,
      expires_at: object.current_period_end_date || null,
      provider_transaction_id: object.last_transaction_id || undefined,
      updated_at: new Date().toISOString(),
    }).eq('provider_subscription_id', object.id);
    if (error) return new Response(error.message, { status: 500 });
  }

  if ((event.eventType === 'refund.created' || event.eventType === 'dispute.created') && object.subscription?.id) {
    const { error } = await supabase.from('memberships').update({ status: 'canceled', expires_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('provider_subscription_id', object.subscription.id);
    if (error) return new Response(error.message, { status: 500 });
  }

  if ((event.eventType === 'refund.created' || event.eventType === 'dispute.created') && !object.subscription?.id && object.customer?.id) {
    const { error } = await supabase.from('memberships').update({ status: 'canceled', expires_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('provider_customer_id', object.customer.id).eq('lifetime', true);
    if (error) return new Response(error.message, { status: 500 });
  }

  const { error: eventError } = await supabase.from('payment_webhook_events').insert({ id: event.id, provider: 'creem', event_type: event.eventType });
  if (eventError?.code !== '23505' && eventError) return new Response(eventError.message, { status: 500 });

  return new Response('ok');
});
