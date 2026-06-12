import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUsers, saveUsers } from '@/lib/data';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Token 无效或已过期' }, { status: 401 });

  const body = await req.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: '请填写所有必填项' }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: '新密码至少需要 6 个字符' }, { status: 400 });
  }

  // 验证当前密码
  const users = await getUsers();
  const user = users.find((u) => u.id === payload.userId);
  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: '当前密码错误' }, { status: 400 });
  }

  // 更新密码
  const newHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = newHash;
  await saveUsers(users);

  return NextResponse.json({ message: '密码修改成功' });
}
