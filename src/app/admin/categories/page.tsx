'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion as m, AnimatePresence } from 'framer-motion';
import { getAuthToken, apiGet, apiPost, apiDelete, clearAuthToken } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { router.push('/admin/login'); return; }
    loadCategories(token);
  }, [router]);

  async function loadCategories(token: string) {
    try {
      const data = await apiGet<Category[]>('/categories', token);
      setCategories(data);
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
      await apiPost('/categories', { ...form, slug }, token);
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', slug: '', description: '' });
      await loadCategories(token);
    } catch {
      alert('操作失败');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定删除此分类？相关文章的类别将被清空。')) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await apiDelete(`/categories?id=${id}`, token);
      await loadCategories(token);
    } catch {
      alert('删除失败');
    }
  }

  function startEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description });
    setShowForm(true);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text-cyan">📂 分类管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理文章分类，新建、编辑或删除分类</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', slug: '', description: '' }); setShowForm(true); }}
          className="btn-premium inline-block text-sm"
        >
          + 新建分类
        </button>
      </m.div>

      {/* 新建/编辑表单弹层 */}
      <AnimatePresence>
        {showForm && (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-heavy mb-8 rounded-2xl p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">
              {editing ? '编辑分类' : '新建分类'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
                  placeholder="例如：技术"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">Slug（URL 标识）</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
                  placeholder="例如：tech"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">描述</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
                  placeholder="简短描述"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-premium text-sm">
                  {editing ? '保存修改' : '创建分类'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="glass rounded-xl px-5 py-2 text-sm text-gray-500 hover:text-red-500"
                >
                  取消
                </button>
              </div>
            </form>
          </m.div>
        )}
      </AnimatePresence>

      {/* 分类列表 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-heavy rounded-2xl p-5">
              <div className="skeleton mb-2 h-5 w-32 rounded" />
              <div className="skeleton h-3 w-48 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, i) => (
            <m.div
              key={cat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-heavy flex items-center justify-between rounded-2xl p-5"
            >
              <div>
                <h3 className="font-semibold">{cat.name}</h3>
                <p className="mt-0.5 text-xs text-gray-400">
                  /{cat.slug} · {cat.description || '无描述'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(cat)}
                  className="glass-light rounded-lg px-3 py-1.5 text-xs text-accent transition hover:bg-accent/10"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="glass-light rounded-lg px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10"
                >
                  删除
                </button>
              </div>
            </m.div>
          ))}
          {categories.length === 0 && (
            <p className="py-12 text-center text-gray-400">还没有分类，创建一个吧 ✨</p>
          )}
        </div>
      )}
    </div>
  );
}
