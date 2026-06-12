'use client';

import { useState } from 'react';

interface FileShareBlockProps {
  url: string;
  code: string;
  name: string;
}

export default function FileShareBlock({ url, code, name }: FileShareBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-6 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border-2 border-blue-400/60 bg-blue-500/5 p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-sm">☁️</span>
          <span className="text-sm font-bold text-blue-500">{name}</span>
        </div>

        <div className="mb-3 truncate rounded-lg bg-white/10 px-3 py-2 text-xs text-gray-500">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            {url}
          </a>
        </div>

        <div className="flex items-center gap-2">
          {code ? (
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 rounded-xl bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-500 transition hover:bg-blue-500/30"
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  已复制
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  复制提取码
                </>
              )}
            </button>
          ) : null}

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            打开链接
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
