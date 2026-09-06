export type PlanId = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  suffix: string;
  equivalent?: string;
  description: string;
  recurring: boolean;
  priceId?: string;
  featured?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: 'monthly',
    name: '月度',
    price: '¥29.9',
    suffix: '/ 月',
    description: '适合先体验完整功能',
    recurring: true,
    priceId: import.meta.env.VITE_PADDLE_PRICE_MONTHLY,
  },
  {
    id: 'quarterly',
    name: '季度',
    price: '¥59',
    suffix: '/ 季',
    equivalent: '约 ¥19.7 / 月',
    description: '最适合持续创作',
    recurring: true,
    priceId: import.meta.env.VITE_PADDLE_PRICE_QUARTERLY,
    featured: true,
  },
  {
    id: 'yearly',
    name: '年度',
    price: '¥219',
    suffix: '/ 年',
    equivalent: '约 ¥18.3 / 月',
    description: '适合稳定更新的创作者',
    recurring: true,
    priceId: import.meta.env.VITE_PADDLE_PRICE_YEARLY,
  },
  {
    id: 'lifetime',
    name: '永久',
    price: '¥299',
    suffix: '/ 一次',
    description: '创始用户限量权益',
    recurring: false,
    priceId: import.meta.env.VITE_PADDLE_PRICE_LIFETIME,
  },
];

export const getPlan = (planId: string | null | undefined) =>
  PLANS.find((plan) => plan.id === planId);
