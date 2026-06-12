'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  approved: boolean;
  createdAt: string;
}

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
}

export default function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, author: name, email, content }),
      });
      if (res.ok) {
        setSubmitted(true);
        setContent('');
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      id="comments"
    >
      <h3 className="mb-6 text-xl font-bold">
        评论 ({comments.length})
      </h3>

      {/* 评论列表 */}
      <AnimatePresence>
        <div className="mb-10 space-y-4">
          {comments.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              还没有评论，快来抢沙发吧～ 🛋️
            </p>
          )}
          {comments.map((comment, i) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-xl p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white">
                  {comment.author.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{comment.author}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{comment.content}</p>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* 评论表单 */}
      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-6 text-center"
        >
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            评论已提交，审核通过后显示
          </p>
        </motion.div>
      ) : (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-heavy rounded-2xl p-6 space-y-4"
        >
          <h4 className="text-sm font-semibold">发表评论</h4>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="昵称 *"
              required
              className="glass w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none placeholder-gray-400 focus:ring-2 focus:ring-accent/50"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱（选填）"
              className="glass w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none placeholder-gray-400 focus:ring-2 focus:ring-accent/50"
            />
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的评论..."
            rows={3}
            required
            className="glass w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none placeholder-gray-400 focus:ring-2 focus:ring-accent/50"
          />

          <button
            type="submit"
            disabled={submitting || !name.trim() || !content.trim()}
            className="btn-premium text-sm disabled:opacity-50"
          >
            {submitting ? '提交中...' : '发布评论'}
          </button>
        </motion.form>
      )}
    </motion.section>
  );
}
