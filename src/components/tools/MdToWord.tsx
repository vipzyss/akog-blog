'use client';

import { useState, useRef } from 'react';
import { motion as m } from 'framer-motion';

export default function MdToWord() {
  const [mdText, setMdText] = useState('');
  const [preview, setPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 简单的 Markdown → HTML 转换
  const renderMd = (text: string): string => {
    let html = text
      // 转义 HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // 标题
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // 粗体/斜体/删除线
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      // 行内代码
      .replace(/`(.+?)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;font-size:0.9em">$1</code>')
      // 代码块
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:#f5f5f5;padding:16px;border-radius:8px;overflow-x:auto"><code>$2</code></pre>')
      // 引用
      .replace(/^> (.+)$/gm, '<blockquote style="border-left:4px solid #06b6d4;padding:8px 16px;margin:8px 0;color:#666">$1</blockquote>')
      // 水平线
      .replace(/^---$/gm, '<hr style="border:none;border-top:2px solid #eee;margin:16px 0">')
      // 无序列表
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // 有序列表
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // 链接
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#06b6d4">$1</a>')
      // 图片
      .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0">')
      // 段落（连续非空行）
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hoipbld]|<hr|<li)(.+)$/gm, (match) => {
        // 如果已经是HTML标签包裹的就不加p
        if (match.startsWith('<') || match.startsWith('</')) return match;
        if (match.startsWith('- ') || match.match(/^\d+\. /)) return match;
        return match;
      });

    // 处理列表包裹
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      return `<ul style="padding-left:24px;margin:8px 0">${match}</ul>`;
    });

    return `<html>
<head>
<meta charset="utf-8">
<title>Markdown 文档</title>
<style>
body { font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; padding: 40px; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto; }
h1 { font-size: 28px; border-bottom: 2px solid #06b6d4; padding-bottom: 8px; }
h2 { font-size: 22px; color: #06b6d4; }
h3 { font-size: 18px; }
img { max-width: 100%; border-radius: 8px; }
a { color: #06b6d4; }
pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
code { font-family: 'Consolas', 'Courier New', monospace; }
blockquote { border-left: 4px solid #06b6d4; padding: 8px 16px; margin: 8px 0; color: #666; background: #f9f9f9; border-radius: 0 8px 8px 0; }
hr { border: none; border-top: 2px solid #eee; margin: 24px 0; }
</style>
</head>
<body>
<p>${html}</p>
</body>
</html>`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMdText(ev.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const downloadWord = () => {
    if (!mdText.trim()) return;
    const htmlContent = renderMd(mdText);
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="glass-heavy rounded-2xl p-6 space-y-4">
        {/* 工具栏 */}
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="glass-light rounded-xl px-4 py-2 text-sm transition hover:text-accent"
          >
            📂 导入 .md 文件
          </button>
          <button
            onClick={() => setPreview(!preview)}
            className={`glass-light rounded-xl px-4 py-2 text-sm transition ${preview ? 'bg-accent text-white' : 'hover:text-accent'}`}
          >
            {preview ? '✏️ 编辑' : '👁️ 预览'}
          </button>
          <button
            onClick={downloadWord}
            disabled={!mdText.trim()}
            className="btn-premium text-sm !px-4 !py-2 disabled:opacity-50 ml-auto"
          >
            ⬇️ 下载 Word
          </button>
        </div>

        {/* 编辑区 / 预览区 */}
        {preview ? (
          <div
            className="glass rounded-xl min-h-[300px] p-6 overflow-auto prose max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMd(mdText) }}
          />
        ) : (
          <textarea
            value={mdText}
            onChange={(e) => setMdText(e.target.value)}
            placeholder="在此粘贴 Markdown 内容，或导入 .md 文件..."
            className="glass w-full min-h-[300px] rounded-xl p-6 text-sm font-mono outline-none placeholder-gray-400 resize-y"
            rows={15}
          />
        )}

        {/* 使用说明 */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>💡 支持标准 Markdown 语法：标题、粗体、斜体、列表、代码块、引用、链接、图片</p>
          <p>📄 导出为 .doc 文件，可用 Word / WPS 打开编辑</p>
        </div>
      </div>
    </div>
  );
}
