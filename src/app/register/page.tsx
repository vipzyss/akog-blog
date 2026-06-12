'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Magnetic from '@/components/anime/Magnetic';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    verifyCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 验证码发送状态
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

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
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('请先输入正确的邮箱地址');
      return;
    }

    setError('');
    setSendingCode(true);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await res.json();

      if (res.ok) {
        setCodeSent(true);
        startCountdown();
        setError('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.username || !form.email || !form.password) {
      setError('请填写所有必填项');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      setError('用户名只能包含英文字母、数字和下划线');
      return;
    }
    if (form.username.length < 6 || form.username.length > 20) {
      setError('用户名长度需要在 6-20 个字符之间');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (form.password.length < 6) {
      setError('密码长度不少于 6 位');
      return;
    }
    if (!form.verifyCode) {
      setError('请输入邮箱验证码');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/auth/register', {
        username: form.username,
        displayName: form.displayName || form.username,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        verifyCode: form.verifyCode,
      });
      setLoading(false);

      if (data.token) {
        localStorage.setItem('reader_token', data.token);
        setSuccess(true);
        setTimeout(() => router.push('/'), 1500);
      } else {
        setError(data.error || '注册失败');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || '注册失败');
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-heavy rounded-3xl p-10 text-center"
        >
          <div className="mb-4 text-5xl">🎉</div>
          <h2 className="text-2xl font-bold">注册成功！</h2>
          <p className="mt-2 text-gray-500">正在跳转回首页...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-3xl font-black text-transparent">
              瞬云的尽头
            </span>
          </Link>
          <p className="mt-2 text-sm text-gray-500">创建你的读者账号</p>
        </div>

        {/* 注册表单 */}
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
              <label className="mb-1 block text-sm font-medium">用户名（英文，用于登录）</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                placeholder="shunyun"
                pattern="[a-zA-Z0-9_]+"
                title="只能包含英文字母、数字和下划线"
                required
              />
              <p className="mt-1 text-xs text-gray-400">只能包含英文字母、数字和下划线，6-20 位</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">显示名称（支持中文）</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                placeholder="瞬云（留空则使用用户名）"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">邮箱</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                placeholder="请输入邮箱"
                required
              />
            </div>

            {/* 验证码 */}
            <div>
              <label className="mb-1 block text-sm font-medium">邮箱验证码</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.verifyCode}
                  onChange={(e) => setForm({ ...form, verifyCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="glass w-1/2 rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                  placeholder="6 位数字"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={countdown > 0 || sendingCode}
                  className="glass-heavy flex-1 rounded-xl px-3 py-3 text-sm font-medium text-accent transition hover:bg-accent/10 disabled:opacity-50"
                >
                  {sendingCode
                    ? '发送中...'
                    : countdown > 0
                    ? `${countdown} 秒后重发`
                    : codeSent
                    ? '重新发送'
                    : '发送验证码'}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">验证码将发送到你的邮箱，5 分钟内有效</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">密码</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                placeholder="不少于 6 位"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">确认密码</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                placeholder="再次输入密码"
                required
              />
            </div>

            <Magnetic>
              <button
                type="submit"
                disabled={loading}
                className="glass-heavy w-full rounded-xl py-3 font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-50"
              >
                {loading ? '注册中...' : '🚀 注册'}
              </button>
            </Magnetic>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            已有账号？{' '}
            <Link href="/reader-login" className="text-accent hover:underline">
              立即登录
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
