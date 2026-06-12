import { NextRequest, NextResponse } from 'next/server';
import { getComments, getCommentsByPost, createComment, approveComment, deleteComment } from '@/lib/data';
import { getToken, verifyToken } from '@/lib/auth';

/**
 * GET /api/comments?postId=xxx — 获取指定文章的评论
 * POST /api/comments — 新建评论
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');
  if (postId) {
    return NextResponse.json(getCommentsByPost(postId));
  }
  // 管理员获取所有评论（需认证）
  const token = getToken(req);
  if (!verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  return NextResponse.json(getComments());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.postId || !body.content) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }
  const comment = createComment(body);
  return NextResponse.json(comment);
}

/** PUT /api/comments?id=xxx&action=approve — 审核评论（需认证） */
export async function PUT(req: NextRequest) {
  const token = getToken(req);
  if (!verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action');
  if (!id) return NextResponse.json({ error: '缺少评论 ID' }, { status: 400 });

  if (action === 'approve') {
    approveComment(id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: '无效操作' }, { status: 400 });
}

/** DELETE /api/comments?id=xxx — 删除评论（需认证） */
export async function DELETE(req: NextRequest) {
  const token = getToken(req);
  if (!verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少评论 ID' }, { status: 400 });
  deleteComment(id);
  return NextResponse.json({ success: true });
}
