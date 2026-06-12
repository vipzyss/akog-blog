/**
 * GET /api/guestbook — 获取已审核留言（公开）
 * POST /api/guestbook — 发布留言（需登录）
 * PUT /api/guestbook?id=xxx&action=approve — 审核留言（需 admin）
 * DELETE /api/guestbook?id=xxx — 删除留言（需 admin）
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getGuestbookMessages,
  createGuestbookMessage,
  approveGuestbookMessage,
  deleteGuestbookMessage,
  getReaderById,
  getUserById,
} from '@/lib/data';
import { verifyToken, getToken } from '@/lib/auth';

/** 获取留言 — 公开只返回已审核，?all=true 返回全部（需 admin） */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get('all') === 'true';

  if (showAll) {
    const token = getToken(req);
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const all = getGuestbookMessages()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(all);
  }

  const messages = getGuestbookMessages()
    .filter((m) => m.approved)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(messages);
}

/** 发布留言 — 需登录 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { content } = body;
  if (!content || !content.trim()) {
    return NextResponse.json({ error: '请输入留言内容' }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: '留言内容不能超过 500 字' }, { status: 400 });
  }

  const token = getToken(req);
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: '请先登录后再留言' }, { status: 401 });
  }

  let author = payload.displayName || payload.username;
  if (payload.role === 'reader') {
    const reader = getReaderById(payload.userId);
    if (reader) author = reader.displayName || reader.username;
  } else {
    const user = getUserById(payload.userId);
    if (user) author = user.displayName || user.username;
  }

  const msg = createGuestbookMessage({
    author,
    content: content.trim(),
    readerId: payload.role === 'reader' ? payload.userId : undefined,
  });
  return NextResponse.json({ message: '留言已提交，等待审核' }, { status: 201 });
}

/** 审核/删除 — 需 admin */
export async function PUT(req: NextRequest) {
  const token = getToken(req);
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action');
  if (!id) return NextResponse.json({ error: '缺少留言 ID' }, { status: 400 });

  if (action === 'approve') {
    approveGuestbookMessage(id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: '无效操作' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const token = getToken(req);
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少留言 ID' }, { status: 400 });

  deleteGuestbookMessage(id);
  return NextResponse.json({ success: true });
}
