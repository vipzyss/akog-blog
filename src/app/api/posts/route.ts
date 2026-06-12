import { NextRequest, NextResponse } from 'next/server';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from '@/lib/data';
import { getToken, verifyToken } from '@/lib/auth';

/**
 * GET /api/posts — 获取文章列表
 * 查询参数：
 *   - status: 'published' | 'draft' | 'all'（文章状态过滤）
 *   - category: categoryId（按分类过滤）
 *   - tag: tagId（按标签过滤）
 *   - q: 搜索关键词（标题/摘要）
 *   - page, limit: 分页参数
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let posts = await getPosts();

  // 过滤状态
  const status = searchParams.get('status') || 'published';
  if (status !== 'all') {
    posts = posts.filter((p) => p.status === status);
  }

  // 分类过滤
  const categoryId = searchParams.get('category');
  if (categoryId) {
    posts = posts.filter((p) => p.categoryId === categoryId);
  }

  // 标签过滤
  const tagId = searchParams.get('tag');
  if (tagId) {
    posts = posts.filter((p) => p.tagIds.includes(tagId));
  }

  // 关键词搜索
  const q = searchParams.get('q');
  if (q) {
    const lowerQ = q.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQ) ||
        p.excerpt.toLowerCase().includes(lowerQ)
    );
  }

  // 排序：最新在前（草稿用 createdAt）
  posts.sort(
    (a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
  );

  // 分页
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '12', 10);
  const total = posts.length;
  const start = (page - 1) * limit;
  const paged = posts.slice(start, start + limit);

  return NextResponse.json({
    posts: paged,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/** POST /api/posts — 新建文章（需认证） */
export async function POST(req: NextRequest) {
  const token = getToken(req);
  if (!verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const body = await req.json();
  const post = await createPost(body);
  return NextResponse.json(post);
}

/** PUT /api/posts — 更新文章（需认证） */
export async function PUT(req: NextRequest) {
  const token = getToken(req);
  if (!verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: '缺少文章 ID' }, { status: 400 });
  }
  const post = await updatePost(body.id, body);
  if (!post) return NextResponse.json({ error: '未找到该文章' }, { status: 404 });
  return NextResponse.json(post);
}

/** DELETE /api/posts?id=xxx — 删除文章（需认证） */
export async function DELETE(req: NextRequest) {
  const token = getToken(req);
  if (!verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少文章 ID' }, { status: 400 });

  const ok = await deletePost(id);
  return NextResponse.json({ success: ok });
}
