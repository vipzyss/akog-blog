'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion as m, AnimatePresence } from 'framer-motion';
import Magnetic from '@/components/anime/Magnetic';
import { getAdminToken, clearAdminToken, api } from '@/lib/api';

interface UserItem {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  role: string;
  createdAt: string;
  accountType: 'admin' | 'reader';
  avatar?: string;
}

type TabType = 'all' | 'admin' | 'reader';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [readers, setReaders] = useState<UserItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 正在编辑的用户（弹窗模式）
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', email: '', password: '', role: '' });

  const fetchUsers = async () => {
    try {
      const data = await api.get<{ users: UserItem[]; readers: UserItem[]; total: number }>(
        '/admin/users',
        getAdminToken(),
      );
      setUsers(data.users || []);
      setReaders(data.readers || []);
    } catch (err: any) {
      if (String(err).includes('401') || String(err).includes('未授权')) {
        clearAdminToken();
        router.push('/admin/login');
      }
    }
  };

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { router.push('/admin/login'); return; }
    fetchUsers();
  }, [router]);

  const displayList = (() => {
    if (activeTab === 'admin') return users;
    if (activeTab === 'reader') return readers;
    return [...users, ...readers];
  })();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.username || !form.email || !form.password) {
      setError('请填写所有必填项');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      setError('用户名只能包含英文字母、数字和下划线');
      return;
    }
    if (form.username.length < 3 || form.username.length > 20) {
      setError('用户名长度需要在 3-20 个字符之间');
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/users', {
        username: form.username,
        displayName: form.displayName,
        email: form.email,
        password: form.password,
      }, getAdminToken());
      setSuccess(`用户「${form.username}」创建成功（普通用户组）`);
      setForm({ username: '', displayName: '', email: '', password: '' });
      setShowForm(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, username: string, accountType: 'admin' | 'reader') => {
    const label = accountType === 'reader' ? `读者「${username}」` : `用户「${username}」`;
    if (!confirm(`确定删除${label}吗？${accountType === 'reader' ? '其留言记录将保留但无法再登录。' : ''}`)) return;
    setError('');
    setSuccess('');
    try {
      await api.del(`/admin/users?id=${id}&type=${accountType}`, getAdminToken());
      setSuccess(`${label}已删除`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || '删除失败');
    }
  };

  // 打开编辑弹窗
  const startEdit = (u: UserItem) => {
    setEditingUser(u);
    setEditForm({
      displayName: u.displayName || '',
      email: u.email,
      password: '',
      role: u.accountType === 'reader' ? 'reader' : u.role,
    });
    setError('');
    setSuccess('');
  };

  // 关闭编辑弹窗
  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({ displayName: '', email: '', password: '', role: '' });
  };

  // 保存编辑
  const handleEdit = async () => {
    if (!editingUser) return;
    if (!editForm.displayName.trim() && !editForm.email.trim()) {
      setError('请填写显示名称或邮箱');
      return;
    }

    try {
      await api.put('/admin/users', {
        id: editingUser.id,
        type: editingUser.accountType,
        displayName: editForm.displayName,
        email: editForm.email,
        password: editForm.password || undefined,
        role: editForm.role !== editingUser.role ? editForm.role : undefined,
      }, getAdminToken());

      setSuccess(`「${editingUser.username}」信息已更新`);
      cancelEdit();
      fetchUsers();
    } catch (err: any) {
      setError(err.message || '更新失败');
    }
  };

  const formatDate = (s: string) => {
    return new Date(s).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: '全部账号', count: users.length + readers.length },
    { key: 'admin', label: '管理组', count: 1 },
    { key: 'reader', label: '普通用户组', count: readers.length + users.filter(u => u.role !== 'admin').length },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* 顶部 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin/dashboard" className="text-sm text-accent hover:underline">
              ← 返回仪表盘
            </Link>
            <h1 className="mt-2 text-3xl font-bold">👥 用户管理</h1>
            <p className="mt-1 text-sm text-gray-500">
              管理员组：仅 shunyun（全站最高权限） · 普通用户组：其余账号（浏览/搜索/评论）
            </p>
          </div>
          <Magnetic>
            <button
              onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); cancelEdit(); }}
              className="glass-heavy rounded-xl px-5 py-2.5 font-medium text-accent transition hover:bg-accent/10"
            >
              {showForm ? '取消' : '+ 新建用户'}
            </button>
          </Magnetic>
        </div>

        {/* 提示信息 */}
        {error && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500"
          >
            {error}
            <button onClick={() => setError('')} className="float-right text-lg leading-none opacity-50 hover:opacity-100">×</button>
          </m.div>
        )}
        {success && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-500"
          >
            {success}
            <button onClick={() => setSuccess('')} className="float-right text-lg leading-none opacity-50 hover:opacity-100">×</button>
          </m.div>
        )}

        {/* 新建后台用户表单 */}
        {showForm && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 overflow-hidden"
          >
            <form onSubmit={handleCreate} className="glass-heavy rounded-2xl p-6">
              <h2 className="mb-4 text-lg font-semibold">新建用户</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">用户名（英文，用于登录）</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="glass w-full rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent"
                    placeholder="shunyun"
                    pattern="[a-zA-Z0-9_]+"
                    title="只能包含英文字母、数字和下划线"
                  />
                  <p className="mt-1 text-xs text-gray-400">只能包含英文字母、数字和下划线，3-20 位</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">显示名称（支持中文）</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="glass w-full rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent"
                    placeholder="瞬云（留空则使用用户名）"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">邮箱</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="glass w-full rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent"
                    placeholder="请输入邮箱"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">密码</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="glass w-full rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent"
                    placeholder="请输入密码"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-4 glass-heavy w-full rounded-xl py-2.5 font-medium text-accent transition hover:bg-accent/10 disabled:opacity-50"
              >
                {loading ? '创建中...' : '✅ 创建用户'}
              </button>
            </form>
          </m.div>
        )}

        {/* Tab 切换 */}
        <div className="mb-4 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); cancelEdit(); }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-accent/20 text-accent'
                  : 'glass text-gray-500 hover:text-accent'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === tab.key ? 'bg-accent/30' : 'bg-white/10'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 用户列表 */}
        <div className="glass-heavy rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-gray-500">
                  <th className="px-6 py-3">用户名</th>
                  <th className="px-6 py-3">显示名称</th>
                  <th className="px-6 py-3">邮箱</th>
                  <th className="px-6 py-3">用户组</th>
                  <th className="px-6 py-3">注册时间</th>
                  <th className="px-6 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((u) => (
                  <tr key={`${u.accountType}-${u.id}`} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-3 font-medium">{u.username}</td>
                    <td className="px-6 py-3 text-gray-400">{u.displayName || '-'}</td>
                    <td className="px-6 py-3 text-gray-500">{u.email}</td>
                    <td className="px-6 py-3">
                      {u.accountType === 'reader' ? (
                        <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
                          📖 读者
                        </span>
                      ) : (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            u.role === 'admin'
                              ? 'bg-red-500/20 text-red-400'
                              : u.role === 'editor'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {u.role === 'admin' ? '👑 最高管理' : u.role === 'editor' ? '👤 普通管理' : '👤 普通用户'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(u)}
                          className="text-xs text-accent hover:text-accent/80"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.username, u.accountType)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {activeTab === 'reader'
                        ? '暂无普通用户'
                        : activeTab === 'admin'
                        ? '管理员组仅 shunyun'
                        : '暂无任何账号'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 底部统计 */}
        <div className="mt-4 text-center text-xs text-gray-500">
          管理组 1 人（shunyun） · 普通用户组 {readers.length + users.filter(u => u.role !== 'admin').length} 人 · 总计 {users.length + readers.length} 人
        </div>
      </div>

      {/* ── 编辑用户弹窗 ── */}
      <AnimatePresence>
        {editingUser && (
          <>
            {/* 遮罩 */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={cancelEdit}
            />

            {/* 卡片 */}
            <m.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
            >
              <div className="glass-heavy rounded-2xl border border-white/10 p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    ✏️ 编辑用户
                    <span className="ml-2 text-sm font-normal text-gray-400">{editingUser.username}</span>
                  </h2>
                  <button
                    onClick={cancelEdit}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm text-gray-400 transition hover:bg-white/20"
                  >
                    ✕
                  </button>
                </div>

                {/* 用户信息 */}
                <div className="mb-4 space-y-1 rounded-xl bg-white/5 px-4 py-3 text-xs text-gray-400">
                  <p>ID: {editingUser.id}</p>
                  <p>注册时间: {formatDate(editingUser.createdAt)}</p>
                </div>

                <div className="space-y-4">
                  {/* 用户组选择（仅后台用户可选，且 shunyun 不可降级） */}
                  {editingUser.accountType !== 'reader' && (
                    <div>
                      <label className="mb-1 block text-sm font-medium">用户组</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value }))}
                        disabled={editingUser.username === 'shunyun'}
                        className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                      >
                        <option value="editor">👤 普通管理员 — 可写文章、编辑/删除文章、审核评论</option>
                        <option value="reader">📖 读者 — 仅浏览、搜索、评论</option>
                        {editingUser.role === 'admin' && (
                          <option value="admin">👑 最高管理员 — 全站最高权限</option>
                        )}
                      </select>
                      {editingUser.username === 'shunyun' && (
                        <p className="mt-1 text-xs text-amber-400">shunyun 为最高管理员，不可更改</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        切换用户组后该用户需重新登录才生效
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-medium">显示名称</label>
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                      className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                      placeholder="支持中文"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">邮箱</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                      className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                      placeholder="请输入邮箱"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">密码</label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm(f => ({ ...f, password: e.target.value }))}
                      className="glass w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                      placeholder="留空则不修改密码"
                    />
                    <p className="mt-1 text-xs text-gray-400">留空则不修改密码</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={cancelEdit}
                    className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-500 transition hover:bg-white/10"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleEdit}
                    className="flex-1 rounded-xl bg-accent/20 py-2.5 text-sm font-medium text-accent transition hover:bg-accent/30"
                  >
                    保存修改
                  </button>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
