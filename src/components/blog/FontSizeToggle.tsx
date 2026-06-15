'use client';

import { useState, useEffect } from 'react';

const SIZES = [
  { key: 'sm', label: '小', size: '0.9rem' },
  { key: 'md', label: '中', size: '1.05rem' },
  { key: 'lg', label: '大', size: '1.2rem' },
] as const;

const STORAGE_KEY = 'akog-font-size';

export default function FontSizeToggle() {
  const [active, setActive] = useState('md');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SIZES.some((s) => s.key === saved)) {
      setActive(saved);
      applySize(saved);
    }
  }, []);

  const applySize = (key: string) => {
    const size = SIZES.find((s) => s.key === key)?.size;
    if (size) {
      document.documentElement.style.setProperty('--article-font-size', size);
    }
  };

  const handleChange = (key: string) => {
    setActive(key);
    localStorage.setItem(STORAGE_KEY, key);
    applySize(key);
  };

  return (
    <div className="flex items-center gap-1.5">
      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M9 12h6M7 18h10" />
      </svg>
      {SIZES.map((s) => (
        <button
          key={s.key}
          onClick={() => handleChange(s.key)}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
            active === s.key
              ? 'bg-accent text-white'
              : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-gray-200'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
