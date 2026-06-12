import { getPosts, getCategories, initDefaultData } from '@/lib/data';
import { HeroSection, CategoryNav, PostGrid } from '@/components/home/HomeClient';

export const revalidate = 60;

function getFeaturedPosts() {
  const posts = getPosts();
  const categories = getCategories();

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

function getCategoriesWithCount() {
  const categories = getCategories();
  const posts = getPosts();
  return categories.map((cat) => ({
    ...cat,
    count: posts.filter((p) => p.categoryId === cat.id && p.status === 'published').length,
  }));
}

export default function HomePage() {
  initDefaultData();
  const posts = getFeaturedPosts();
  const categories = getCategoriesWithCount();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <HeroSection />
      <CategoryNav categories={categories} />
      <PostGrid posts={posts} />
    </div>
  );
}
