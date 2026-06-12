import { NextResponse } from 'next/server';
import { getToken, verifyToken } from '@/lib/auth';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getReaders,
  createReader,
  deleteReader,
  updateReader,
} from '@/lib/data';
import { hashSync } from 'bcryptjs';

export async function GET(req: Request) {
  const token = getToken(req as any);
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  // 后台用户（admin + author）
  const users = getUsers().map(({ passwordHash, ...u }) => ({
    ...u,
    accountType: 'admin' as const,
  }));

  // 前台读者
  const readers = getReaders().map(({ passwordHash, ...r }) => ({
    id: r.id,
    username: r.username,
    displayName: r.displayName || r.username,
    email: r.email,
    role: 'reader' as const,
    createdAt: r.createdAt,
    accountType: 'reader' as const,
  }));

  return NextResponse.json({ users, readers, total: users.length + readers.length });
}

export async function POST(req: Request) {
  const token = getToken(req as any);
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { username, displayName, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ error: '请填写所有必填项' }, { status: 400 });
    }
    // 用户名格式验证
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: '用户名只能包含英文字母、数字和下划线' }, { status: 400 });
    }
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: '用户名长度需要在 3-20 个字符之间' }, { status: 400 });
    }

    // 检查是否已存在于后台用户
    const existingUser = getUsers().find(
      (u) => u.username === username || u.email === email
    );
    if (existingUser) {
      return NextResponse.json({ error: '用户名或邮箱已被后台账号使用' }, { status: 400 });
    }

    // 检查是否已存在于读者
    const existingReader = getReaders().find(
      (r) => r.username === username || r.email === email
    );
    if (existingReader) {
      return NextResponse.json({ error: '用户名或邮箱已被读者账号使用' }, { status: 400 });
    }

    const user = createUser({
      username,
      displayName,
      email,
      passwordHash: hashSync(password, 10),
      role: 'author', // 新建用户均为普通用户组，仅 shunyun 为管理员
    });

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ user: { ...safeUser, accountType: 'admin' } });
  } catch {
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const token = getToken(req as any);
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, type, displayName, email, password, role } = body;

    if (!id || !type) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    if (type === 'reader') {
      const updateData: any = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (email !== undefined) updateData.email = email;
      if (password) updateData.passwordHash = hashSync(password, 10);

      // 如果要将读者升级为后台用户
      if (role === 'editor' || role === 'admin') {
        const reader = getReaders().find((r) => r.id === id);
        if (!reader) {
          return NextResponse.json({ error: '读者不存在' }, { status: 404 });
        }
        // 从 readers.json 移除，添加到 users.json
        deleteReader(id);
        const newUser = createUser({
          username: reader.username,
          displayName: displayName || reader.displayName || reader.username,
          email: email || reader.email,
          passwordHash: password ? hashSync(password, 10) : reader.passwordHash,
        });
        const { passwordHash: _, ...safeUser } = updateUser(newUser.id, { role: (role === 'admin' ? 'admin' : 'editor') as 'admin' | 'editor' })!;
        return NextResponse.json({ user: { ...safeUser, accountType: 'admin' } });
      }

      const updated = updateReader(id, updateData);
      if (!updated) {
        return NextResponse.json({ error: '读者不存在' }, { status: 404 });
      }
      const { passwordHash, ...safeReader } = updated;
      return NextResponse.json({ user: { ...safeReader, role: 'reader', accountType: 'reader' } });
    }

    // 后台用户
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (email !== undefined) updateData.email = email;
    if (password) updateData.passwordHash = hashSync(password, 10);

    // 角色变更（仅 shunyun 可设为 admin）
    if (role && role !== 'admin' && role !== 'editor' && role !== 'reader') {
      return NextResponse.json({ error: '无效的角色' }, { status: 400 });
    }
    if (role === 'admin' && payload.username !== 'shunyun') {
      return NextResponse.json({ error: '只有 shunyun 可以设为最高管理员' }, { status: 403 });
    }
    if (role) {
      // 如果降级为读者：从 users.json 移到 readers.json
      if (role === 'reader') {
        const user = getUsers().find((u) => u.id === id);
        if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });
        deleteUser(id);
        createReader({
          username: user.username,
          displayName: displayName || user.displayName || user.username,
          email: email || user.email,
          passwordHash: password ? hashSync(password, 10) : user.passwordHash,
        });
        return NextResponse.json({ success: true, user: { id, username: user.username, role: 'reader', accountType: 'reader' } });
      }
      updateData.role = role;
    }

    const updated = updateUser(id, updateData);
    if (!updated) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }
    const { passwordHash: _, ...safeUser } = updated;
    return NextResponse.json({ user: { ...safeUser, accountType: 'admin' } });
  } catch {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const token = getToken(req as any);
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'admin'; // 'admin' | 'reader'

  if (!id) {
    return NextResponse.json({ error: '缺少用户 ID' }, { status: 400 });
  }

  // 不能删除自己
  if (type === 'admin' && id === payload.userId) {
    return NextResponse.json({ error: '不能删除当前登录的账号' }, { status: 400 });
  }

  try {
    if (type === 'reader') {
      const success = deleteReader(id);
      if (!success) {
        return NextResponse.json({ error: '读者不存在' }, { status: 404 });
      }
    } else {
      const success = deleteUser(id);
      if (!success) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
