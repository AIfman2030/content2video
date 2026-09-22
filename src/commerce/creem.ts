import { supabase } from '@/integrations/supabase/client';
import type { Plan } from './plans';

export async function openCreemCheckout(plan: Plan) {
  const { data, error } = await supabase.functions.invoke('creem-checkout', {
    body: { planId: plan.id },
  });

  if (error) throw new Error('暂时无法连接支付服务，请稍后重试。');
  if (!data?.url) throw new Error(data?.error || '支付尚未配置，请联系管理员。');
  window.location.assign(data.url);
}
