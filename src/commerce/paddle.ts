import { initializePaddle, type Paddle } from '@paddle/paddle-js';
import type { Plan } from './plans';

let paddlePromise: Promise<Paddle | undefined> | null = null;

export async function openPaddleCheckout(plan: Plan, user: { id: string; email?: string }) {
  const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
  if (!token || !plan.priceId) {
    throw new Error('支付尚未配置。请先填写 Paddle 客户端令牌和套餐 Price ID。');
  }

  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      token,
      environment: (import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox') === 'production' ? 'production' : 'sandbox',
    });
  }
  const paddle = await paddlePromise;
  if (!paddle) throw new Error('支付组件加载失败，请检查网络后重试。');

  paddle.Checkout.open({
    items: [{ priceId: plan.priceId, quantity: 1 }],
    customer: user.email ? { email: user.email } : undefined,
    customData: { user_id: user.id, plan_id: plan.id },
    settings: {
      displayMode: 'overlay',
      theme: 'dark',
      successUrl: `${window.location.origin}/account?payment=processing`,
    },
  });
}
