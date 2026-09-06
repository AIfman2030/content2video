import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, ShieldCheck, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import SiteHeader from '@/components/commerce/SiteHeader';
import { useCommerce } from '@/contexts/commerce-context';
import { supabase } from '@/integrations/supabase/client';
import { getPlan } from '@/commerce/plans';

type AccountRow = {
  user_id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  plan_id: string | null;
  membership_status: string | null;
  expires_at: string | null;
  lifetime: boolean | null;
};

export default function Admin() {
  const { user, isAdmin, loading, openAuth } = useCommerce();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    setFetching(true);
    supabase.rpc('admin_list_accounts').then(({ data, error: requestError }) => {
      setAccounts((data || []) as AccountRow[]);
      setError(requestError?.message || '');
      setFetching(false);
    });
  }, [isAdmin]);

  const activeCount = useMemo(() => accounts.filter((item) => item.membership_status === 'active' || item.lifetime).length, [accounts]);

  if (loading) return <div className="commercial-page"><SiteHeader /><main className="admin-page"><LoaderCircle className="spin" /></main></div>;
  if (!user) return <div className="commercial-page"><SiteHeader /><main className="account-page account-empty"><h1>请先登录管理员账户</h1><button className="button button-primary" onClick={openAuth}>登录</button></main></div>;
  if (!isAdmin) return <div className="commercial-page"><SiteHeader /><main className="account-page account-empty"><h1>无权访问管理后台</h1><p>该页面仅限平台管理员。</p><Link className="button button-secondary" to="/account">返回账户</Link></main></div>;

  return <div className="commercial-page"><SiteHeader /><main className="admin-page">
    <div className="admin-heading"><div><span className="panel-label">ADMIN CONSOLE</span><h1>平台管理后台</h1><p>用户注册、会员套餐与付款状态总览</p></div><span className="admin-badge"><ShieldCheck size={16} />管理员</span></div>
    <section className="admin-stats"><div><UsersRound size={18} /><span>注册用户</span><strong>{accounts.length}</strong></div><div><ShieldCheck size={18} /><span>有效会员</span><strong>{activeCount}</strong></div></section>
    <section className="admin-table-panel"><div className="admin-table-heading"><h2>全部账户</h2><span>{fetching ? '正在加载…' : `${accounts.length} 个账户`}</span></div>
      {error && <div className="commerce-error">{error}</div>}
      {!error && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>账户</th><th>注册时间</th><th>最近登录</th><th>套餐</th><th>状态</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.user_id}><td>{account.email || '未设置邮箱'}</td><td>{new Date(account.created_at).toLocaleDateString('zh-CN')}</td><td>{account.last_sign_in_at ? new Date(account.last_sign_in_at).toLocaleDateString('zh-CN') : '—'}</td><td>{account.plan_id ? getPlan(account.plan_id)?.name || account.plan_id : '免费'}</td><td><span className={`admin-state ${account.membership_status === 'active' || account.lifetime ? 'active' : ''}`}>{account.membership_status || '未开通'}</span></td></tr>)}</tbody></table>{!fetching && accounts.length === 0 && <p className="admin-empty">暂无账户数据</p>}</div>}
    </section>
  </main></div>;
}
