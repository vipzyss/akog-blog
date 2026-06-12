import { ThemeProvider } from 'next-themes';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Analytics from '@/components/ui/Analytics';
import ScrollProgress from '@/components/anime/ScrollProgress';
import SmoothScroll from '@/components/anime/SmoothScroll';
import GlobalLoading from '@/components/anime/GlobalLoading';
import InteractiveBg from '@/components/anime/InteractiveBg';
import MusicPlayer from '@/components/layout/MusicPlayer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '瞬云的尽头 - 探索虚拟世界的无限可能',
  description: '游戏与开发主题个人博客，记录虚拟世界中的探索与创造',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableColorScheme={false}>
          {/* 鼠标互动背景粒子 */}
          <InteractiveBg />
          <ScrollProgress />
          <SmoothScroll />
          <GlobalLoading />
          <div className="relative z-10 flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ThemeToggle />
            <MusicPlayer />
          </div>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
