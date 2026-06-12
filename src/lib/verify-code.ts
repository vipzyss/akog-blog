/**
 * 邮箱验证码模块
 * - 6位数字验证码，5分钟有效
 * - 同一邮箱60秒内不可重复发送
 * - 数据存储在 data/verify-codes.json
 */

import path from 'path';
import { readJSON, writeJSON } from './data';

interface VerifyCode {
  email: string;
  code: string;
  expiresAt: number;  // Unix 毫秒
  createdAt: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CODES_FILE = path.join(DATA_DIR, 'verify-codes.json');
const CODE_LENGTH = 6;
const CODE_EXPIRE_MS = 5 * 60 * 1000;   // 5 分钟
const RESEND_COOLDOWN_MS = 60 * 1000;    // 60 秒冷却

/** 读取所有验证码 */
function getCodes(): VerifyCode[] {
  return readJSON<VerifyCode[]>(CODES_FILE, []);
}

/** 保存验证码列表 */
function saveCodes(codes: VerifyCode[]): void {
  writeJSON(CODES_FILE, codes);
}

/** 清理过期验证码 */
function cleanExpired(): void {
  const now = Date.now();
  saveCodes(getCodes().filter((c) => c.expiresAt > now));
}

/** 生成 6 位随机数字验证码 */
function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** 检查是否可以发送验证码（冷却检查） */
export function canSendCode(email: string): { ok: boolean; waitSeconds?: number } {
  cleanExpired();
  const codes = getCodes();
  const latest = codes
    .filter((c) => c.email === email)
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  if (latest && Date.now() - latest.createdAt < RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt)) / 1000);
    return { ok: false, waitSeconds };
  }
  return { ok: true };
}

/** 创建一个新的验证码 */
export function createVerifyCode(email: string): string {
  cleanExpired();
  const code = generateCode();
  const codes = getCodes();

  // 删除该邮箱的旧验证码
  const filtered = codes.filter((c) => c.email !== email);
  filtered.push({
    email,
    code,
    expiresAt: Date.now() + CODE_EXPIRE_MS,
    createdAt: Date.now(),
  });

  saveCodes(filtered);
  return code;
}

/** 验证邮箱验证码 */
export function verifyCode(email: string, code: string): boolean {
  cleanExpired();
  const codes = getCodes();
  const match = codes.find(
    (c) => c.email === email && c.code === code && c.expiresAt > Date.now()
  );
  if (!match) return false;

  // 验证成功后删除该验证码（一次性）
  saveCodes(codes.filter((c) => c !== match));
  return true;
}
