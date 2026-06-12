import { getCategories, getPosts } from '@/lib/data';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '分类 — 瞬云的尽头',
};

export default function CategoriesPage() {
  const categories = getCategories();
  const posts = getPosts();

  const catsWithCount = categories.map((cat) => ({
    ...cat,
    count: posts.filter((p) => p.categoryId === cat.id && p.status === 'published').length,
  }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-3 text-center text-4xl font-bold gradient-text-cyan">📂 文章分类</h1>
      <p className="mb-12 text-center text-gray-500">按分类探索感兴趣的内容</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {catsWithCount.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="glass-heavy group flex flex-col items-center rounded-2xl p-8 no-underline transition hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
          >
            <div className="mb-3 text-4xl">
              {cat.slug === 'tech' ? '💻' : cat.slug === 'life' ? '🌟' : cat.slug === 'anime' ? '🌸' : cat.slug === 'game' ? '🎮' : '📂'}
            </div>
            <h3 className="mb-1 text-lg font-semibold transition group-hover:text-accent">{cat.name}</h3>
            <p className="mb-2 text-sm text-gray-500">{cat.description || ''}</p>
            <span className="rounded-full bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent">
              {cat.count} 篇文章
            </span>
          </Link>
        ))}
        {catsWithCount.length === 0 && (
          <p className="col-span-full py-12 text-center text-gray-400">暂无分类</p>
        )}
      </div>
    </div>
  );
}
