import { getPublishedPosts, getCategories, getTags } from '@/lib/data';

const SITE_URL = 'https://akog-blog.vercel.app';

export async function GET() {
  const publishedPosts = await getPublishedPosts();
  const categories = await getCategories();
  const tags = await getTags();

  const urls = [
    '',
    '/posts',
    '/categories',
    '/about',
    '/guestbook',
    '/search',
    ...publishedPosts.map((p) => `/posts/${p.slug}`),
    ...categories.map((c) => `/categories/${c.slug}`),
    ...tags.map((t) => `/search?tag=${t.slug}`),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${url === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${url === '' ? '1.0' : url.startsWith('/posts') ? '0.8' : '0.5'}</priority>
  </url>`
    )
    .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
