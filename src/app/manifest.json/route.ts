export async function GET() {
  const manifest = {
    name: '瞬云的尽头',
    short_name: '瞬云博客',
    description: '探索虚拟世界的无限可能 — 游戏与开发主题个人博客',
    start_url: '/',
    display: 'standalone',
    background_color: '#f0f4ff',
    theme_color: '#06b6d4',
    icons: [
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    categories: ['blog', 'gaming', 'technology'],
    lang: 'zh-CN',
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
