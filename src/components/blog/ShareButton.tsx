'use client';

import { useState, useCallback } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';

interface ShareButtonProps {
  title: string;
  url?: string;
}

export default function ShareButton({ title, url }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // 复制链接
  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  // 分享到 QQ
  const shareToQQ = useCallback(() => {
    const qqUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent('来自 瞬云的尽头')}&summary=&pics=`;
    window.open(qqUrl, '_blank', 'width=700,height=500');
  }, [shareUrl, title]);

  // QQ 空间
  const shareToQzone = useCallback(() => {
    const qzoneUrl = `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent('来自 瞬云的尽头')}`;
    window.open(qzoneUrl, '_blank', 'width=700,height=500');
  }, [shareUrl, title]);

  // 微信二维码
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="glass-heavy flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition hover:text-accent dark:text-gray-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        转发
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* 背景遮罩 */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            {/* 分享面板 */}
            <m.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass-heavy absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-white/10 p-4 shadow-xl backdrop-blur-xl"
            >
              <div className="mb-3 text-xs font-medium text-gray-500">分享到</div>

              {/* 分享选项 */}
              <div className="mb-3 grid grid-cols-3 gap-2">
                {/* 微信 */}
                <button
                  onClick={() => {}}
                  className="flex flex-col items-center gap-1 rounded-xl bg-white/5 p-3 transition hover:bg-green-500/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-lg">
                    💚
                  </div>
                  <span className="text-xs text-gray-500">微信</span>
                </button>

                {/* QQ */}
                <button
                  onClick={shareToQQ}
                  className="flex flex-col items-center gap-1 rounded-xl bg-white/5 p-3 transition hover:bg-blue-500/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-lg">
                    🐧
                  </div>
                  <span className="text-xs text-gray-500">QQ</span>
                </button>

                {/* QQ 空间 */}
                <button
                  onClick={shareToQzone}
                  className="flex flex-col items-center gap-1 rounded-xl bg-white/5 p-3 transition hover:bg-yellow-500/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20 text-lg">
                    ⭐
                  </div>
                  <span className="text-xs text-gray-500">QQ空间</span>
                </button>
              </div>

              {/* 微信二维码 */}
              <div className="mb-3 rounded-xl bg-white p-3">
                <p className="mb-2 text-center text-xs text-gray-500">微信扫码打开</p>
                <img
                  src={qrUrl}
                  alt="微信扫码分享"
                  className="mx-auto block h-[160px] w-[160px]"
                  loading="lazy"
                />
              </div>

              {/* 复制链接 */}
              <button
                onClick={copyLink}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-gray-600 transition hover:bg-white/10 dark:text-gray-300"
              >
                {copied ? (
                  <>
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    已复制
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    复制链接
                  </>
                )}
              </button>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
