import { getCategories, getPosts } from '@/lib/data';
import PostCardClient from './PostCardClient';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategories().find((c) => c.slug === slug);
  return {
    title: cat ? `${cat.name} — 瞬云的尽头` : '分类 — 瞬云的尽头',
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const categories = getCategories();
  const cat = categories.find((c) => c.slug === slug);

  if (!cat) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
        <h1 className="mb-4 text-4xl font-bold gradient-text-cyan">分类未找到</h1>
        <p className="text-gray-500">你找的分类不存在哦 🤔</p>
      </div>
    );
  }

  const posts = getPosts()
    .filter((p) => p.categoryId === cat.id && p.status === 'published')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const postSummaries = posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    categoryId: p.categoryId,
    tagIds: p.tagIds,
    publishedAt: p.publishedAt,
    views: p.views,
    categoryName: cat.name,
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold gradient-text-cyan">{cat.name}</h1>
        <p className="text-gray-500">
          {cat.description} · 共 {posts.length} 篇文章
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="py-16 text-center text-gray-400">这个分类下还没有文章 📝</p>
      ) : (
        <PostCardClient posts={postSummaries} />
      )}
    </div>
  );
}
