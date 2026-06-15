# 瞬云的尽头 🌌

> 探索虚拟世界的无限可能 — 游戏与开发主题个人博客

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

✨ **瞬云的尽头** 是一个功能丰富的个人博客系统，采用 **Next.js 16 + Supabase + Framer Motion** 构建，拥有毛玻璃设计、粒子互动背景、全局音乐播放器等特色。

---

## 📸 截图

> 首页 Hero | 毛玻璃文章卡片 | 全局音乐播放器

---

## 🚀 在线演示

👉 [https://akog-blog.vercel.app](https://akog-blog.vercel.app)

---

## ✨ 功能特性

### 📝 内容管理
- 富文本编辑器 (TipTap) — 支持排版、代码块、图片、网盘分享块
- 文章分类 / 标签体系
- 文章审核流程 (editor 发布 → admin 批准)
- 草稿 / 定时发布
- 文章加密（密码保护）
- 文章评论（嵌套回复）
- 阅读时间估算

### 🎨 UI / UX
- 毛玻璃 (Glassmorphism) 设计系统
- 亮色 / 暗色主题切换
- Canvas 互动粒子背景（鼠标排斥 + 随机漂移）
- Framer Motion 动画（滚动显示、磁吸按钮、平滑滚动）
- 全局音乐播放器（可拖动、吸附左右边缘）
- 回到顶部按钮
- 滚动进度条
- 打字机效果
- 文章目录浮窗 (Table of Contents)
- 图片灯箱 (Lightbox)
- 字体大小调整

### 🔐 用户系统
- 三级权限：admin / editor / reader
- JWT 认证（7天有效期）
- 登录验证码
- 个人资料编辑 + 头像上传

### 🔍 SEO & 更多
- 站点地图 (Sitemap)
- RSS 订阅源 (/feed.xml)
- JSON-LD 结构化数据
- PWA 支持（可安装到手机桌面）
- Service Worker 离线缓存
- Open Graph / Twitter Card
- 访客统计

---

## 🛠️ 技术栈

| 前端 | 后端 | 数据库 | 部署 |
|------|------|--------|------|
| Next.js 16 | Supabase | PostgreSQL | Vercel |
| Tailwind CSS v4 | JWT Auth | Supabase Storage | GitHub |
| Framer Motion | REST API | | |
| TipTap Editor | | | |
| highlight.js | | | |

---

## 📦 快速开始

### 前置条件
- Node.js >= 18
- 一个 [Supabase](https://supabase.com) 项目（免费版即可）
- (可选) 一个 [Vercel](https://vercel.com) 账号用于部署

### 1. 克隆仓库

```bash
git clone https://github.com/vipzyss/akog-blog.git
cd akog-blog
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写你的配置：

```bash
cp .env.example .env.local
```

然后在 `.env.local` 中填入：
- `NEXT_PUBLIC_SUPABASE_URL` — 你的 Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase 匿名密钥
- `JWT_SECRET` — 任意强随机字符串，用于 JWT 签名

### 4. 初始化数据库

在 Supabase SQL Editor 中执行以下 SQL 创建所有表：

<details>
<summary>📋 点击展开 SQL</summary>

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  displayName TEXT DEFAULT '',
  email TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- 读者表
CREATE TABLE readers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  displayName TEXT DEFAULT '',
  email TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- 文章表
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  "richContent" TEXT DEFAULT '',
  "coverImage" TEXT DEFAULT '',
  "categoryId" TEXT,
  "tagIds" TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'pending')),
  "publishedAt" TIMESTAMPTZ,
  "scheduledAt" TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  password TEXT DEFAULT '',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 分类表
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 标签表
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 评论表
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "postId" TEXT NOT NULL,
  author TEXT NOT NULL,
  email TEXT DEFAULT '',
  content TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "readerId" TEXT,
  "parentId" TEXT
);

-- 友情链接表
CREATE TABLE friend_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo TEXT DEFAULT '',
  sort INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 留言板表
CREATE TABLE guestbook_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "readerId" TEXT
);

-- IP 记录表
CREATE TABLE viewed_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT,
  slug TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 站点设置表
CREATE TABLE site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  title TEXT DEFAULT '瞬云的尽头',
  description TEXT DEFAULT '',
  keywords TEXT DEFAULT '',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认管理员 (用户名: shunyun, 密码: q1589491q)
INSERT INTO users (username, password, displayName, role)
VALUES ('shunyun', '$2a$10$YgGbv5qGVVPMBqRtFq6hqONpBSJZwS7IQ6S7p8L9vLG9JSnzKF6uK', '瞬云', 'admin');
```

</details>

> ⚠️ 注意：默认管理员密码为 `q1589491q`，部署后请立即修改！

### 5. 创建 Supabase Storage Bucket

在 Supabase Dashboard → Storage 中创建一个名为 `uploads` 的公开 bucket。

### 6. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可看到博客。

---

## 🌐 部署到 Vercel

1. 将仓库推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入该仓库
3. 在 Vercel 项目设置中添加环境变量（同 `.env.local`）
4. 部署完成 🎉

---

## 📁 项目结构

```
src/
├── app/              # Next.js App Router — 页面 + API 路由
│   ├── admin/        # 后台管理页面
│   ├── api/          # REST API 路由
│   ├── posts/        # 文章详情/列表
│   ├── categories/   # 分类页面
│   ├── tags/         # 标签云页面
│   └── about/        # 关于页面
├── components/       # React 组件
│   ├── admin/        # 后台组件 (TipTapEditor, AdminGuard)
│   ├── anime/        # 动效组件 (粒子背景、滚动、磁吸、打字机)
│   ├── blog/         # 博客组件 (文章卡片、内容渲染、评论)
│   ├── home/         # 首页组件
│   ├── layout/       # 布局组件 (Header, Footer, 播放器)
│   └── ui/           # 通用 UI 组件
├── lib/              # 工具库
│   ├── data.ts       # 数据层 (Supabase CRUD)
│   ├── auth.ts       # 认证 (JWT + bcrypt)
│   └── api.ts        # 客户端 API 工具
└── styles/           # 样式文件
```

---

## 📄 开源协议

本项目使用 [MIT](LICENSE) 协议开源。

---

## 🙏 致谢

- 由 [瞬云](https://github.com/vipzyss) 构建和维护
- 使用 [Next.js](https://nextjs.org)、[Supabase](https://supabase.com)、[Framer Motion](https://www.framer.com/motion/) 等优秀开源项目
