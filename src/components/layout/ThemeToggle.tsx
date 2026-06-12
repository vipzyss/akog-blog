'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  if (!mounted) return null;

  const label =
    theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统';

  return (
    <m.button
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full glass-heavy text-lg shadow-xl transition hover:scale-110"
      onClick={cycleTheme}
      whileTap={{ scale: 0.9 }}
      title={`当前主题：${label}，点击切换`}
    >
      <AnimatePresence mode="wait">
        <m.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.25 }}
          className="absolute"
        >
          {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
        </m.span>
      </AnimatePresence>
      <span className="sr-only">切换主题（当前：{label}）</span>
    </m.button>
  );
}
