'use client';

import Image from 'next/image';
import ScrollReveal from '@/components/anime/ScrollReveal';
import Magnetic from '@/components/anime/Magnetic';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <ScrollReveal className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold gradient-text-cyan">👋 关于我</h1>
        <p className="text-lg text-gray-500">游戏玩家 · 二次元爱好者 · 记录生活</p>
      </ScrollReveal>

      {/* 头像区域 */}
      <ScrollReveal className="mb-10 flex justify-center">
        <Magnetic strength={0.3}>
          <div className="glass-heavy relative h-36 w-36 overflow-hidden rounded-full shadow-xl shadow-accent/20 ring-2 ring-accent/30">
            <Image
              src="/images/avatar.jpg"
              alt="瞬云 头像"
              fill
              className="object-cover"
              priority
            />
          </div>
        </Magnetic>
      </ScrollReveal>

      {/* 介绍卡片 */}
      <div className="space-y-6">
        <ScrollReveal delay={0.1}>
          <div className="glass-heavy rounded-2xl p-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <span>📖</span> 个人简介
            </h2>
            <p className="leading-relaxed text-gray-600 dark:text-gray-300">
              我是 瞬云，一名热爱游戏与二次元文化的普通人。在这里我会分享生活随笔、软件工具以及我对动漫、游戏的热爱。欢迎常来逛逛！
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="glass-heavy rounded-2xl p-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <span>💌</span> 联系方式
            </h2>
            <div className="space-y-2 text-sm text-gray-500">
              <p>📧 Email: vipzyss@gmail.com</p>
              <p>🐙 GitHub: 暂无</p>
              <p>🐦 Twitter: @sy_eclipse</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
