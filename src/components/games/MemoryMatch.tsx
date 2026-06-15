'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';

const EMOJIS = ['🌟', '🎮', '🌸', '🎵', '🌈', '🦋', '🍀', '⭐', '🌙', '🎯', '🎪', '🎨'];
const PAIRS = 8; // 8对 = 16张卡

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryMatch() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number>(0);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const initGame = useCallback(() => {
    const selected = shuffleArray(EMOJIS).slice(0, PAIRS);
    const deck = shuffleArray([...selected, ...selected]).map((emoji, i) => ({
      id: i,
      emoji,
      flipped: false,
      matched: false,
    }));
    setCards(deck);
    setFlipped([]);
    setMatched(0);
    setMoves(0);
    setLocked(false);
    setGameOver(false);
    setStarted(true);
  }, []);

  useEffect(() => {
    initGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = (cardId: number) => {
    if (locked || gameOver) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.flipped || card.matched) return;

    if (flipped.length === 2) return;

    const newCards = cards.map((c) => (c.id === cardId ? { ...c, flipped: true } : c));
    setCards(newCards);

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [first, second] = newFlipped.map((id) => newCards.find((c) => c.id === id)!);

      if (first.emoji === second.emoji) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === first.id || c.id === second.id ? { ...c, matched: true } : c))
          );
          setMatched((m) => m + 1);
          setFlipped([]);
          setLocked(false);
        }, 400);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c
            )
          );
          setFlipped([]);
          setLocked(false);
        }, 800);
      }
    }
  };

  useEffect(() => {
    if (started && matched === PAIRS) {
      setTimeout(() => setGameOver(true), 500);
    }
  }, [matched, started]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span className="glass-light rounded-full px-3 py-1">
            🎯 步数: <span className="font-bold text-accent">{moves}</span>
          </span>
          <span className="glass-light rounded-full px-3 py-1">
            ✅ 配对: <span className="font-bold text-accent">{matched}/{PAIRS}</span>
          </span>
        </div>
        <button onClick={initGame} className="btn-premium text-sm !px-4 !py-2">
          🔄 重新开始
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <AnimatePresence>
          {cards.map((card) => (
            <m.button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              className={`relative aspect-square w-full rounded-2xl text-3xl font-bold transition-shadow duration-300 ${
                card.matched
                  ? 'ring-2 ring-accent/60 shadow-lg shadow-accent/20'
                  : 'hover:shadow-md'
              }`}
              whileTap={{ scale: 0.92 }}
              disabled={card.flipped || card.matched}
              style={{ perspective: '600px' }}
            >
              <m.div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                initial={false}
                animate={{
                  rotateY: card.flipped || card.matched ? 0 : 180,
                }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* 卡片正面 */}
                <div className={`flex h-full w-full items-center justify-center rounded-2xl ${
                  card.matched
                    ? 'bg-accent/15 border border-accent/40'
                    : 'glass-heavy'
                }`}>
                  {(card.flipped || card.matched) && (
                    <m.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15, type: 'spring', damping: 10 }}
                    >
                      {card.emoji}
                    </m.span>
                  )}
                </div>
              </m.div>
              <m.div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                initial={false}
                animate={{
                  rotateY: card.flipped || card.matched ? 180 : 0,
                }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* 卡片背面 */}
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-blue-500/30 border border-white/20 shadow-inner">
                  <span className="text-2xl opacity-40">?</span>
                </div>
              </m.div>
            </m.button>
          ))}
        </AnimatePresence>
      </div>

      {/* 胜利弹窗 */}
      <AnimatePresence>
        {gameOver && (
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mt-6 glass-heavy rounded-2xl p-6 text-center"
          >
            <p className="mb-2 text-4xl">🎉</p>
            <p className="mb-1 text-lg font-bold gradient-text-cyan">恭喜通关！</p>
            <p className="mb-4 text-sm text-gray-400">
              用了 <span className="font-bold text-accent">{moves}</span> 步完成配对
            </p>
            <button onClick={initGame} className="btn-premium text-sm">
              🔄 再来一局
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
