/**
 * 登录验证码模块 — 4位数字，5分钟有效
 * 数据存储在 data/captcha-codes.json
 */
import path from 'path';
import { readJSON, writeJSON } from './data';

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const CAPTCHA_FILE = path.join(DATA_DIR, 'captcha-codes.json');
const EXPIRE_MS = 5 * 60 * 1000; // 5 分钟

interface CaptchaEntry {
  id: string;
  code: string;
  expiresAt: number;
}

let idCounter = 0;

function genId(): string {
  return `c${Date.now()}-${++idCounter}`;
}

/** 生成新的验证码，返回 { id, code } */
export function createCaptcha(): { id: string; code: string } {
  const codes = readJSON<CaptchaEntry[]>(CAPTCHA_FILE, []);
  // 清理过期
  const now = Date.now();
  const valid = codes.filter((c) => c.expiresAt > now);

  const code = String(Math.floor(1000 + Math.random() * 9000));
  const entry: CaptchaEntry = {
    id: genId(),
    code,
    expiresAt: now + EXPIRE_MS,
  };
  valid.push(entry);
  writeJSON(CAPTCHA_FILE, valid);
  return { id: entry.id, code };
}

/** 校验验证码（不删除，允许多次尝试） */
export function verifyCaptcha(id: string, code: string): boolean {
  const codes = readJSON<CaptchaEntry[]>(CAPTCHA_FILE, []);
  const now = Date.now();
  const match = codes.find((c) => c.id === id && c.expiresAt > now);
  if (!match) return false;
  return match.code === code;
}

/** 消耗验证码（登录成功后调用，防止重复使用） */
export function consumeCaptcha(id: string): void {
  const codes = readJSON<CaptchaEntry[]>(CAPTCHA_FILE, []);
  writeJSON(CAPTCHA_FILE, codes.filter((c) => c.id !== id));
}
