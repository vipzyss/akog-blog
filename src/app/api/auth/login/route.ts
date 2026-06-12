import { NextResponse } from 'next/server';
import { loginAdmin } from '@/lib/auth';
import { verifyCaptcha, consumeCaptcha } from '@/lib/captcha';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password, captchaId, captchaCode } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: '请输入用户名/邮箱和密码' },
        { status: 400 }
      );
    }

    // 验证码校验
    if (!captchaId || !captchaCode) {
      return NextResponse.json({ error: '请输入验证码' }, { status: 400 });
    }
    if (!verifyCaptcha(captchaId, captchaCode)) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
    }

    const result = loginAdmin(identifier, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // 仅 admin 和 editor 可登录后台
    if (result.user?.role !== 'admin' && result.user?.role !== 'editor') {
      return NextResponse.json(
        { error: '仅管理员可登录后台，普通用户请使用前台登录' },
        { status: 403 }
      );
    }

    consumeCaptcha(captchaId);

    return NextResponse.json({
      token: result.token,
      user: result.user,
    });
  } catch (err: any) {
    console.error('[LOGIN ERROR]', err);
    return NextResponse.json(
      { error: '登录失败：' + String(err?.message || err) },
      { status: 500 }
    );
  }
}
