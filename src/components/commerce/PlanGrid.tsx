import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PLANS, type Plan } from '@/commerce/plans';
import { openPaddleCheckout } from '@/commerce/paddle';
import { useCommerce } from '@/contexts/commerce-context';

export default function PlanGrid({ compact = false }: { compact?: boolean }) {
  const { user, openAuth, membership, hasPaidAccess } = useCommerce();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const autoCheckoutStarted = useRef(false);

  const choosePlan = useCallback(async (plan: Plan) => {
    setError('');
    if (!user) {
      sessionStorage.setItem('pending-plan', plan.id);
      openAuth();
      return;
    }
    setPending(plan.id);
    try {
      await openPaddleCheckout(plan, { id: user.id, email: user.email });
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : '暂时无法打开支付页面');
    } finally {
      setPending(null);
    }
  }, [openAuth, user]);

  useEffect(() => {
    const planId = searchParams.get('plan');
    const plan = PLANS.find((item) => item.id === planId);
    if (!user || !plan || autoCheckoutStarted.current) return;
    autoCheckoutStarted.current = true;
    sessionStorage.removeItem('pending-plan');
    setSearchParams({}, { replace: true });
    void choosePlan(plan);
  }, [choosePlan, searchParams, setSearchParams, user]);

  return (
    <>
      <div className={`plan-grid${compact ? ' plan-grid-compact' : ''}`}>
        {PLANS.map((plan) => {
          const current = hasPaidAccess && membership?.planId === plan.id;
          return (
            <article className={`plan-card${plan.featured ? ' featured' : ''}`} key={plan.id}>
              {plan.featured && <span className="plan-badge">最受欢迎</span>}
              <h3>{plan.name}</h3>
              <div className="plan-price"><strong>{plan.price}</strong><span>{plan.suffix}</span></div>
              <p className="plan-equivalent">{plan.equivalent || plan.description}</p>
              <div className="plan-rule" />
              <div className="plan-benefit"><Check size={14} />全部已上线动画风格</div>
              <div className="plan-benefit"><Check size={14} />高清 MP4 导出</div>
              <div className="plan-benefit"><Check size={14} />{plan.recurring ? '自动续费，可随时管理' : '永久使用当前基础功能'}</div>
              <button className={`button ${plan.featured ? 'button-primary' : 'button-secondary'} plan-button`} disabled={current || pending === plan.id} onClick={() => void choosePlan(plan)}>
                {pending === plan.id ? <LoaderCircle className="spin" size={16} /> : current ? '当前套餐' : `选择${plan.name}`}
              </button>
            </article>
          );
        })}
      </div>
      {error && <div className="commerce-error pricing-error" role="alert">{error}</div>}
      <p className="pricing-note">支付方式由安全结账页根据国家、设备和套餐自动显示。永久版不包含无限 AI 调用额度。</p>
    </>
  );
}
