'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

/** 页面顶部滚动进度条 + 导航加载闪烁 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setNavigating(true);
    const timer = setTimeout(() => setNavigating(false), 600);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {/* 滚动进度条 */}
      <motion.div
        className="fixed left-0 right-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
        style={{ scaleX }}
      />

      {/* 导航加载闪烁 */}
      <AnimatePresence>
        {navigating && (
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: [0, 1, 1, 0], opacity: [1, 1, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-accent via-cyan-300 to-accent"
            style={{ transformOrigin: 'left' }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
