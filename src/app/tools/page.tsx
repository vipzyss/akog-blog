'use client';

import { useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import NetEaseMusic from '@/components/tools/NetEaseMusic';
import MdToWord from '@/components/tools/MdToWord';
import ScrollReveal from '@/components/anime/ScrollReveal';

const TOOLS = [
  { id: 'netease', name: '🎵 网易云音乐解析', desc: '解析网易云音乐链接，生成嵌入播放器', emoji: '🎵', component: NetEaseMusic },
  { id: 'md2word', name: '📄 MD 转 Word', desc: '将 Markdown 文件转换为 Word 文档', emoji: '📄', component: MdToWord },
];

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const ActiveComponent = TOOLS.find((t) => t.id === activeTool)?.component;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <ScrollReveal className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-extrabold gradient-text-cyan">🔧 在线工具</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">实用小工具，让生活更便捷 ✨</p>
      </ScrollReveal>

      {/* 工具选择 */}
      {!activeTool && (
        <div className="grid gap-6 sm:grid-cols-2">
          {TOOLS.map((tool, i) => (
            <ScrollReveal key={tool.id} delay={i * 0.1}>
              <m.button
                onClick={() => setActiveTool(tool.id)}
                className="group glass-heavy w-full rounded-2xl p-8 text-left transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:border-accent/40 border border-transparent"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="mb-4 text-5xl">{tool.emoji}</div>
                <h2 className="mb-2 text-xl font-bold transition-colors group-hover:text-accent">
                  {tool.name}
                </h2>
                <p className="text-sm text-gray-400">{tool.desc}</p>
              </m.button>
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* 工具区 */}
      <AnimatePresence mode="wait">
        {activeTool && ActiveComponent && (
          <m.div
            key={activeTool}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setActiveTool(null)}
              className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-accent transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              返回工具列表
            </button>
            <ActiveComponent />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
