import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, LoaderCircle, LockKeyhole, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCommerce } from '@/contexts/commerce-context';

type AuthMode = 'login' | 'register' | 'forgot';

function authMessage(message: string) {
  if (message.includes('Invalid login credentials')) return '邮箱或密码不正确';
  if (message.includes('Email not confirmed')) return '请先打开验证邮件完成邮箱验证';
  if (message.includes('User already registered')) return '这个邮箱已经注册，请直接登录';
  if (message.includes('Password should be')) return '密码至少需要 8 位';
  if (message.includes('rate limit')) return '操作太频繁，请稍后再试';
  return message || '操作失败，请稍后重试';
}

export default function AuthDialog() {
  const { authOpen, closeAuth, user } = useCommerce();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (user && authOpen) closeAuth();
  }, [authOpen, closeAuth, user]);

  if (!authOpen) return null;

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setNotice('');
    setPassword('');
    setConfirmPassword('');
  };

  const submit = async () => {
    setError('');
    setNotice('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('请输入有效的邮箱地址');
    if (mode !== 'forgot' && password.length < 8) return setError('密码至少需要 8 位');
    if (mode === 'register' && password !== confirmPassword) return setError('两次输入的密码不一致');

    setLoading(true);
    if (mode === 'login') {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) setError(authMessage(loginError.message));
    } else if (mode === 'register') {
      const { data, error: registerError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/account` } });
      if (registerError) setError(authMessage(registerError.message));
      else if (!data.session) setNotice('注册成功。请打开验证邮件，验证后即可登录。');
    } else {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/account?reset=password` });
      if (resetError) setError(authMessage(resetError.message));
      else setNotice('重置密码邮件已发送，请打开邮箱继续。');
    }
    setLoading(false);
  };

  const title = mode === 'login' ? '欢迎回来' : mode === 'register' ? '创建账户' : '重置密码';
  const description = mode === 'login' ? '登录后继续创作和管理会员。' : mode === 'register' ? '注册后即可保存作品并开通会员。' : '我们会向你的邮箱发送重置链接。';

  return (
    <div className="commerce-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.target === event.currentTarget && closeAuth()}>
      <div className="auth-dialog">
        <button className="modal-close" onClick={closeAuth} aria-label="关闭"><X size={18} /></button>
        <span className="auth-icon"><LockKeyhole size={22} /></span>
        {mode !== 'forgot' && <div className="auth-tabs" role="tablist" aria-label="账户操作"><button role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')}>登录</button><button role="tab" aria-selected={mode === 'register'} onClick={() => switchMode('register')}>注册</button></div>}
        <h2 id="auth-title">{title}</h2>
        <p>{description}</p>
        <label className="commerce-field"><span>邮箱地址</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></label>
        {mode !== 'forgot' && <label className="commerce-field"><span>密码</span><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 位" /></label>}
        {mode === 'register' && <label className="commerce-field"><span>确认密码</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次输入密码" /></label>}
        {error && <div className="commerce-error" role="alert">{error}</div>}
        {notice && <div className="commerce-notice" role="status"><CheckCircle2 size={16} />{notice}</div>}
        {!notice && <button className="button button-primary auth-submit" disabled={loading} onClick={() => void submit()}>{loading ? <><LoaderCircle className="spin" size={16} />处理中</> : mode === 'login' ? '登录' : mode === 'register' ? '注册' : '发送重置邮件'}</button>}
        {mode === 'login' && <button className="auth-text-button" onClick={() => switchMode('forgot')}>忘记密码？</button>}
        {mode === 'forgot' && <button className="auth-text-button" onClick={() => switchMode('login')}>返回登录</button>}
        {mode === 'register' && <small>注册即表示你同意 <Link to="/terms" onClick={closeAuth}>用户协议</Link>、<Link to="/privacy" onClick={closeAuth}>隐私政策</Link>和<Link to="/refund" onClick={closeAuth}>退款政策</Link>。</small>}
      </div>
    </div>
  );
}
