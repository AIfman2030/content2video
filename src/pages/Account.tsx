import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, LogOut, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteHeader from '@/components/commerce/SiteHeader';
import { useCommerce } from '@/contexts/commerce-context';
import { getPlan } from '@/commerce/plans';
import { supabase } from '@/integrations/supabase/client';

export default function Account() {
  const { user, membership, hasPaidAccess, isAdmin, loading, openAuth, signOut, refreshMembership } = useCommerce();
  const [params] = useSearchParams();
  const processing = params.get('payment') === 'processing';
  const resettingPassword = params.get('reset') === 'password';
  const [portalError, setPortalError] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');

  useEffect(() => {
    if (!processing || !user || membership) return;
    const timer = window.setInterval(() => void refreshMembership(), 2500);
    return () => window.clearInterval(timer);
  }, [processing, user, membership, refreshMembership]);

  if (loading) return <div className="commercial-page"><SiteHeader /><main className="account-page"><div className="account-skeleton" /></main></div>;
  if (!user) return <div className="commercial-page"><SiteHeader /><main className="account-page account-empty"><h1>登录后查看账户</h1><p>会员状态、续费时间和账单入口都会显示在这里。</p><button className="button button-primary" onClick={openAuth}>登录 / 注册</button></main></div>;

  const plan = getPlan(membership?.planId);
  const updatePassword = async () => {
    setPasswordNotice('');
    if (newPassword.length < 8) return setPasswordNotice('密码至少需要 8 位');
    if (newPassword !== confirmPassword) return setPasswordNotice('两次输入的密码不一致');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordNotice(error ? error.message : '密码已经更新，可以继续使用账户。');
  };
  const openPortal = async () => {
    setPortalError('');
    setPortalLoading(true);
    const { data, error } = await supabase.functions.invoke('paddle-customer-portal');
    setPortalLoading(false);
    if (error || !data?.url) {
      setPortalError(error?.message || '暂时无法打开账单管理，请稍后重试。');
      return;
    }
    window.location.assign(data.url);
  };
  return (
    <div className="commercial-page"><SiteHeader /><main className="account-page">
      {processing && !membership && <div className="processing-banner"><RefreshCw className="spin" size={17} /><span><strong>正在确认付款</strong>支付平台确认后会自动开通，请不要重复付款。</span></div>}
      {resettingPassword && <section className="password-reset-panel"><h2>设置新密码</h2><p>请输入至少 8 位的新密码。</p><label className="commerce-field"><span>新密码</span><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label><label className="commerce-field"><span>确认新密码</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>{passwordNotice && <div className="commerce-notice">{passwordNotice}</div>}<button className="button button-primary auth-submit" onClick={() => void updatePassword()}>保存新密码</button></section>}
      <div className="account-heading"><span className="account-avatar">{(user.email || 'U').slice(0, 1).toUpperCase()}</span><div><h1>我的账户</h1><p>{user.email}</p></div></div>
      <section className="membership-panel"><div><span className="panel-label">{isAdmin ? '账户权限' : '当前套餐'}</span><h2>{isAdmin ? '管理员账户' : hasPaidAccess && plan ? `${plan.name}会员` : '免费账户'}</h2><p>{isAdmin ? '拥有平台管理权限，不受普通会员套餐限制。' : hasPaidAccess && membership?.lifetime ? '永久权益，无自动续费' : hasPaidAccess && membership?.expiresAt ? `有效期至 ${new Date(membership.expiresAt).toLocaleDateString('zh-CN')}` : '浏览案例免费，导出视频需要开通会员。'}</p></div><span className={`membership-status${isAdmin || hasPaidAccess ? ' active' : ''}`}><CheckCircle2 size={14} />{isAdmin ? '管理员' : hasPaidAccess ? '已生效' : '未开通'}</span></section>
      <div className="account-actions">{isAdmin ? <Link to="/admin" className="account-action"><CreditCard size={20} /><span><strong>进入管理后台</strong><small>查看用户、会员和付款状态</small></span></Link> : membership ? <button className="account-action" onClick={() => void openPortal()} disabled={portalLoading}><CreditCard size={20} /><span><strong>{portalLoading ? '正在打开' : '管理订阅与账单'}</strong><small>修改付款方式、查看账单或取消续费</small></span></button> : <Link to="/pricing" className="account-action"><CreditCard size={20} /><span><strong>开通会员</strong><small>选择月度、季度、年度或永久版</small></span></Link>}<button className="account-action" onClick={() => void signOut()}><LogOut size={20} /><span><strong>退出登录</strong><small>退出当前账户</small></span></button></div>
      {portalError && <div className="commerce-error account-error" role="alert">{portalError}</div>}
    </main></div>
  );
}
