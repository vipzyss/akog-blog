'use client';

import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  once?: boolean;
}

const dirMap = {
  up: { y: 30, x: 0 },
  down: { y: -30, x: 0 },
  left: { x: 30, y: 0 },
  right: { x: -30, y: 0 },
};

const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;

/** 滚动渐显 — 元素进入视口时从指定方向淡入 */
export default function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 0.5,
  once = true,
}: ScrollRevealProps) {
  const prefersReduced = useReducedMotion();
  const offset = dirMap[direction];
  const noMotion = prefersReduced || false;

  // 减少动效时：仅淡入，不位移
  if (noMotion) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once, margin: '-30px' }}
        transition={{ duration: 0.2, delay }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      style={{ willChange: 'transform, opacity' }}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-30px' }}
      transition={{
        duration,
        delay,
        ease: EASE_OUT_QUART,
      }}
    >
      {children}
    </motion.div>
  );
}

/* 列表交错的便捷封装 */
export function StaggerList({
  children,
  className = '',
  staggerDelay = 0.06,
}: {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <ScrollReveal key={i} delay={i * staggerDelay}>
              {child}
            </ScrollReveal>
          ))
        : children}
    </div>
  );
}
