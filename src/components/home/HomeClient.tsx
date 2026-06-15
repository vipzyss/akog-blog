'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion as m } from 'framer-motion';
import PostCard from '@/components/blog/PostCard';
import ScrollReveal from '@/components/anime/ScrollReveal';
import Magnetic from '@/components/anime/Magnetic';
import Typewriter from '@/components/anime/Typewriter';

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  categoryId: string | null;
  tagIds: string[];
  publishedAt: string | null;
  views: number;
  categoryName?: string;
}

export function HeroSection() {
  return (
    <section className="relative mb-20 overflow-hidden">
      {/* 视差背景光晕 */}
      <ParallaxGlow />
      <div className="glass-heavy rounded-[40px] p-10 md:p-16">
        <m.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <m.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 text-4xl font-extrabold leading-tight md:text-6xl"
          >
            <span className="gradient-text-cyan">瞬云的尽头</span>
          </m.h1>
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mb-8 text-lg text-gray-500 dark:text-gray-400"
          >
            <Typewriter
              texts={[
                '探索虚拟世界的无限可能',
                '记录游戏与开发的点点滴滴',
                '二次元 × 技术 × 生活',
                '欢迎来到瞬云的尽头',
              ]}
              speed={70}
              deleteSpeed={30}
              pauseDelay={2500}
            />
          </m.p>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex justify-center gap-4"
          >
            <Magnetic strength={0.25}>
              <Link href="/posts" className="btn-premium inline-block no-underline">
                浏览文章
              </Link>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Link
                href="/about"
                className="glass inline-block rounded-full px-6 py-3 font-semibold text-accent transition hover:scale-105"
              >
                关于我
              </Link>
            </Magnetic>
          </m.div>
        </m.div>
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <AnimeParticles />
      </div>
    </section>
  );
}

export function CategoryNav({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <ScrollReveal className="mb-16">
      <h2 className="mb-8 text-2xl font-bold">文章分类</h2>
      <div className="flex flex-wrap gap-3">
        {categories.map((cat, i) => (
          <m.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05 }}
          >
            <Link
              href={`/categories/${cat.slug}`}
              className="glass-light inline-block rounded-full px-5 py-2 text-sm font-medium no-underline transition hover:text-accent"
            >
              {cat.name}{' '}
              <span className="text-accent">({cat.count})</span>
            </Link>
          </m.div>
        ))}
      </div>
    </ScrollReveal>
  );
}

export function PostGrid({ posts }: { posts: PostSummary[] }) {
  return (
    <section>
      <ScrollReveal className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">最新文章</h2>
        <Link href="/posts" className="accent-link text-sm font-medium">
          查看全部 →
        </Link>
      </ScrollReveal>

      {posts.length === 0 ? (
        <p className="py-12 text-center text-gray-400">
          暂无文章，管理员快去写吧～ 📝
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} categoryName={post.categoryName} />
          ))}
        </div>
      )}
    </section>
  );
}

/* 视差光晕背景 */
function ParallaxGlow() {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        rafRef.current = requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-500/10 blur-3xl"
        style={{ transform: `translateY(${scrollY * 0.15}px)`, willChange: 'transform' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-l from-purple-400/15 to-cyan-300/10 blur-3xl"
        style={{ transform: `translateY(${scrollY * -0.1}px)`, willChange: 'transform' }}
      />
    </>
  );
}

/* 二次元粒子装饰 */
function AnimeParticles() {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ l: number; t: number; d: number; delay: number; size: number }>
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }).map(() => ({
        l: Math.random() * 100,
        t: Math.random() * 100,
        d: 3 + Math.random() * 3,
        delay: Math.random() * 3,
        size: 2 + Math.random() * 4,
      }))
    );
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0">
      {particles.map((p, i) => (
        <m.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.l}%`,
            top: `${p.t}%`,
            width: p.size,
            height: p.size,
            background: i % 3 === 0
              ? 'rgba(6,182,212,0.3)'
              : i % 3 === 1
                ? 'rgba(59,130,246,0.25)'
                : 'rgba(147,51,234,0.2)',
          }}
          animate={{
            y: [0, -40, 0],
            x: i % 2 === 0 ? [0, 10, 0] : [0, -10, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [1, 1.6, 1],
          }}
          transition={{
            duration: p.d,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
