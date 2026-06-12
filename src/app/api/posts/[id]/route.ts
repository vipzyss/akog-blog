import { NextRequest, NextResponse } from 'next/server';
import { getPostById, getPostBySlug, updatePost, deletePost } from '@/lib/data';
import { getToken, verifyToken } from '@/lib/auth';

/**
 * GET /api/posts/[id] — 获取单篇文章
 * 支持 by=slug 或 by=id 查询参数
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const by = searchParams.get('by') || 'id';
  let post = null;

  if (by === 'slug') {
    post = getPostBySlug(id);
  } else {
    post = getPostById(id);
  }

  if (!post) return NextResponse.json({ error: '未找到该文章' }, { status: 404 });
  return NextResponse.json(post);
}

/** PUT /api/posts/[id] — 更新文章（需认证） */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(req);
  if (!verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const post = updatePost(id, body);
  if (!post) return NextResponse.json({ error: '未找到该文章' }, { status: 404 });
  return NextResponse.json(post);
}

/** DELETE /api/posts/[id] — 删除文章（需认证） */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(req);
  if (!verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await params;
  const ok = deletePost(id);
  return NextResponse.json({ success: ok });
}
