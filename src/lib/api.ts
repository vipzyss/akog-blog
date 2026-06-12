/**
 * 客户端 API 调用工具
 */

const API_BASE = '/api';

// ==================== 通用请求封装 ====================

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: HeadersInit = { ...options.headers };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T = any>(path: string, token?: string) =>
    request<T>(path, { method: 'GET' }, token),

  post: <T = any>(path: string, body?: unknown, token?: string) =>
    request<T>(
      path,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      },
      token,
    ),

  put: <T = any>(path: string, body?: unknown, token?: string) =>
    request<T>(
      path,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      },
      token,
    ),

  del: (path: string, token?: string) =>
    request<void>(path, { method: 'DELETE' }, token),
};

// ==================== Token 管理 ====================

/** 获取后台管理员 token */
export function getAdminToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token') || '';
  }
  return '';
}

/** 保存后台管理员 token */
export function setAdminToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
}

/** 清除后台管理员 token */
export function clearAdminToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}

/** 获取前台读者 token */
export function getReaderToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('reader_token') || '';
  }
  return '';
}

/** 保存前台读者 token */
export function setReaderToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('reader_token', token);
  }
}

/** 清除前台读者 token */
export function clearReaderToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('reader_token');
  }
}

// ==================== 兼容导出（旧代码使用） ====================
/** @deprecated 使用 api.get 替代 */
export const apiGet = api.get;
/** @deprecated 使用 api.post 替代 */
export const apiPost = api.post;
/** @deprecated 使用 api.put 替代 */
export const apiPut = api.put;
/** @deprecated 使用 api.del 替代 */
export const apiDelete = api.del;
/** @deprecated 使用 getAdminToken 替代 */
export const getAuthToken = getAdminToken;
/** @deprecated 使用 setAdminToken 替代 */
export const setAuthToken = setAdminToken;
/** @deprecated 使用 clearAdminToken 替代 */
export const clearAuthToken = clearAdminToken;

// ==================== 认证接口封装 ====================

interface LoginResult {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}

interface RegisterResult {
  success: boolean;
  token?: string;
  displayName?: string;
  error?: string;
}

/** 管理员登录 */
export async function loginAdmin(
  identifier: string,
  password: string,
  captchaId?: string,
  captchaCode?: string,
): Promise<LoginResult> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, captchaId, captchaCode }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      setAdminToken(data.token);
      return { success: true, token: data.token, user: data.user };
    }

    return { success: false, error: data.error || '登录失败' };
  } catch (err: any) {
    return { success: false, error: err.message || '网络错误' };
  }
}

/** 读者登录 */
export async function loginReader(
  identifier: string,
  password: string,
  captchaId?: string,
  captchaCode?: string,
): Promise<LoginResult> {
  try {
    const res = await fetch('/api/auth/reader-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, captchaId, captchaCode }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      setReaderToken(data.token);
      return { success: true, token: data.token, user: data.reader };
    }

    return { success: false, error: data.error || '登录失败' };
  } catch (err: any) {
    return { success: false, error: err.message || '网络错误' };
  }
}

/** 读者注册 */
export async function registerReader(data: {
  username: string;
  displayName?: string;
  email: string;
  password: string;
  verifyCode?: string;
}): Promise<RegisterResult> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: data.username,
        displayName: data.displayName,
        email: data.email,
        password: data.password,
        confirmPassword: data.password,
        verifyCode: data.verifyCode,
      }),
    });

    const result = await res.json();

    if (res.ok && result.token) {
      setReaderToken(result.token);
      return { success: true, token: result.token, displayName: result.displayName };
    }

    return { success: false, error: result.error || '注册失败' };
  } catch (err: any) {
    return { success: false, error: err.message || '网络错误' };
  }
}
