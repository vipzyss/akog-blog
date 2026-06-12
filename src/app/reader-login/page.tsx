'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Magnetic from '@/components/anime/Magnetic';

export default function ReaderLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [inputCaptcha, setInputCaptcha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { refreshCaptcha(); }, []);

  const refreshCaptcha = async () => {
    try {
      const res = await fetch('/api/auth/captcha');
      const data = await res.json();
      setCaptchaId(data.id);
      setCaptchaCode(data.code);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) { setError('请输入英文用户名/邮箱和密码'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reader-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, captchaId, captchaCode: inputCaptcha }),
      });
      const data = await res.json();
      setLoading(false);

      if (data.token) {
        localStorage.setItem('reader_token', data.token);
        router.push('/');
      } else {
        setError(data.error || '登录失败');
        refreshCaptcha();
        setInputCaptcha('');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || '登录失败');
      refreshCaptcha();
      setInputCaptcha('');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-3xl font-black text-transparent">
              瞬云的尽头
            </span>
          </Link>
          <p className="mt-2 text-sm text-gray-500">读者账号登录</p>
        </div>

        <div className="glass-heavy rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl bg-red-500/10 px-4 py-2.5 text-center text-sm text-red-500"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">英文用户名或邮箱</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                placeholder="请输入英文用户名或邮箱"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                placeholder="请输入密码"
                required
              />
            </div>

            {/* 验证码 */}
            <div>
              <label className="mb-1 block text-sm font-medium">验证码</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCaptcha}
                  onChange={(e) => setInputCaptcha(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="glass w-1/2 rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                  placeholder="4 位数字"
                  required maxLength={4} pattern="[0-9]{4}"
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

            <Magnetic>
              <button
                type="submit"
                disabled={loading}
                className="glass-heavy w-full rounded-xl py-3 font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-50"
              >
                {loading ? '登录中...' : '🔐 登录'}
              </button>
            </Magnetic>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            还没有账号？{' '}
            <Link href="/register" className="text-accent hover:underline">
              立即注册
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          管理员登录请前往{' '}
          <Link href="/admin/login" className="text-accent hover:underline">
            后台登录
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
