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
import BackToTop from '@/components/anime/BackToTop';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: '瞬云的尽头 - 探索虚拟世界的无限可能',
    template: '%s - 瞬云的尽头',
  },
  description: '游戏与开发主题个人博客，记录虚拟世界中的探索与创造',
  keywords: ['博客', '游戏', '开发', '二次元', '瞬云的尽头', '个人博客'],
  authors: [{ name: '瞬云的尽头' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: '瞬云的尽头',
    title: '瞬云的尽头 - 探索虚拟世界的无限可能',
    description: '游戏与开发主题个人博客，记录虚拟世界中的探索与创造',
  },
  twitter: {
    card: 'summary_large_image',
    title: '瞬云的尽头',
    description: '游戏与开发主题个人博客',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06b6d4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="瞬云博客" />
        {/* PWA 注册 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
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
            <BackToTop />
          </div>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
