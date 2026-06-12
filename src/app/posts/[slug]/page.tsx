import { notFound } from 'next/navigation';
import { getPostBySlug, getCategories, getCommentsByPost } from '@/lib/data';
import PostPageClient from '@/components/blog/PostPageClient';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: '文章不存在' };
  return { title: `${post.title} - 瞬云的尽头`, description: post.excerpt };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== 'published') notFound();

  const categories = await getCategories();
  const category = categories.find((c) => c.id === post.categoryId);
  const comments = await getCommentsByPost(post.id);

  return <PostPageClient post={post} category={category} comments={comments} />;
}
