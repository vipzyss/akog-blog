/**
 * GET /api/friend-links — 获取所有友链（公开）
 * POST /api/friend-links — 新建友链（需认证）
 * PUT /api/friend-links — 更新友链（需认证）
 * DELETE /api/friend-links?id=xxx — 删除友链（需认证）
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getFriendLinks,
  createFriendLink,
  updateFriendLink,
  deleteFriendLink,
} from '@/lib/data';
import { getToken, verifyToken } from '@/lib/auth';

/** 获取所有友链 — 公开接口 */
export async function GET() {
  const links = (await getFriendLinks()).sort((a, b) => a.sort - b.sort);
  return NextResponse.json(links);
}

/** 新建友链 — 需认证 */
export async function POST(req: NextRequest) {
  const token = getToken(req);
  if (!verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const body = await req.json();
  if (!body.name || !body.url) {
    return NextResponse.json({ error: '请填写友链名称和链接' }, { status: 400 });
  }

  const link = await createFriendLink({
    name: body.name,
    url: body.url,
    logo: body.logo || '',
  });

  return NextResponse.json(link, { status: 201 });
}

/** 更新友链 — 需认证 */
export async function PUT(req: NextRequest) {
  const token = getToken(req);
  if (!verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: '缺少友链 ID' }, { status: 400 });
  }

  const link = await updateFriendLink(body.id, {
    name: body.name,
    url: body.url,
    logo: body.logo,
    sort: body.sort,
  });

  if (!link) return NextResponse.json({ error: '未找到该友链' }, { status: 404 });
  return NextResponse.json(link);
}

/** 删除友链 — 需认证 */
export async function DELETE(req: NextRequest) {
  const token = getToken(req);
  if (!verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少友链 ID' }, { status: 400 });

  await deleteFriendLink(id);
  return NextResponse.json({ success: true });
}
