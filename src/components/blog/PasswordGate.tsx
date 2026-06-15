'use client';

import { useState } from 'react';
import { motion as m } from 'framer-motion';

interface PasswordGateProps {
  postId: string;
  onUnlock: () => void;
  postTitle: string;
}

export default function PasswordGate({ postId, onUnlock, postTitle }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/posts/${postId}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        sessionStorage.setItem(`post_unlock_${postId}`, 'true');
        onUnlock();
      } else {
        setError('密码错误，请重试');
      }
    } catch {
      setError('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <m.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-md"
      >
        <div className="glass-heavy rounded-2xl p-8 text-center">
          <div className="mb-4 text-4xl">🔒</div>
          <h2 className="mb-2 text-xl font-bold">此文章需要密码</h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {postTitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入文章密码"
              autoFocus
              className="glass w-full rounded-xl px-4 py-3 text-center text-sm text-foreground outline-none placeholder-gray-400 focus:ring-2 focus:ring-accent/50"
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="btn-premium w-full text-sm disabled:opacity-50"
            >
              {loading ? '验证中...' : '解锁文章'}
            </button>
          </form>
        </div>
      </m.div>
    </div>
  );
}
