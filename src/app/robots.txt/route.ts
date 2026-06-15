import { getPosts } from '@/lib/data';

export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /reader-login/
Disallow: /register/
Disallow: /api/

Sitemap: https://akog-blog.vercel.app/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
