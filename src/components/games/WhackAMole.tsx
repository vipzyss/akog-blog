'use client';

import { useState, useEffect, useRef } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';

const GRID_SIZE = 9; // 3x3
const GAME_DURATION = 30; // 30秒
const MOLE_SHOW_TIME = [800, 1500]; // 地鼠出现时间范围 (ms)

export default function WhackAMole() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hitEffect, setHitEffect] = useState<number | null>(null);

  // Refs 避免闭包陷阱
  const playingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const moleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    timerRef.current = null;
    moleTimerRef.current = null;
  };

  const spawnMole = () => {
    if (!playingRef.current) return;
    const hole = Math.floor(Math.random() * GRID_SIZE);
    setActiveHole(hole);

    const duration = MOLE_SHOW_TIME[0] + Math.random() * (MOLE_SHOW_TIME[1] - MOLE_SHOW_TIME[0]);
    moleTimerRef.current = setTimeout(() => {
      setActiveHole(null);
      // 使用 ref 读取最新 playing 状态，避免闭包陷阱
      if (playingRef.current) spawnMole();
    }, duration);
  };

  const startGame = () => {
    clearTimers();
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setActiveHole(null);

    // 先设置 ref（立即生效），再设置 state（异步）
    playingRef.current = true;
    setPlaying(true);

    // 延迟生成第一只地鼠 — 使用ref避免了闭包过期
    setTimeout(() => spawnMole(), 400);

    // 游戏计时
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimers();
          playingRef.current = false;
          setPlaying(false);
          setGameOver(true);
          setActiveHole(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const whack = (hole: number) => {
    if (!playingRef.current || hole !== activeHole) return;
    setScore((s) => s + 1);
    setHitEffect(hole);
    setTimeout(() => setHitEffect(null), 200);
    setActiveHole(null);
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    setTimeout(() => spawnMole(), 300);
  };

  return (
    <div>
      {/* 状态栏 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span className="glass-light rounded-full px-3 py-1">
            ⏱️ 时间: <span className={`font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-accent'}`}>{timeLeft}s</span>
          </span>
          <span className="glass-light rounded-full px-3 py-1">
            🎯 得分: <span className="font-bold text-accent">{score}</span>
          </span>
        </div>
        {!playing && !gameOver && (
          <button onClick={startGame} className="btn-premium text-sm !px-4 !py-2">
            🎮 开始游戏
          </button>
        )}
        {playing && (
          <button onClick={() => { clearTimers(); playingRef.current = false; setPlaying(false); setGameOver(true); }} className="text-sm text-gray-400 hover:text-red-500 transition">
            结束
          </button>
        )}
        {gameOver && (
          <button onClick={startGame} className="btn-premium text-sm !px-4 !py-2">
            🔄 再来一局
          </button>
        )}
      </div>

      {/* 游戏面板 */}
      <div className="glass-heavy rounded-2xl p-6">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: GRID_SIZE }).map((_, i) => (
            <div
              key={i}
              className="relative aspect-square cursor-pointer rounded-2xl bg-gradient-to-b from-amber-800/40 to-amber-900/30 dark:from-amber-900/40 dark:to-amber-950/30 border border-amber-700/20 overflow-hidden"
              onClick={() => whack(i)}
            >
              {/* 洞口阴影 */}
              <div className="absolute inset-x-2 bottom-0 h-1/3 rounded-b-xl bg-black/20" />

              {/* 地鼠 */}
              <AnimatePresence>
                {activeHole === i && (
                  <m.div
                    key="mole"
                    initial={{ y: '100%' }}
                    animate={{ y: '15%' }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    className="absolute inset-2 flex items-center justify-center"
                  >
                    <div className="relative">
                      {/* 地鼠身体 */}
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg">
                        <span className="text-3xl select-none">🐹</span>
                      </div>
                      {/* 击打特效 */}
                      {hitEffect === i && (
                        <m.div
                          key="hit"
                          initial={{ scale: 0.5, opacity: 1 }}
                          animate={{ scale: 2.5, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <span className="text-4xl">💥</span>
                        </m.div>
                      )}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* 游戏结束 */}
      <AnimatePresence>
        {gameOver && (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 glass-heavy rounded-2xl p-6 text-center"
          >
            <p className="mb-2 text-4xl">{score >= 15 ? '🏆' : score >= 8 ? '👏' : '💪'}</p>
            <p className="mb-1 text-lg font-bold gradient-text-cyan">游戏结束！</p>
            <p className="mb-4 text-sm text-gray-400">
              最终得分: <span className="text-2xl font-bold text-accent">{score}</span>
            </p>
            <button onClick={startGame} className="btn-premium text-sm">
              🔄 再来一局
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {!playing && !gameOver && (
        <p className="mt-4 text-center text-sm text-gray-400">
          点击「开始游戏」，在 30 秒内尽可能多地打地鼠！🐹
        </p>
      )}
    </div>
  );
}
