'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion as m, AnimatePresence } from 'framer-motion';
import { api, getAdminToken } from '@/lib/api';

interface FriendLink {
  id: string;
  name: string;
  url: string;
  logo: string;
  sort: number;
  createdAt: string;
}

export default function FriendLinksAdminPage() {
  const router = useRouter();
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const token = typeof window !== 'undefined' ? getAdminToken() : '';

  // 新增/编辑表单
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', url: '', logo: '' });

  const loadLinks = useCallback(async () => {
    if (!token) { router.push('/admin/login'); return; }
    try {
      const data = await api.get<FriendLink[]>('/friend-links');
      setLinks(data);
    } catch (err: any) {
      if (String(err).includes('401')) router.push('/admin/login');
      else setMsg('加载失败');
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  const openNewForm = () => {
    setEditingId(null);
    setForm({ name: '', url: '', logo: '' });
    setShowForm(true);
  };

  const openEditForm = (link: FriendLink) => {
    setEditingId(link.id);
    setForm({ name: link.name, url: link.url, logo: link.logo });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!form.name || !form.url) {
      setMsg('请填写友链名称和链接');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put('/friend-links', { id: editingId, ...form }, token);
      } else {
        await api.post('/friend-links', form, token);
      }
      setShowForm(false);
      loadLinks();
    } catch (err: any) {
      setMsg(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条友链？')) return;
    try {
      await api.del(`/friend-links?id=${id}`, token);
      loadLinks();
    } catch (err: any) {
      setMsg(err.message || '删除失败');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* 面包屑 */}
      <div className="mb-6">
        <Link href="/admin/dashboard" className="text-sm text-gray-400 hover:text-accent">← 返回控制台</Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">🌐 友情链接</h1>
        <button
          onClick={openNewForm}
          className="glass-heavy rounded-xl px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/10"
        >
          ➕ 添加友链
        </button>
      </div>

      {msg && (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">
          {msg}
        </m.div>
      )}

      {/* 添加/编辑表单 */}
      <AnimatePresence>
        {showForm && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSave} className="glass-heavy mb-6 rounded-2xl p-6">
              <h3 className="mb-4 font-semibold">{editingId ? '编辑友链' : '添加友链'}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">友链名称 *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                    placeholder="例如：GitHub"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">友链 URL *</label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Logo 图片地址</label>
                  <input
                    type="url"
                    value={form.logo}
                    onChange={(e) => setForm({ ...form, logo: e.target.value })}
                    className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                    placeholder="https://example.com/logo.png（可选）"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="glass-heavy rounded-xl px-6 py-2 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '💾 保存'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl px-6 py-2 text-sm text-gray-400 hover:bg-white/10"
                >
                  取消
                </button>
              </div>
            </form>
          </m.div>
        )}
      </AnimatePresence>

      {/* 友链列表 */}
      {links.length === 0 ? (
        <div className="glass-heavy rounded-2xl py-16 text-center text-gray-400">
          <p className="text-4xl">🔗</p>
          <p className="mt-3">还没有友链，添加第一个吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div key={link.id} className="glass-heavy flex items-center gap-4 rounded-2xl p-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10">
                {link.logo ? (
                  <img src={link.logo} alt={link.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xl">🔗</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{link.name}</p>
                <p className="truncate text-xs text-gray-400">{link.url}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => openEditForm(link)}
                  className="rounded-lg px-3 py-1.5 text-xs text-accent hover:bg-white/10"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-white/10"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
