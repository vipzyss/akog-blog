// PWA Service Worker
const CACHE_NAME = 'akog-blog-v1';
const STATIC_ASSETS = [
  '/',
  '/posts',
  '/categories',
  '/about',
  '/guestbook',
];

// 安装阶段 — 预缓存静态页面
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活阶段 — 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 拦截请求 — 网络优先，缓存后备
self.addEventListener('fetch', (event) => {
  // 只缓存 GET 请求
  if (event.request.method !== 'GET') return;

  // 不缓存 API 和 admin 路径
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功响应放入缓存
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // 离线时返回缓存
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});
