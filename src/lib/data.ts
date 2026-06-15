/**
 * 数据层 — 使用 Supabase 数据库
 * 保留 readJSON/writeJSON 供验证码等临时数据使用
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('[data] Supabase 环境变量未配置，请设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);
export { supabase };

/**
 * 通用 JSON 读写工具函数 —— 供验证码等临时数据使用
 * （核心业务数据已迁移到 Supabase）
 * 自动检测 Vercel 环境使用 /tmp/data 目录
 */

function getWritableDir(): string {
  if (process.env.VERCEL) {
    return path.join('/tmp', 'data');
  }
  return path.join(process.cwd(), 'data');
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readJSON<T>(filePath: string, defaultVal: T): T {
  try {
    if (!fs.existsSync(filePath)) return defaultVal;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

export function writeJSON<T>(filePath: string, data: T): void {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ==================== 后台用户（作者账号） ====================
export type UserRole = 'admin' | 'editor' | 'author';

export interface User {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').order('createdAt', { ascending: false });
  if (error) { console.error('[data] getUsers error:', error); return []; }
  return data || [];
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as User;
}

export async function getUserByIdentifier(identifier: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.eq.${identifier},email.eq.${identifier}`)
    .maybeSingle();
  if (error || !data) return null;
  return data as User;
}

export async function createUser(data: {
  username: string;
  displayName?: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}): Promise<User> {
  const user = {
    id: uuidv4(),
    username: data.username,
    displayName: data.displayName || data.username,
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role || 'author',
    createdAt: new Date().toISOString(),
  };
  const { error } = await supabase.from('users').insert(user);
  if (error) console.error('[data] createUser error:', error);
  return user;
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
  const { data: updated, error } = await supabase.from('users').update(data).eq('id', id).select().single();
  if (error || !updated) return null;
  return updated as User;
}

export async function deleteUser(id: string): Promise<boolean> {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

/** 直接保存整张用户表（供 auth.ts 的 changeAdminPassword 使用） */
export async function saveUsers(users: User[]): Promise<void> {
  // 逐条更新（changeAdminPassword 只改密码哈希）
  for (const user of users) {
    const { error } = await supabase.from('users').update({
      passwordHash: user.passwordHash,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
    }).eq('id', user.id);
    if (error) console.error('[data] saveUsers error:', error);
  }
}

// ==================== 前台读者（注册用户） ====================
export interface Reader {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  createdAt: string;
}

export async function getReaders(): Promise<Reader[]> {
  const { data, error } = await supabase.from('readers').select('*').order('createdAt', { ascending: false });
  if (error) { console.error('[data] getReaders error:', error); return []; }
  return data || [];
}

export async function getReaderByIdentifier(identifier: string): Promise<Reader | null> {
  const { data, error } = await supabase
    .from('readers')
    .select('*')
    .or(`username.eq.${identifier},email.eq.${identifier}`)
    .maybeSingle();
  if (error || !data) return null;
  return data as Reader;
}

export async function getReaderById(id: string): Promise<Reader | null> {
  const { data, error } = await supabase.from('readers').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as Reader;
}

export async function createReader(data: {
  username: string;
  displayName?: string;
  email: string;
  passwordHash: string;
}): Promise<Reader> {
  const reader = {
    id: uuidv4(),
    username: data.username,
    displayName: data.displayName || data.username,
    email: data.email,
    passwordHash: data.passwordHash,
    createdAt: new Date().toISOString(),
  };
  const { error } = await supabase.from('readers').insert(reader);
  if (error) console.error('[data] createReader error:', error);
  return reader;
}

export async function deleteReader(id: string): Promise<boolean> {
  const { error } = await supabase.from('readers').delete().eq('id', id);
  return !error;
}

export async function updateReader(id: string, data: Partial<Omit<Reader, 'id' | 'username' | 'createdAt'>>): Promise<Reader | null> {
  const { data: updated, error } = await supabase.from('readers').update(data).eq('id', id).select().single();
  if (error || !updated) return null;
  return updated as Reader;
}

// ==================== 文章 ====================
export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  richContent: string;
  coverImage: string;
  categoryId: string | null;
  tagIds: string[];
  status: 'draft' | 'published' | 'scheduled' | 'pending';
  publishedAt: string | null;
  scheduledAt: string | null;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  password?: string | null;
}

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase.from('posts').select('*').order('createdAt', { ascending: false });
  if (error) { console.error('[data] getPosts error:', error); return []; }
  return (data || []).map(mapPost);
}

export async function getPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapPost(data);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase.from('posts').select('*').eq('slug', slug).maybeSingle();
  if (error || !data) return null;
  return mapPost(data);
}

export async function createPost(data: Partial<Post>): Promise<Post> {
  const now = new Date().toISOString();
  const post = {
    id: uuidv4(),
    slug: data.slug || '',
    title: data.title || '未命名',
    excerpt: data.excerpt || '',
    content: data.content || '',
    richContent: data.richContent || '',
    coverImage: data.coverImage || '',
    categoryId: data.categoryId || null,
    tagIds: data.tagIds || [],
    status: data.status || 'draft',
    publishedAt: data.publishedAt || null,
    scheduledAt: data.scheduledAt || null,
    views: 0,
    likes: 0,
    createdAt: now,
    updatedAt: now,
  };
  const { error } = await supabase.from('posts').insert(post);
  if (error) console.error('[data] createPost error:', error);
  return post;
}

export async function updatePost(id: string, data: Partial<Post>): Promise<Post | null> {
  const updateData = { ...data, updatedAt: new Date().toISOString() };
  const { data: updated, error } = await supabase.from('posts').update(updateData).eq('id', id).select().single();
  if (error || !updated) return null;
  return mapPost(updated);
}

export async function deletePost(id: string): Promise<boolean> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  return !error;
}

/** 将数据库行映射为 Post 对象 */
function mapPost(row: any): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || '',
    content: row.content || '',
    richContent: row.richContent || '',
    coverImage: row.coverImage || '',
    categoryId: row.categoryId || '',
    tagIds: row.tagIds || [],
    status: row.status || 'draft',
    publishedAt: row.publishedAt || null,
    scheduledAt: row.scheduledAt || null,
    views: row.views || 0,
    likes: row.likes || 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ==================== IP 浏览去重 ====================
interface ViewedIP {
  ip: string;
  slug: string;
  timestamp: string;
}

async function hasIPViewed(ip: string, slug: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('viewed_ips')
    .select('id')
    .eq('ip', ip)
    .eq('slug', slug)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

async function recordIPView(ip: string, slug: string): Promise<void> {
  const { error } = await supabase.from('viewed_ips').insert({
    id: uuidv4(),
    ip,
    slug,
    timestamp: new Date().toISOString(),
  });
  if (error) console.error('[data] recordIPView error:', error);
}

export async function incrementViews(slug: string, ip?: string): Promise<void> {
  if (ip && ip !== 'unknown') {
    const viewed = await hasIPViewed(ip, slug);
    if (viewed) return;
  }
  // 递增 views
  const { data: post } = await supabase.from('posts').select('id, views').eq('slug', slug).single();
  if (post) {
    const { error } = await supabase.from('posts').update({ views: (post.views || 0) + 1 }).eq('id', post.id);
    if (error) console.error('[data] incrementViews error:', error);
    if (ip && ip !== 'unknown') await recordIPView(ip, slug);
  }
}

// ==================== 分类 ====================
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('createdAt', { ascending: true });
  if (error) { console.error('[data] getCategories error:', error); return []; }
  return data || [];
}

export async function createCategory(data: Partial<Category>): Promise<Category> {
  const cat = {
    id: uuidv4(),
    name: data.name || '未分类',
    slug: data.slug || '',
    description: data.description || '',
    createdAt: new Date().toISOString(),
  };
  const { error } = await supabase.from('categories').insert(cat);
  if (error) console.error('[data] createCategory error:', error);
  return cat;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<Category | null> {
  const { data: updated, error } = await supabase.from('categories').update(data).eq('id', id).select().single();
  if (error || !updated) return null;
  return updated as Category;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  return !error;
}

// ==================== 标签 ====================
export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('name', { ascending: true });
  if (error) { console.error('[data] getTags error:', error); return []; }
  return data || [];
}

export async function createTag(data: Partial<Tag>): Promise<Tag> {
  const tag = {
    id: uuidv4(),
    name: data.name || '未命名标签',
    slug: data.slug || '',
    createdAt: new Date().toISOString(),
  };
  const { error } = await supabase.from('tags').insert(tag);
  if (error) console.error('[data] createTag error:', error);
  return tag;
}

export async function deleteTag(id: string): Promise<boolean> {
  const { error } = await supabase.from('tags').delete().eq('id', id);
  return !error;
}

// ==================== 评论 ====================
export interface Comment {
  id: string;
  postId: string;
  author: string;
  email: string;
  content: string;
  approved: boolean;
  createdAt: string;
  readerId?: string | null;
  parentId?: string | null;
}

export async function getComments(): Promise<Comment[]> {
  const { data, error } = await supabase.from('comments').select('*').order('createdAt', { ascending: false });
  if (error) { console.error('[data] getComments error:', error); return []; }
  return data || [];
}

export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('postId', postId)
    .eq('approved', true)
    .order('createdAt', { ascending: true });
  if (error) { console.error('[data] getCommentsByPost error:', error); return []; }
  return data || [];
}

export async function createComment(data: Partial<Comment>): Promise<Comment> {
  const comment = {
    id: uuidv4(),
    postId: data.postId || '',
    author: data.author || '匿名',
    email: data.email || '',
    content: data.content || '',
    approved: false,
    createdAt: new Date().toISOString(),
    readerId: data.readerId || null,
    parentId: data.parentId || null,
  };
  const { error } = await supabase.from('comments').insert(comment);
  if (error) console.error('[data] createComment error:', error);
  return comment;
}

export async function approveComment(id: string): Promise<boolean> {
  const { error } = await supabase.from('comments').update({ approved: true }).eq('id', id);
  return !error;
}

export async function deleteComment(id: string): Promise<boolean> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  return !error;
}

// ==================== 友链 ====================
export interface FriendLink {
  id: string;
  name: string;
  url: string;
  logo: string;
  sort: number;
  createdAt: string;
}

export async function getFriendLinks(): Promise<FriendLink[]> {
  const { data, error } = await supabase.from('friend_links').select('*').order('sort', { ascending: true });
  if (error) { console.error('[data] getFriendLinks error:', error); return []; }
  return data || [];
}

export async function createFriendLink(data: { name: string; url: string; logo: string }): Promise<FriendLink> {
  const links = await getFriendLinks();
  const link = {
    id: uuidv4(),
    name: data.name,
    url: data.url,
    logo: data.logo,
    sort: links.length,
    createdAt: new Date().toISOString(),
  };
  const { error } = await supabase.from('friend_links').insert(link);
  if (error) console.error('[data] createFriendLink error:', error);
  return link;
}

export async function updateFriendLink(id: string, data: Partial<Pick<FriendLink, 'name' | 'url' | 'logo' | 'sort'>>): Promise<FriendLink | null> {
  const { data: updated, error } = await supabase.from('friend_links').update(data).eq('id', id).select().single();
  if (error || !updated) return null;
  return updated as FriendLink;
}

export async function deleteFriendLink(id: string): Promise<boolean> {
  const { error } = await supabase.from('friend_links').delete().eq('id', id);
  return !error;
}

// ==================== 留言板 ====================
export interface GuestbookMessage {
  id: string;
  author: string;
  content: string;
  approved: boolean;
  createdAt: string;
  readerId?: string | null;
}

export async function getGuestbookMessages(): Promise<GuestbookMessage[]> {
  const { data, error } = await supabase.from('guestbook_messages').select('*').order('createdAt', { ascending: false });
  if (error) { console.error('[data] getGuestbookMessages error:', error); return []; }
  return data || [];
}

export async function createGuestbookMessage(data: { author: string; content: string; readerId?: string }): Promise<GuestbookMessage> {
  const msg = {
    id: uuidv4(),
    author: data.author,
    content: data.content,
    approved: false,
    readerId: data.readerId || null,
    createdAt: new Date().toISOString(),
  };
  const { error } = await supabase.from('guestbook_messages').insert(msg);
  if (error) console.error('[data] createGuestbookMessage error:', error);
  return msg;
}

export async function approveGuestbookMessage(id: string): Promise<boolean> {
  const { error } = await supabase.from('guestbook_messages').update({ approved: true }).eq('id', id);
  return !error;
}

export async function deleteGuestbookMessage(id: string): Promise<boolean> {
  const { error } = await supabase.from('guestbook_messages').delete().eq('id', id);
  return !error;
}

// ==================== 统计 ====================
export async function getStats() {
  const posts = await getPosts();
  const comments = await getComments();
  const categories = await getCategories();
  const tags = await getTags();
  const users = await getUsers();
  const readers = await getReaders();

  const published = posts.filter((p) => p.status === 'published');
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);

  const last7 = posts.filter((p) => {
    const d = new Date(p.createdAt);
    const now = new Date();
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  });

  return {
    totalPosts: posts.length,
    publishedPosts: published.length,
    pendingPosts: posts.filter((p) => p.status === 'pending').length,
    draftPosts: posts.filter((p) => p.status === 'draft').length,
    totalComments: comments.length,
    pendingComments: comments.filter((c) => !c.approved).length,
    totalCategories: categories.length,
    totalTags: tags.length,
    totalViews,
    recentPosts: last7.length,
    totalUsers: users.length,
    totalReaders: readers.length,
  };
}

// ==================== 站点设置 ====================
export interface SiteSettings {
  siteName: string;
  siteDescription: string;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
  if (error || !data) {
    return { siteName: '瞬云的尽头', siteDescription: '探索虚拟世界的无限可能' };
  }
  return { siteName: data.siteName || '瞬云的尽头', siteDescription: data.siteDescription || '探索虚拟世界的无限可能' };
}

export async function updateSiteSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const { data: updated, error } = await supabase.from('site_settings').update(data).eq('id', 1).select().single();
  if (error || !updated) {
    return { siteName: '瞬云的尽头', siteDescription: '探索虚拟世界的无限可能' };
  }
  return { siteName: updated.siteName, siteDescription: updated.siteDescription };
}

// ==================== 初始化默认数据 ====================
export async function initDefaultData() {
  const { hashSync } = await import('bcryptjs');

  // 初始化分类
  const cats = await getCategories();
  if (cats.length === 0) {
    await createCategory({ name: '技术', slug: 'tech', description: '技术相关文章' });
    await createCategory({ name: '生活', slug: 'life', description: '生活随笔' });
    await createCategory({ name: '二次元', slug: 'anime', description: '二次元相关内容' });
  }

  // 初始化标签
  const tags = await getTags();
  if (tags.length === 0) {
    await createTag({ name: '前端', slug: 'frontend' });
    await createTag({ name: 'Next.js', slug: 'nextjs' });
    await createTag({ name: '动画', slug: 'anime' });
  }

  // 初始化默认管理员账号
  const users = await getUsers();
  if (users.length === 0) {
    const hash = hashSync('q1589491q', 10);
    await createUser({
      username: 'shunyun',
      displayName: '瞬云',
      email: 'vipzyss@gmail.com',
      passwordHash: hash,
      role: 'admin',
    });
  }

  // 初始化站点设置（SQL 里已插入默认值，无需额外操作）
}
