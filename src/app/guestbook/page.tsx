'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { getReaderToken, getAdminToken } from '@/lib/api';

interface Message {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export default function GuestbookPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [loginType, setLoginType] = useState<string | null>(null);

  // 检查登录状态
  useEffect(() => {
    checkLogin();
    loadMessages();
  }, []);

  const checkLogin = async () => {
    const adminToken = getAdminToken();
    const readerToken = getReaderToken();
    const token = adminToken || readerToken;
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        setLoggedIn(true);
        setUserName(user.displayName || user.username);
        setLoginType(user.role === 'reader' ? 'reader' : 'admin');
      }
    } catch {}
  };

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/guestbook');
      setMessages(await res.json());
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setMsg('');

    try {
      const token = getReaderToken() || getAdminToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        setContent('');
        setMsg('留言已提交，等待管理员审核');
        loadMessages();
      } else {
        const data = await res.json();
        setMsg(data.error || '发布失败');
      }
    } catch {
      setMsg('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-3 text-center text-4xl font-bold gradient-text-cyan">💬 留言板</h1>
      <p className="mb-10 text-center text-gray-500">登录后即可留言，说点什么吧</p>

      {/* 发布区 */}
      <div className="glass-heavy mb-10 rounded-2xl p-6">
        {loggedIn ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                {userName?.[0]?.toUpperCase() || '?'}
              </span>
              <span className="text-sm font-medium">{userName}</span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                {loginType === 'admin' ? '站长' : '读者'}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你想说的话...（500 字以内）"
              maxLength={500}
              rows={3}
              className="glass w-full resize-none rounded-xl px-4 py-3 text-sm text-foreground placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-accent"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">{content.length}/500</span>
              <div className="flex items-center gap-2">
                {msg && <span className="text-xs text-red-400">{msg}</span>}
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="glass-heavy rounded-xl px-5 py-2 text-sm font-medium text-accent transition hover:bg-accent/10 disabled:opacity-40"
                >
                  {loading ? '发布中...' : '💬 留言'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="py-6 text-center">
            <p className="mb-2 text-gray-400">🔒 登录后才可以留言</p>
            <p className="text-sm text-gray-400">
              点击右上角
              <span className="mx-1 font-medium text-accent">登录 / 注册</span>
              后即可参与讨论
            </p>
          </div>
        )}
      </div>

      {/* 留言列表 */}
      <AnimatePresence>
        {messages.length === 0 ? (
          <div className="glass-heavy rounded-2xl py-16 text-center text-gray-400">
            <p className="text-4xl">💭</p>
            <p className="mt-3">还没有留言，登录后来说两句吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((item, i) => (
              <m.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-heavy rounded-2xl p-5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                    {item.author?.[0]?.toUpperCase() || '?'}
                  </span>
                  <span className="text-sm font-medium">{item.author}</span>
                  <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-300">{item.content}</p>
              </m.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
