import { getPosts, getCategories } from '@/lib/data';

const SITE_URL = 'https://akog-blog.vercel.app';

export async function GET() {
  const posts = await getPosts();
  const categories = await getCategories();

  const publishedPosts = posts
    .filter((p) => p.status === 'published')
    .sort(
      (a, b) =>
        new Date(b.publishedAt || b.createdAt).getTime() -
        new Date(a.publishedAt || a.createdAt).getTime()
    )
    .slice(0, 20);

  const getCategoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name || '';

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>瞬云的尽头</title>
    <description>探索虚拟世界的无限可能 — 游戏与开发主题个人博客</description>
    <link>${SITE_URL}</link>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${publishedPosts
      .map(
        (p) => `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${SITE_URL}/posts/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/posts/${p.slug}</guid>
      <pubDate>${new Date(p.publishedAt || p.createdAt).toUTCString()}</pubDate>
      <category>${getCategoryName(p.categoryId)}</category>
      <description><![CDATA[${p.excerpt || p.title}]]></description>
      <content:encoded><![CDATA[${(p.richContent || p.content).substring(0, 500)}]]></content:encoded>
    </item>`
      )
      .join('\n')}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
