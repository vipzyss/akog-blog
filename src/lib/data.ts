/**
 * 数据层 — 使用 JSON 文件存储（无需数据库服务器）
 * 文章、分类、标签、评论、用户、读者 — 全部存为 JSON
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// 直接用项目根目录下的 data/ 文件夹
// Next.js 的 process.cwd() 在 dev 模式下指向项目根目录，打包后也一致
// 如果找不到，兜底用相对于本文件的路径
function getDataDir(): string {
  // 优先用 process.cwd() + 'data'（Next.js dev 模式）
  const cwdPath = path.join(process.cwd(), 'data');
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }
  // 兜底：相对于本文件（src/lib/）往上 3 层
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, '../../../data');
}

const DATA_DIR = getDataDir();

// 确保数据目录存在
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 通用 JSON 读写
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
  username: string;       // 英文登录标识符（唯一，不可改）
  displayName?: string;     // 显示名称（支持中文，可随时修改）
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  bio?: string;           // 个人简介
  createdAt: string;
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');

export function getUsers(): User[] {
  return readJSON<User[]>(USERS_FILE, []);
}

export function getUserById(id: string): User | null {
  return getUsers().find((u) => u.id === id) || null;
}

export function getUserByIdentifier(identifier: string): User | null {
  return getUsers().find(
    (u) => u.username === identifier || u.email === identifier
  ) || null;
}

export function createUser(data: {
  username: string;
  displayName?: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}): User {
  const users = getUsers();
  const user: User = {
    id: uuidv4(),
    username: data.username,
    displayName: data.displayName || data.username,
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role || 'author',
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeJSON(USERS_FILE, users);
  return user;
}

export function updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...data };
  writeJSON(USERS_FILE, users);
  return users[idx];
}

export function deleteUser(id: string): boolean {
  let users = getUsers();
  const len = users.length;
  users = users.filter((u) => u.id !== id);
  writeJSON(USERS_FILE, users);
  return users.length < len;
}

// 保存用户数组（供 auth.ts 的 changeAdminPassword 使用）
export function saveUsers(users: User[]): void {
  writeJSON(USERS_FILE, users);
}

// ==================== 前台读者（注册用户） ====================
export interface Reader {
  id: string;
  username: string;       // 英文登录标识符（唯一，不可改）
  displayName?: string;     // 显示名称（支持中文，可随时修改）
  email: string;
  passwordHash: string;
  avatar?: string;
  createdAt: string;
}

const READERS_FILE = path.join(DATA_DIR, 'readers.json');

export function getReaders(): Reader[] {
  return readJSON<Reader[]>(READERS_FILE, []);
}

export function getReaderByIdentifier(identifier: string): Reader | null {
  return getReaders().find(
    (r) => r.username === identifier || r.email === identifier
  ) || null;
}

export function getReaderById(id: string): Reader | null {
  return getReaders().find((r) => r.id === id) || null;
}

export function createReader(data: {
  username: string;
  displayName?: string;
  email: string;
  passwordHash: string;
}): Reader {
  const readers = getReaders();
  const reader: Reader = {
    id: uuidv4(),
    username: data.username,
    displayName: data.displayName || data.username,
    email: data.email,
    passwordHash: data.passwordHash,
    createdAt: new Date().toISOString(),
  };
  readers.push(reader);
  writeJSON(READERS_FILE, readers);
  return reader;
}

export function deleteReader(id: string): boolean {
  let readers = getReaders();
  const len = readers.length;
  readers = readers.filter((r) => r.id !== id);
  writeJSON(READERS_FILE, readers);
  return readers.length < len;
}

export function updateReader(id: string, data: Partial<Omit<Reader, 'id' | 'username' | 'createdAt'>>): Reader | null {
  const readers = getReaders();
  const idx = readers.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  readers[idx] = { ...readers[idx], ...data };
  writeJSON(READERS_FILE, readers);
  return readers[idx];
}

// ==================== 文章 ====================
export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;        // Markdown 内容
  richContent: string;     // 富文本 HTML
  coverImage: string;
  categoryId: string;
  tagIds: string[];
  status: 'draft' | 'published' | 'scheduled' | 'pending';
  publishedAt: string | null;
  scheduledAt: string | null;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

export function getPosts(): Post[] {
  return readJSON<Post[]>(POSTS_FILE, []);
}

export function getPostById(id: string): Post | null {
  const posts = getPosts();
  return posts.find((p) => p.id === id) || null;
}

export function getPostBySlug(slug: string): Post | null {
  const posts = getPosts();
  return posts.find((p) => p.slug === slug) || null;
}

export function createPost(data: Partial<Post>): Post {
  const posts = getPosts();
  const now = new Date().toISOString();
  const post: Post = {
    id: uuidv4(),
    slug: data.slug || '',
    title: data.title || '未命名',
    excerpt: data.excerpt || '',
    content: data.content || '',
    richContent: data.richContent || '',
    coverImage: data.coverImage || '',
    categoryId: data.categoryId || '',
    tagIds: data.tagIds || [],
    status: data.status || 'draft',
    publishedAt: data.publishedAt || null,
    scheduledAt: data.scheduledAt || null,
    views: 0,
    likes: 0,
    createdAt: now,
    updatedAt: now,
  };
  posts.push(post);
  writeJSON(POSTS_FILE, posts);
  return post;
}

export function updatePost(id: string, data: Partial<Post>): Post | null {
  const posts = getPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  posts[idx] = {
    ...posts[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeJSON(POSTS_FILE, posts);
  return posts[idx];
}

export function deletePost(id: string): boolean {
  let posts = getPosts();
  const len = posts.length;
  posts = posts.filter((p) => p.id !== id);
  writeJSON(POSTS_FILE, posts);
  return posts.length < len;
}

// ==================== IP 浏览去重 ====================
interface ViewedIP {
  ip: string;
  slug: string;
  timestamp: string;
}

const VIEWED_IPS_FILE = path.join(DATA_DIR, 'viewedIPs.json');

function getViewedIPs(): ViewedIP[] {
  return readJSON<ViewedIP[]>(VIEWED_IPS_FILE, []);
}

function hasIPViewed(ip: string, slug: string): boolean {
  return getViewedIPs().some((v) => v.ip === ip && v.slug === slug);
}

function recordIPView(ip: string, slug: string): void {
  const views = getViewedIPs();
  views.push({ ip, slug, timestamp: new Date().toISOString() });
  writeJSON(VIEWED_IPS_FILE, views);
}

export function incrementViews(slug: string, ip?: string): void {
  if (ip && ip !== 'unknown' && hasIPViewed(ip, slug)) return;

  const posts = getPosts();
  const post = posts.find((p) => p.slug === slug);
  if (post) {
    post.views += 1;
    writeJSON(POSTS_FILE, posts);
    if (ip && ip !== 'unknown') recordIPView(ip, slug);
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

const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

export function getCategories(): Category[] {
  return readJSON<Category[]>(CATEGORIES_FILE, []);
}

export function createCategory(data: Partial<Category>): Category {
  const categories = getCategories();
  const cat: Category = {
    id: uuidv4(),
    name: data.name || '未分类',
    slug: data.slug || '',
    description: data.description || '',
    createdAt: new Date().toISOString(),
  };
  categories.push(cat);
  writeJSON(CATEGORIES_FILE, categories);
  return cat;
}

export function updateCategory(id: string, data: Partial<Category>): Category | null {
  const categories = getCategories();
  const idx = categories.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  categories[idx] = { ...categories[idx], ...data };
  writeJSON(CATEGORIES_FILE, categories);
  return categories[idx];
}

export function deleteCategory(id: string): boolean {
  let categories = getCategories();
  categories = categories.filter((c) => c.id !== id);
  writeJSON(CATEGORIES_FILE, categories);
  return true;
}

// ==================== 标签 ====================
export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

const TAGS_FILE = path.join(DATA_DIR, 'tags.json');

export function getTags(): Tag[] {
  return readJSON<Tag[]>(TAGS_FILE, []);
}

export function createTag(data: Partial<Tag>): Tag {
  const tags = getTags();
  const tag: Tag = {
    id: uuidv4(),
    name: data.name || '未命名标签',
    slug: data.slug || '',
    createdAt: new Date().toISOString(),
  };
  tags.push(tag);
  writeJSON(TAGS_FILE, tags);
  return tag;
}

export function deleteTag(id: string): boolean {
  let tags = getTags();
  tags = tags.filter((t) => t.id !== id);
  writeJSON(TAGS_FILE, tags);
  return true;
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
  readerId?: string; // 关联注册读者（可选）
}

const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');

export function getComments(): Comment[] {
  return readJSON<Comment[]>(COMMENTS_FILE, []);
}

export function getCommentsByPost(postId: string): Comment[] {
  return getComments().filter((c) => c.postId === postId && c.approved);
}

export function createComment(data: Partial<Comment>): Comment {
  const comments = getComments();
  const comment: Comment = {
    id: uuidv4(),
    postId: data.postId || '',
    author: data.author || '匿名',
    email: data.email || '',
    content: data.content || '',
    approved: false,
    createdAt: new Date().toISOString(),
    readerId: data.readerId,
  };
  comments.push(comment);
  writeJSON(COMMENTS_FILE, comments);
  return comment;
}

export function approveComment(id: string): boolean {
  const comments = getComments();
  const comment = comments.find((c) => c.id === id);
  if (comment) {
    comment.approved = true;
    writeJSON(COMMENTS_FILE, comments);
    return true;
  }
  return false;
}

export function deleteComment(id: string): boolean {
  let comments = getComments();
  comments = comments.filter((c) => c.id !== id);
  writeJSON(COMMENTS_FILE, comments);
  return true;
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

const FRIEND_LINKS_FILE = path.join(DATA_DIR, 'friend-links.json');

export function getFriendLinks(): FriendLink[] {
  return readJSON<FriendLink[]>(FRIEND_LINKS_FILE, []);
}

export function createFriendLink(data: { name: string; url: string; logo: string }): FriendLink {
  const links = getFriendLinks();
  const link: FriendLink = {
    id: uuidv4(),
    name: data.name,
    url: data.url,
    logo: data.logo,
    sort: links.length,
    createdAt: new Date().toISOString(),
  };
  links.push(link);
  writeJSON(FRIEND_LINKS_FILE, links);
  return link;
}

export function updateFriendLink(id: string, data: Partial<Pick<FriendLink, 'name' | 'url' | 'logo' | 'sort'>>): FriendLink | null {
  const links = getFriendLinks();
  const idx = links.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  links[idx] = { ...links[idx], ...data };
  writeJSON(FRIEND_LINKS_FILE, links);
  return links[idx];
}

export function deleteFriendLink(id: string): boolean {
  let links = getFriendLinks();
  const len = links.length;
  links = links.filter((l) => l.id !== id);
  writeJSON(FRIEND_LINKS_FILE, links);
  return links.length < len;
}

// ==================== 留言板 ====================
export interface GuestbookMessage {
  id: string;
  author: string;
  content: string;
  approved: boolean;
  createdAt: string;
  readerId?: string;
}

const GUESTBOOK_FILE = path.join(DATA_DIR, 'guestbook.json');

export function getGuestbookMessages(): GuestbookMessage[] {
  return readJSON<GuestbookMessage[]>(GUESTBOOK_FILE, []);
}

export function createGuestbookMessage(data: { author: string; content: string; readerId?: string }): GuestbookMessage {
  const messages = getGuestbookMessages();
  const msg: GuestbookMessage = {
    id: uuidv4(),
    author: data.author,
    content: data.content,
    approved: false,
    readerId: data.readerId,
    createdAt: new Date().toISOString(),
  };
  messages.push(msg);
  writeJSON(GUESTBOOK_FILE, messages);
  return msg;
}

export function approveGuestbookMessage(id: string): boolean {
  const messages = getGuestbookMessages();
  const msg = messages.find((m) => m.id === id);
  if (msg) { msg.approved = true; writeJSON(GUESTBOOK_FILE, messages); return true; }
  return false;
}

export function deleteGuestbookMessage(id: string): boolean {
  let messages = getGuestbookMessages();
  const len = messages.length;
  messages = messages.filter((m) => m.id !== id);
  writeJSON(GUESTBOOK_FILE, messages);
  return messages.length < len;
}

// ==================== 统计 ====================
export function getStats() {
  const posts = getPosts();
  const comments = getComments();
  const categories = getCategories();
  const tags = getTags();
  const users = getUsers();
  const readers = getReaders();

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

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

export function getSiteSettings(): SiteSettings {
  return readJSON<SiteSettings>(SETTINGS_FILE, {
    siteName: '瞬云的尽头',
    siteDescription: '探索虚拟世界的无限可能',
  });
}

export function updateSiteSettings(data: Partial<SiteSettings>): SiteSettings {
  const settings = getSiteSettings();
  const updated = { ...settings, ...data };
  writeJSON(SETTINGS_FILE, updated);
  return updated;
}

// ==================== 初始化默认数据 ====================
export function initDefaultData() {
  ensureDir(DATA_DIR);

  // 初始化分类
  if (getCategories().length === 0) {
    createCategory({ name: '技术', slug: 'tech', description: '技术相关文章' });
    createCategory({ name: '生活', slug: 'life', description: '生活随笔' });
    createCategory({ name: '二次元', slug: 'anime', description: '二次元相关内容' });
  }

  // 初始化标签
  if (getTags().length === 0) {
    createTag({ name: '前端', slug: 'frontend' });
    createTag({ name: 'Next.js', slug: 'nextjs' });
    createTag({ name: '动画', slug: 'anime' });
  }

  // 初始化默认管理员账号
  if (getUsers().length === 0) {
    const hash = bcrypt.hashSync('q1589491q', 10);
    createUser({
      username: 'shunyun',
      displayName: '瞬云',
      email: 'vipzyss@gmail.com',
      passwordHash: hash,
      role: 'admin',
    });
  }

  // 初始化站点设置
  if (!fs.existsSync(SETTINGS_FILE)) {
    writeJSON(SETTINGS_FILE, {
      siteName: '瞬云的尽头',
      siteDescription: '探索虚拟世界的无限可能',
    });
  }
}
