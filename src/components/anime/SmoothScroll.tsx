'use client';

import { useEffect, useRef } from 'react';

/**
 * 全局平滑滚动
 * 拦截鼠标滚轮事件，使用 lerp 缓动动画替代浏览器原生生硬滚动
 * 仅在桌面端鼠标滚轮生效，移动端触屏使用原生滚动
 */
export default function SmoothScroll() {
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const ease = 0.08;

  useEffect(() => {
    currentRef.current = window.scrollY;
    targetRef.current = window.scrollY;

    // 鼠标滚轮
    const onWheel = (e: WheelEvent) => {
      // 仅拦截桌面端鼠标滚轮（不拦截触控板）
      // deltaMode 0 = 像素滚动（触控板），1 = 行滚动（鼠标滚轮）
      if (e.deltaMode === 0 && Math.abs(e.deltaY) < 30) return;

      e.preventDefault();
      targetRef.current += e.deltaY;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetRef.current = Math.max(0, Math.min(targetRef.current, maxScroll));

      if (!runningRef.current) {
        runningRef.current = true;
        animate();
      }
    };

    const animate = () => {
      const diff = targetRef.current - currentRef.current;

      if (Math.abs(diff) < 0.5) {
        // 滚动已停止，不再浪费资源
        currentRef.current = targetRef.current;
        window.scrollTo(0, Math.round(currentRef.current));
        runningRef.current = false;
        return;
      }

      currentRef.current += diff * ease;
      window.scrollTo(0, Math.round(currentRef.current));
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return null;
}
