'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion as m, AnimatePresence } from 'framer-motion';
import { getAuthToken, apiGet, apiPost, apiDelete, clearAuthToken } from '@/lib/api';

interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '' });
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { router.push('/admin/login'); return; }
    loadTags(token);
  }, [router]);

  async function loadTags(token: string) {
    try {
      const data = await apiGet<Tag[]>('/tags', token);
      setTags(data);
    } catch (err) {
      if (String(err).includes('401') || String(err).includes('未授权')) {
        clearAuthToken();
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    try {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-');
      await apiPost('/tags', { name: form.name, slug }, token);
      setShowForm(false);
      setForm({ name: '', slug: '' });
      await loadTags(token);
    } catch {
      alert('操作失败');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定删除此标签？')) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await apiDelete(`/tags?id=${id}`, token);
      await loadTags(token);
    } catch {
      alert('删除失败');
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text-cyan">🏷️ 标签管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理文章标签，新建或删除标签</p>
        </div>
        <button
          onClick={() => { setForm({ name: '', slug: '' }); setShowForm(true); }}
          className="btn-premium inline-block text-sm"
        >
          + 新建标签
        </button>
      </m.div>

      <AnimatePresence>
        {showForm && (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-heavy mb-8 rounded-2xl p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">新建标签</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
                  placeholder="例如：React"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
                  placeholder="例如：react"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-premium text-sm">创建标签</button>
                <button type="button" onClick={() => setShowForm(false)} className="glass rounded-xl px-5 py-2 text-sm text-gray-500 hover:text-red-500">取消</button>
              </div>
            </form>
          </m.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-24 rounded-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag, i) => (
            <m.div
              key={tag.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="glass-heavy group flex items-center gap-2 rounded-full px-4 py-2 text-sm"
            >
              <span>#{tag.name}</span>
              <button
                onClick={() => handleDelete(tag.id)}
                className="ml-1 opacity-0 transition group-hover:opacity-100 text-gray-400 hover:text-red-400"
              >
                ×
              </button>
            </m.div>
          ))}
          {tags.length === 0 && (
            <p className="py-12 w-full text-center text-gray-400">还没有标签，创建一个吧 🏷️</p>
          )}
        </div>
      )}
    </div>
  );
}
