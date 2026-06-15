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
  parentId?: string | null;
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
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // 构建嵌套结构
  const topLevelComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  const handleSubmit = async (e: React.FormEvent, parentId?: string | null) => {
    e.preventDefault();
    if (!content.trim() || !name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, author: name, email, content, parentId }),
      });
      if (res.ok) {
        setSubmitted(true);
        setContent('');
        setReplyTo(null);
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
          {topLevelComments.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              还没有评论，快来抢沙发吧～ 🛋️
            </p>
          )}
          {topLevelComments.map((comment, i) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              getReplies={getReplies}
              depth={0}
              delay={i * 0.08}
              onReply={(id) => {
                setReplyTo(id);
                setName('');
                setContent('');
              }}
              replying={replyTo === comment.id}
              onSubmit={(e) => handleSubmit(e, comment.id)}
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              content={content}
              setContent={setContent}
              submitting={submitting}
            />
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
          <p className="mb-2 text-3xl">🎉</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            评论已提交，审核通过后显示
          </p>
        </motion.div>
      ) : !replyTo && (
        <CommentForm
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          content={content}
          setContent={setContent}
          submitting={submitting}
          onSubmit={(e) => handleSubmit(e)}
          label="发表评论"
        />
      )}
    </motion.section>
  );
}

// ==================== 单个评论项（递归支持嵌套） ====================

function CommentItem({
  comment, replies, getReplies, depth, delay,
  onReply, replying, onSubmit,
  name, setName, email, setEmail, content, setContent, submitting,
}: {
  comment: Comment;
  replies: Comment[];
  getReplies: (parentId: string) => Comment[];
  depth: number;
  delay: number;
  onReply: (id: string) => void;
  replying: boolean;
  onSubmit: (e: React.FormEvent) => void;
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  content: string; setContent: (v: string) => void;
  submitting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className={`glass rounded-xl p-4 ${depth > 0 ? 'border-l-2 border-accent/30 ml-4' : ''}`}>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white">
            {comment.author.charAt(0)}
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{comment.author}</p>
            <p className="text-xs text-gray-400">
              {new Date(comment.createdAt).toLocaleDateString('zh-CN', {
                year: 'numeric', month: 'short', day: 'numeric'
              })}
            </p>
          </div>
          {depth < 3 && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-accent hover:underline"
            >
              回复
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{comment.content}</p>
      </div>

      {/* 回复输入框 */}
      {replying && (
        <div className="ml-8 mt-3">
          <CommentForm
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            content={content}
            setContent={setContent}
            submitting={submitting}
            onSubmit={onSubmit}
            label="提交回复"
            compact
          />
        </div>
      )}

      {/* 子回复（递归） */}
      {replies.map((reply, j) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          replies={getReplies(reply.id)}
          getReplies={getReplies}
          depth={depth + 1}
          delay={delay + 0.04}
          onReply={onReply}
          replying={false}
          onSubmit={onSubmit}
          name={name} setName={setName}
          email={email} setEmail={setEmail}
          content={content} setContent={setContent}
          submitting={submitting}
        />
      ))}
    </motion.div>
  );
}

// ==================== 评论表单 ====================

function CommentForm({
  name, setName, email, setEmail, content, setContent, submitting, onSubmit, label, compact,
}: {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  content: string; setContent: (v: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${compact ? 'glass rounded-xl p-4' : 'glass-heavy rounded-2xl p-6'} space-y-3`}
    >
      <h4 className="text-sm font-semibold">{label}</h4>
      <div className={`grid gap-3 ${compact ? '' : 'md:grid-cols-2'}`}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="昵称 *"
          required
          className="glass w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none placeholder-gray-400 focus:ring-2 focus:ring-accent/50"
        />
        {!compact && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱（选填）"
            className="glass w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none placeholder-gray-400 focus:ring-2 focus:ring-accent/50"
          />
        )}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下你的评论..."
        rows={compact ? 2 : 3}
        required
        className="glass w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none placeholder-gray-400 focus:ring-2 focus:ring-accent/50"
      />
      <button
        type="submit"
        disabled={submitting || !name.trim() || !content.trim()}
        className="btn-premium text-sm disabled:opacity-50"
      >
        {submitting ? '提交中...' : label}
      </button>
    </motion.form>
  );
}
