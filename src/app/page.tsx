import { getPublishedPosts, getCategories, initDefaultData } from '@/lib/data';
import { HeroSection, CategoryNav, PostGrid } from '@/components/home/HomeClient';

export const revalidate = 60;

async function getFeaturedPosts() {
  const posts = await getPublishedPosts();
  const categories = await getCategories();

  return posts
    .filter((p) => p.status === 'published')
    .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
    .slice(0, 6)
    .map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      categoryId: post.categoryId,
      tagIds: post.tagIds,
      publishedAt: post.publishedAt,
      views: post.views,
      categoryName: categories.find((c) => c.id === post.categoryId)?.name || '',
    }));
}

async function getCategoriesWithCount() {
  const categories = await getCategories();
  const posts = await getPublishedPosts();
  return categories.map((cat) => ({
    ...cat,
    count: posts.filter((p) => p.categoryId === cat.id).length,
  }));
}

export default async function HomePage() {
  await initDefaultData();
  const posts = await getFeaturedPosts();
  const categories = await getCategoriesWithCount();

  return (
    <div className="mx-auto max-w-6xl rounded-[32px] overflow-hidden bg-[var(--glass-bg)] px-6 py-12">
      <HeroSection />
      <CategoryNav categories={categories} />
      <PostGrid posts={posts} />
    </div>
  );
}
