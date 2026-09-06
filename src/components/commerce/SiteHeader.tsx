import { Film, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCommerce } from '@/contexts/commerce-context';

export default function SiteHeader() {
  const { user, hasPaidAccess, isAdmin, openAuth, signOut } = useCommerce();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="site-header">
      <Link to="/" className="site-brand" aria-label="AIfman 视频首页">
        <span className="site-brand-mark"><Film size={17} /></span>
        <span>AIfman 视频</span>
      </Link>
      <nav className="site-nav" aria-label="主导航">
        {isHome && <><a href="#styles">风格案例</a><a href="#pricing">价格</a></>}
        {!isHome && <Link to="/">首页</Link>}
        <Link to="/create">创作台</Link>
      </nav>
      <div className="site-actions">
        {user ? (
          <>
            {isAdmin && <Link className="account-link" to="/admin"><LayoutDashboard size={15} /><span>管理后台</span></Link>}
            <Link className="account-link" to="/account">
              <UserRound size={15} />
              <span>{isAdmin ? '管理员账户' : hasPaidAccess ? '会员账户' : '我的账户'}</span>
            </Link>
            <button className="icon-button" onClick={() => void signOut()} aria-label="退出登录" title="退出登录"><LogOut size={16} /></button>
          </>
        ) : <button className="button button-ghost" onClick={openAuth}>登录 / 注册</button>}
        {!hasPaidAccess && <Link className="button button-primary header-upgrade" to="/pricing">升级套餐</Link>}
      </div>
    </header>
  );
}
