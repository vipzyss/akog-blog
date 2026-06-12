'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';

/**
 * 全局加载动画
 * 检测页面路径变化时显示加载遮罩
 */
export default function GlobalLoading() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 400);
      prevPath.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <AnimatePresence>
      {loading && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative h-16 w-16">
              <m.div
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <m.div
                className="absolute inset-2 rounded-full border-4 border-transparent border-r-cyan-400"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <m.div
                className="absolute inset-4 rounded-full border-4 border-transparent border-b-purple-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <m.p
              className="text-sm font-medium text-white/80"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              加载中...
            </m.p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
