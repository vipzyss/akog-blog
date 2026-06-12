'use client';

import { useState, useEffect, useRef } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { loginAdmin, loginReader, registerReader } from '@/lib/api';

type AuthMode = 'login' | 'register';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 登录表单
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginCaptchaCode, setLoginCaptchaCode] = useState('');

  // 登录验证码
  const [captchaId, setCaptchaId] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');

  // 注册表单
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regVerifyCode, setRegVerifyCode] = useState('');

  // 验证码发送状态
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 倒计时清理
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const refreshCaptcha = async () => {
    try {
      const res = await fetch('/api/auth/captcha');
      const data = await res.json();
      setCaptchaId(data.id);
      setCaptchaCode(data.code);
    } catch {}
  };

  // 弹窗打开时刷新验证码
  useEffect(() => {
    if (isOpen && mode === 'login') refreshCaptcha();
  }, [isOpen, mode]);

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendVerificationCode = async () => {
    if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setError('请先输入正确的邮箱地址');
      return;
    }

    setError('');
    setSendingCode(true);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setCodeSent(true);
        startCountdown();
        setSuccess('验证码已发送，请检查邮箱');
        // 开发模式：控制台会打印验证码，API 响应也包含 code 字段
        if (data.code) {
          console.log('[开发模式] 验证码:', data.code);
        }
      } else {
        setError(data.error || '发送失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setSendingCode(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 尝试读者登录
      let result = await loginReader(loginIdentifier, loginPassword, captchaId, loginCaptchaCode);
      
      if (result.success) {
        onClose();
        window.location.reload();
        return;
      }

      // 尝试管理员登录
      result = await loginAdmin(loginIdentifier, loginPassword, captchaId, loginCaptchaCode);
      
      if (result.success) {
        onClose();
        window.location.reload();
        return;
      }

      setError(result.error || '登录失败，请检查信息');
      refreshCaptcha();
      setLoginCaptchaCode('');
    } catch (err: any) {
      setError(err.message || '登录失败');
      refreshCaptcha();
      setLoginCaptchaCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (regPassword !== regConfirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (regPassword.length < 6) {
      setError('密码长度至少 6 位');
      return;
    }

    if (!regVerifyCode) {
      setError('请输入邮箱验证码');
      return;
    }

    setLoading(true);

    try {
      const result = await registerReader({
        username: regUsername,
        displayName: regDisplayName || regUsername,
        email: regEmail,
        password: regPassword,
        verifyCode: regVerifyCode,
      });

      if (result.success) {
        setSuccess('注册成功！即将自动登录...');
        await loginReader(regUsername, regPassword);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1000);
      } else {
        setError(result.error || '注册失败');
      }
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError('');
    setSuccess('');
    setLoginIdentifier('');
    setLoginPassword('');
    setLoginCaptchaCode('');
    setRegUsername('');
    setRegDisplayName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegVerifyCode('');
    setCodeSent(false);
    setCountdown(0);
    refreshCaptcha();
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 登录卡片 — 含 3D 翻转 */}
          <m.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
            style={{ perspective: '1200px' }}
          >
            <div className="relative" style={{ minHeight: '720px' }}>
              {/* 关闭按钮 — 在 3D 空间外部 */}
              <button
                onClick={onClose}
                className="absolute -right-1 -top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white/70 backdrop-blur-sm transition hover:bg-black/40 hover:text-white"
              >
                ✕
              </button>

              {/* 3D 翻转容器 */}
              <m.div
                animate={{ rotateY: mode === 'register' ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full"
              >
                {/* ── 正面：登录 ── */}
                <div
                  className="glass-heavy flex w-full flex-col justify-center rounded-3xl border border-white/10 p-8 shadow-2xl"
                  style={{ backfaceVisibility: 'hidden', minHeight: '720px' }}
                >
                  <h2 className="mb-6 text-center text-2xl font-bold">欢迎回来</h2>

                  {error && (
                    <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</div>
                  )}
                  {success && (
                    <div className="mb-4 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-500">{success}</div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                        英文用户名或邮箱
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="请输入英文用户名或邮箱"
                        required
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder-gray-400 backdrop-blur-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                        密码
                      </label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="请输入密码"
                        required
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder-gray-400 backdrop-blur-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    {/* 验证码 */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                        验证码
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={loginCaptchaCode}
                          onChange={(e) => setLoginCaptchaCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="4 位数字"
                          required
                          maxLength={4}
                          pattern="[0-9]{4}"
                          className="w-1/2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder-gray-400 backdrop-blur-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        <button
                          type="button"
                          onClick={() => { refreshCaptcha(); setLoginCaptchaCode(''); }}
                          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-gray-500 transition hover:bg-white/10"
                        >
                          <span className="select-none font-bold tracking-[4px] text-accent">{captchaCode}</span>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="glass-heavy w-full rounded-xl py-3 font-medium text-accent transition hover:bg-accent/10 disabled:opacity-50"
                    >
                      {loading ? '登录中...' : '登录'}
                    </button>
                    <p className="text-center text-sm text-gray-500">
                      还没有账号？{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="text-accent hover:underline"
                      >
                        立即注册
                      </button>
                    </p>
                  </form>
                </div>

                {/* ── 背面：注册 ── */}
                <div
                  className="glass-heavy absolute inset-0 w-full rounded-3xl border border-white/10 p-8 shadow-2xl overflow-y-auto"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <h2 className="mb-6 text-center text-2xl font-bold">创建账号</h2>

                  {error && (
                    <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</div>
                  )}
                  {success && (
                    <div className="mb-4 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-500">{success}</div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                        英文用户名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase())}
                        placeholder="6-20 位英文字母、数字或下划线"
                        required
                        pattern="^[a-zA-Z0-9_]+$"
                        minLength={6}
                        maxLength={20}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder-gray-400 backdrop-blur-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                        显示名称
                      </label>
                      <input
                        type="text"
                        value={regDisplayName}
                        onChange={(e) => setRegDisplayName(e.target.value)}
                        placeholder="支持中文，留空则使用用户名"
                        maxLength={50}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder-gray-400 backdrop-blur-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                        邮箱 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="请输入邮箱"
                        required
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder-gray-400 backdrop-blur-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    {/* 验证码 */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                        邮箱验证码 <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={regVerifyCode}
                          onChange={(e) => setRegVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="6 位数字"
                          required
                          maxLength={6}
                          pattern="[0-9]{6}"
                          className="w-1/2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder-gray-400 backdrop-blur-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        <button
                          type="button"
                          onClick={sendVerificationCode}
                          disabled={countdown > 0 || sendingCode}
                          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-accent transition hover:bg-accent/10 disabled:opacity-50"
                        >
                          {sendingCode ? '发送中...' : countdown > 0 ? `${countdown} 秒后重发` : codeSent ? '重新发送' : '发送验证码'}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">验证码将发送到你的邮箱，5 分钟内有效</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                        密码 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="至少 6 位"
                        required
                        minLength={6}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder-gray-400 backdrop-blur-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                        确认密码 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="请再次输入密码"
                        required
                        minLength={6}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder-gray-400 backdrop-blur-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="glass-heavy w-full rounded-xl py-3 font-medium text-accent transition hover:bg-accent/10 disabled:opacity-50"
                    >
                      {loading ? '注册中...' : '注册'}
                    </button>
                    <p className="text-center text-sm text-gray-500">
                      已有账号？{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="text-accent hover:underline"
                      >
                        返回登录
                      </button>
                    </p>
                  </form>
                </div>
              </m.div>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
