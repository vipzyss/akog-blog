'use client';

import { useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import MemoryMatch from '@/components/games/MemoryMatch';
import WhackAMole from '@/components/games/WhackAMole';
import ScrollReveal from '@/components/anime/ScrollReveal';

const GAMES = [
  { id: 'memory', name: '🧩 翻牌配对', desc: '找出所有配对的二次元表情', emoji: '🧩', component: MemoryMatch },
  { id: 'mole', name: '🐹 打地鼠', desc: '30秒内尽可能多打地鼠！', emoji: '🔨', component: WhackAMole },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const ActiveComponent = GAMES.find((g) => g.id === activeGame)?.component;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <ScrollReveal className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-extrabold gradient-text-cyan">🎮 小游戏</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">工作学习累了？来玩两把放松一下吧 ✨</p>
      </ScrollReveal>

      {/* 游戏选择 */}
      {!activeGame && (
        <div className="grid gap-6 sm:grid-cols-2">
          {GAMES.map((game, i) => (
            <ScrollReveal key={game.id} delay={i * 0.1}>
              <m.button
                onClick={() => setActiveGame(game.id)}
                className="group glass-heavy w-full rounded-2xl p-8 text-left transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:border-accent/40 border border-transparent"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="mb-4 text-5xl">{game.emoji}</div>
                <h2 className="mb-2 text-xl font-bold transition-colors group-hover:text-accent">
                  {game.name}
                </h2>
                <p className="text-sm text-gray-400">{game.desc}</p>
              </m.button>
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* 游戏区 */}
      <AnimatePresence mode="wait">
        {activeGame && ActiveComponent && (
          <m.div
            key={activeGame}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setActiveGame(null)}
              className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-accent transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              返回游戏列表
            </button>
            <ActiveComponent />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
