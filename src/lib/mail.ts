/**
 * 简单邮件发送 — 使用 nodemailer
 * 配置环境变量 MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS 后可用
 * 未配置时不发送邮件，仅打印到控制台
 */

interface SendResult {
  success: boolean;
  error?: string;
  code?: string;
}

/** 生成 6 位随机数字验证码 */
function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendVerifyCode(to: string): Promise<SendResult> {
  const code = generateCode();
  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env;

  if (!MAIL_HOST || !MAIL_USER || !MAIL_PASS) {
    // 未配置邮件服务时，打印到控制台（开发模式）
    if (process.env.NODE_ENV === 'development') {
      console.log(`[邮件] 发送到 ${to}，验证码：${code}`);
    }
    return { success: true, code };
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: Number(MAIL_PORT) || 587,
      secure: false,
      auth: { user: MAIL_USER, pass: MAIL_PASS },
    });

    await transporter.sendMail({
      from: `"瞬云的尽头" <${MAIL_USER}>`,
      to,
      subject: '瞬云的尽头 - 邮箱验证码',
      html: `<div style="max-width:480px;margin:0 auto;padding:30px;font-family:Arial,sans-serif">
        <h2 style="color:#06b6d4">瞬云的尽头 🌌</h2>
        <p>您的验证码是：</p>
        <p style="font-size:28px;font-weight:bold;color:#06b6d4;letter-spacing:4px">${code}</p>
        <p style="color:#999">5 分钟内有效，请勿泄露给他人。</p>
      </div>`,
    });
    return { success: true, code };
  } catch (err: any) {
    console.error('[mail] 发送失败:', err.message);
    return { success: false, error: '邮件发送失败' };
  }
}
