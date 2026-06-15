'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import { motion } from 'framer-motion';
import { getAdminToken, getReaderToken } from '@/lib/api';
import { FileShareExtension } from '@/lib/extensions/FileShare';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** 自动保存的 key，用于区分不同文章的草稿 */
  draftKey?: string;
}

const DRAFT_INTERVAL = 30000; // 30秒自动保存

export default function TipTapEditor({ content, onChange, placeholder, draftKey }: TipTapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'saved' | 'saving' | ''>('');
  const lastContentRef = useRef(content);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ImageExtension.configure({
        HTMLAttributes: { class: 'rounded-xl shadow-lg my-4 max-w-full h-auto' },
      }),
      LinkExtension.configure({
        openOnClick: false,
      }),
      FileShareExtension,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose-custom min-h-[400px] p-6 outline-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    immediatelyRender: false,
  });

  // 自动保存草稿到 localStorage
  const saveDraft = useCallback(() => {
    if (!editor || !draftKey) return;
    const html = editor.getHTML();
    if (html === lastContentRef.current) return;
    setDraftStatus('saving');
    try {
      localStorage.setItem(`draft_${draftKey}`, html);
      lastContentRef.current = html;
      setDraftStatus('saved');
      setTimeout(() => setDraftStatus(''), 2000);
    } catch {
      // localStorage 满了忽略
    }
  }, [editor, draftKey]);

  // 定时保存
  useEffect(() => {
    if (!draftKey) return;
    timerRef.current = setInterval(saveDraft, DRAFT_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [saveDraft, draftKey]);

  // 页面关闭/刷新前保存
  useEffect(() => {
    if (!draftKey) return;
    const handleBeforeUnload = () => {
      if (editor) {
        const html = editor.getHTML();
        if (html !== lastContentRef.current) {
          localStorage.setItem(`draft_${draftKey}`, html);
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editor, draftKey]);

  // 从 localStorage 恢复草稿
  useEffect(() => {
    if (!editor || !draftKey) return;
    const saved = localStorage.getItem(`draft_${draftKey}`);
    if (saved && saved !== content) {
      const restore = window.confirm('检测到未保存的草稿，是否恢复？');
      if (restore) {
        editor.commands.setContent(saved);
        onChange(saved);
        lastContentRef.current = saved;
      } else {
        localStorage.removeItem(`draft_${draftKey}`);
      }
    }
  }, [editor, draftKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 上传图片到服务器并插入编辑器 */
  const uploadAndInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('仅支持 JPG/PNG/GIF/WebP 格式');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    setUploadingImg(true);
    const token = getAdminToken() || getReaderToken();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      } else {
        alert(data.error || '上传失败');
      }
    } catch {
      alert('上传失败，请重试');
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!editor) {
    return (
      <div className="glass rounded-xl p-6 min-h-[400px] flex items-center justify-center">
        <p className="text-gray-400">加载编辑器中...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* 隐藏的文件选取器 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={uploadAndInsertImage}
      />

      {/* 工具栏 */}
      <div className="flex flex-wrap gap-1 border-b border-white/10 p-3">
        <ToolButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          label="B"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          label="I"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          label="S̶"
        />
        <div className="mx-1 w-px bg-white/10" />
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          label="H1"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          label="H2"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          label="H3"
        />
        <div className="mx-1 w-px bg-white/10" />
        <ToolButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          label="•"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          label="1."
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          label="❝"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          label="&lt;/&gt;"
        />
        <div className="mx-1 w-px bg-white/10" />

        {/* 排版工具 */}
        <ToolButton
          onClick={() => {
            editor.chain().focus().unsetAllMarks().clearNodes().run();
          }}
          label="🧹"
          title="清除格式"
        />
        <ToolButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          label="—"
          title="插入分割线"
        />
        <ToolButton
          onClick={() => {
            editor.chain().focus().setParagraph().run();
          }}
          active={editor.isActive('paragraph')}
          label="¶"
          title="正文段落"
        />

        <div className="mx-1 w-px bg-white/10" />

        {/* 图片上传按钮 */}
        <ToolButton
          onClick={() => fileInputRef.current?.click()}
          label={uploadingImg ? '⏳' : '🖼'}
          title="上传图片"
        />

        <ToolButton
          onClick={() => {
            const url = prompt('网盘链接地址：');
            if (!url) return;
            const code = prompt('提取码（可选）：') || '';
            const name = prompt('链接名称（可选，默认"网盘链接"）：') || '网盘链接';
            editor.chain().focus().insertFileShare({ url, code, name }).run();
          }}
          label="☁️"
          title="插入网盘分享链接"
        />

        <ToolButton
          onClick={() => {
            const url = prompt('链接地址：');
            if (url) editor.chain().focus().toggleLink({ href: url }).run();
          }}
          active={editor.isActive('link')}
          label="🔗"
        />

        {/* 草稿自动保存状态 */}
        {draftKey && (
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
            {draftStatus === 'saving' && (
              <span className="text-accent animate-pulse">保存中...</span>
            )}
            {draftStatus === 'saved' && (
              <span className="text-green-500">✓ 已自动保存</span>
            )}
            {!draftStatus && draftKey && (
              <span className="opacity-50">自动保存</span>
            )}
          </div>
        )}
      </div>

      {/* 上传进度提示 */}
      {uploadingImg && (
        <div className="px-3 py-2 text-xs text-accent animate-pulse">图片上传中...</div>
      )}

      {/* 编辑区域 */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolButton({ onClick, active, label, title }: { onClick: () => void; active?: boolean; label: string; title?: string }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title={title}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-accent text-white'
          : 'text-gray-500 hover:bg-white/10 hover:text-foreground'
      }`}
    >
      {label}
    </motion.button>
  );
}
