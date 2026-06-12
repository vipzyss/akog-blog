'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getAdminToken } from '@/lib/api';

interface GbMessage {
  id: string;
  author: string;
  content: string;
  approved: boolean;
  createdAt: string;
  readerId?: string;
}

export default function AdminGuestbookPage() {
  const router = useRouter();
  const [allMessages, setAllMessages] = useState<GbMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const token = typeof window !== 'undefined' ? getAdminToken() : '';

  const loadAll = useCallback(async () => {
    if (!token) { router.push('/admin/login'); return; }
    try {
      // 用原始的 getGuestbookMessages 获取全部（含未审核）
      const res = await fetch('/api/guestbook?all=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setAllMessages(data);
      else setAllMessages([]);
    } catch {
      setAllMessages([]);
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // 需要后端支持 all=true 参数
  // 当前后端 GET 只返回 approved，所以需要新增 all 参数
  // 先更新后端

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/guestbook?id=${id}&action=approve`, undefined, token);
      loadAll();
    } catch (err: any) { setMsg(err.message || '操作失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条留言？')) return;
    try {
      await api.del(`/guestbook?id=${id}`, token);
      loadAll();
    } catch (err: any) { setMsg(err.message || '删除失败'); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const pending = allMessages.filter((m) => !m.approved);
  const approved = allMessages.filter((m) => m.approved);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <Link href="/admin/dashboard" className="text-sm text-gray-400 hover:text-accent">← 返回控制台</Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold">💬 留言审核</h1>

      {msg && <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{msg}</div>}

      {/* 待审核 */}
      <h2 className="mb-3 font-semibold text-orange-400">⏳ 待审核 ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="mb-8 text-sm text-gray-400">暂无待审核留言</p>
      ) : (
        <div className="mb-8 space-y-3">
          {pending.map((m) => (
            <div key={m.id} className="glass-heavy rounded-2xl border-l-4 border-l-orange-400 p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-medium">{m.author}</span>
                <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{m.content}</p>
              <div className="flex gap-2">
                <button onClick={() => handleApprove(m.id)} className="rounded-lg bg-accent/10 px-3 py-1 text-xs text-accent hover:bg-accent/20">✅ 通过</button>
                <button onClick={() => handleDelete(m.id)} className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-400 hover:bg-red-500/20">🗑️ 删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 已审核 */}
      <h2 className="mb-3 font-semibold text-green-400">✅ 已通过 ({approved.length})</h2>
      {approved.length === 0 ? (
        <p className="text-sm text-gray-400">暂无已审核留言</p>
      ) : (
        <div className="space-y-3">
          {approved.map((m) => (
            <div key={m.id} className="glass-heavy rounded-2xl p-4">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{m.author}</span>
                  <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <button onClick={() => handleDelete(m.id)} className="text-xs text-red-400 hover:underline">删除</button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{m.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
