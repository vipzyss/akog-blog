import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateUser, getUsers, saveUsers } from '@/lib/data';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { user, reader, payload } = await getCurrentUser(token);
  if (!payload) return NextResponse.json({ error: 'Token 无效或已过期' }, { status: 401 });

  // 后台用户
  if (user) {
    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      bio: (user as any).bio || '',
    });
  }

  // 前台读者
  if (reader) {
    return NextResponse.json({
      id: reader.id,
      username: reader.username,
      displayName: reader.displayName || reader.username,
      email: reader.email,
      role: 'reader',
      avatar: reader.avatar || '',
      bio: '',
    });
  }

  return NextResponse.json({ error: '用户不存在' }, { status: 404 });
}

export async function PUT(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { user, reader, payload } = await getCurrentUser(token);
  if (!payload) return NextResponse.json({ error: 'Token 无效或已过期' }, { status: 401 });

  const body = await req.json();
  const { displayName, email, bio, avatar } = body;

  // 验证邮箱格式
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
  }

  // 更新用户信息（仅后台用户支持完整更新）
  if (user) {
    // 检查邮箱是否被其他用户使用
    const users = await getUsers();
    const emailExists = users.find((u) => u.email === email && u.id !== payload.userId);
    if (emailExists) {
      return NextResponse.json({ error: '该邮箱已被其他用户使用' }, { status: 400 });
    }

    const updatedUser = await updateUser(payload.userId, {
      displayName,
      email,
      bio,
      avatar,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({
      message: '更新成功',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName || updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar || '',
        bio: updatedUser.bio || '',
      },
    });
  }

  return NextResponse.json({ error: '暂不支持读者编辑个人信息' }, { status: 400 });
}
