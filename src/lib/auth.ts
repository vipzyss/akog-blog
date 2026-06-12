import { compareSync, hashSync } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import {
  getUserByIdentifier,
  getReaderByIdentifier,
  createReader,
  getUsers,
  getUserById,
  getReaderById,
  saveUsers,
} from './data';

const JWT_SECRET = process.env.JWT_SECRET || 'akog-blog-secret-change-in-production';

// ==================== JWT 工具 ====================

export interface TokenPayload {
  userId: string;
  role: 'admin' | 'editor' | 'author' | 'reader';
  username: string;       // 英文登录标识符
  displayName?: string;    // 显示名称
}

export function generateToken(payload: TokenPayload): string {
  return sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string | null): TokenPayload | null {
  if (!token) return null;
  try {
    return verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

// ==================== 后台用户登录 ====================

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: { 
    id: string; 
    username: string; 
    displayName?: string; 
    email: string; 
    role: string 
  };
  error?: string;
}

export function loginAdmin(identifier: string, password: string): AuthResult {
  const user = getUserByIdentifier(identifier);
  if (!user) {
    return { success: false, error: '用户不存在' };
  }
  if (!compareSync(password, user.passwordHash)) {
    return { success: false, error: '密码错误' };
  }
  const payload: TokenPayload = {
    userId: user.id,
    role: user.role,
    username: user.username,
    displayName: user.displayName || user.username,
  };
  return {
    success: true,
    token: generateToken(payload),
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      email: user.email,
      role: user.role,
    },
  };
}

export function changeAdminPassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  const users = getUsers();
  const targetIdx = users.findIndex((u) => u.id === userId);
  if (targetIdx === -1) return { success: false, error: '用户不存在' };
  if (!compareSync(oldPassword, users[targetIdx].passwordHash)) {
    return { success: false, error: '原密码错误' };
  }
  users[targetIdx].passwordHash = hashSync(newPassword, 10);
  saveUsers(users);
  return { success: true };
}

// ==================== 前台读者注册/登录 ====================

export interface ReaderAuthResult {
  success: boolean;
  token?: string;
  reader?: { id: string; username: string; displayName?: string; email: string };
  error?: string;
}

// 用户名正则：只允许英文、数字、下划线，6-20 位
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.length < 6) {
    return { valid: false, error: '用户名至少 6 个字符' };
  }
  if (username.length > 20) {
    return { valid: false, error: '用户名最多 20 个字符' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: '用户名只能包含英文字母、数字和下划线' };
  }
  return { valid: true };
}

export function registerReader(data: {
  username: string;
  displayName?: string;
  email: string;
  password: string;
}): ReaderAuthResult {
  const v = validateUsername(data.username);
  if (!v.valid) {
    return { success: false, error: v.error };
  }
  const existingUser = getUserByIdentifier(data.username) || getUserByIdentifier(data.email);
  if (existingUser) {
    return { success: false, error: '用户名或邮箱已被后台账号使用' };
  }
  const existingReader = getReaderByIdentifier(data.username) || getReaderByIdentifier(data.email);
  if (existingReader) {
    return { success: false, error: '用户名或邮箱已被注册' };
  }
  const reader = createReader({
    username: data.username,
    displayName: data.displayName || data.username,
    email: data.email,
    passwordHash: hashSync(data.password, 10),
  });
  const payload: TokenPayload = {
    userId: reader.id,
    role: 'reader',
    username: reader.username,
    displayName: reader.displayName || reader.username,
  };
  return {
    success: true,
    token: generateToken(payload),
    reader: {
      id: reader.id,
      username: reader.username,
      displayName: reader.displayName || reader.username,
      email: reader.email,
    },
  };
}

export function loginReader(identifier: string, password: string): ReaderAuthResult {
  const reader = getReaderByIdentifier(identifier);
  if (!reader) {
    return { success: false, error: '用户不存在' };
  }
  if (!compareSync(password, reader.passwordHash)) {
    return { success: false, error: '密码错误' };
  }
  const payload: TokenPayload = {
    userId: reader.id,
    role: 'reader',
    username: reader.username,
    displayName: reader.displayName || reader.username,
  };
  return {
    success: true,
    token: generateToken(payload),
    reader: {
      id: reader.id,
      username: reader.username,
      displayName: reader.displayName || reader.username,
      email: reader.email,
    },
  };
}

// ==================== 获取当前登录用户 ====================

export function getCurrentUser(token: string | null): {
  user?: { id: string; username: string; displayName?: string; email: string; role: string; avatar?: string } | null;
  reader?: { id: string; username: string; displayName?: string; email: string; avatar?: string } | null;
  payload?: TokenPayload;
} {
  const payload = verifyToken(token);
  if (!payload) return {};
  if (payload.role === 'reader') {
    const reader = getReaderById(payload.userId);
    return { reader: reader ? { id: reader.id, username: reader.username, displayName: reader.displayName, email: reader.email, avatar: reader.avatar } : undefined, payload };
  }
  const user = getUserById(payload.userId);
  return { user: user ? { id: user.id, username: user.username, displayName: user.displayName, email: user.email, role: user.role, avatar: user.avatar } : undefined, payload };
}
