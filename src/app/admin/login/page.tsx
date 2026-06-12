'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { setAdminToken, getAdminToken, clearAdminToken } from '@/lib/api';

export default function AdminLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [inputCaptcha, setInputCaptcha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // 已登录则直接跳转（验证角色是否为 admin）
  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'admin') {
          router.push('/admin/dashboard');
          return;
        }
        // 非 admin 角色的 token 清除掉
        clearAdminToken();
      } catch {
        clearAdminToken();
      }
    }
    refreshCaptcha();
  }, [router]);

  const refreshCaptcha = async () => {
    try {
      const res = await fetch('/api/auth/captcha');
      const data = await res.json();
      setCaptchaId(data.id);
      setCaptchaCode(data.code);
    } catch {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, captchaId, captchaCode: inputCaptcha }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '登录失败');
        refreshCaptcha();
        setInputCaptcha('');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setAdminToken(data.token);
      router.push('/admin/dashboard');
    } catch {
      setError('网络错误，请重试');
      refreshCaptcha();
      setInputCaptcha('');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-heavy w-full max-w-md rounded-2xl p-8"
      >
        <div className="mb-8 text-center">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-2 text-3xl font-bold gradient-text-cyan"
          >
            管理后台
          </motion.h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            仅管理员可登录 · 普通用户请使用前台登录
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
            >
              {error}
            </motion.p>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
              用户名 / 邮箱
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="glass w-full rounded-xl px-4 py-3 text-foreground outline-none transition focus:ring-2 focus:ring-accent"
              placeholder="请输入用户名或邮箱"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass w-full rounded-xl px-4 py-3 text-foreground outline-none transition focus:ring-2 focus:ring-accent"
              placeholder="输入密码"
              required
            />
          </div>

          {/* 验证码 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">验证码</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCaptcha}
                onChange={(e) => setInputCaptcha(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="glass w-1/2 rounded-xl px-4 py-3 text-foreground outline-none transition focus:ring-2 focus:ring-accent"
                placeholder="4 位数字"
                required
                maxLength={4}
                pattern="[0-9]{4}"
              />
              <button
                type="button"
                onClick={() => { refreshCaptcha(); setInputCaptcha(''); }}
                className="glass flex items-center gap-1.5 rounded-xl px-3 py-3 text-sm text-gray-500 transition hover:bg-white/10"
              >
                <span className="select-none font-bold tracking-[6px] text-accent">{captchaCode}</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading || !identifier || !password}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-premium w-full text-center disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                验证中...
              </span>
            ) : (
              '登  录'
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          管理员登录 · 请输入用户名和密码
        </p>
      </motion.div>
    </div>
  );
}
