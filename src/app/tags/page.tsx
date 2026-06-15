import Link from 'next/link';
import { getTags, getPosts } from '@/lib/data';
import ScrollReveal from '@/components/anime/ScrollReveal';

export const revalidate = 60;

export default async function TagsPage() {
  const tags = await getTags();
  const posts = await getPosts();

  const publishedPosts = posts.filter((p) => p.status === 'published');

  const tagsWithCount = tags
    .map((tag) => ({
      ...tag,
      count: publishedPosts.filter((p) => p.tagIds?.includes(tag.id)).length,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <ScrollReveal>
        <h1 className="mb-2 text-3xl font-extrabold gradient-text-cyan">标签云</h1>
        <p className="mb-10 text-gray-500 dark:text-gray-400">
          共 {tagsWithCount.length} 个标签，{publishedPosts.length} 篇已发布文章
        </p>
      </ScrollReveal>

      <div className="flex flex-wrap gap-4">
        {tagsWithCount.map((tag, i) => (
          <ScrollReveal key={tag.id} delay={i * 0.03}>
            <Link
              href={`/search?tag=${tag.slug}`}
              className="group glass-light inline-block rounded-2xl px-5 py-3 no-underline transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:border-accent/40 border border-transparent"
              style={{
                fontSize: `${Math.max(0.85, Math.min(1.6, 0.85 + tag.count * 0.08))}rem`,
              }}
            >
              <span className="font-medium transition-colors group-hover:text-accent">
                {tag.name}
              </span>
              <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                {tag.count}
              </span>
            </Link>
          </ScrollReveal>
        ))}
      </div>

      {tagsWithCount.length === 0 && (
        <p className="py-20 text-center text-gray-400">暂无标签</p>
      )}
    </div>
  );
}
