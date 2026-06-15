import { notFound } from 'next/navigation';
import { getPostBySlug, getPosts, getCategories, getCommentsByPost, getTags } from '@/lib/data';
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

  // 相关文章：按相同分类 + 相同标签排序
  const allPosts = await getPosts();
  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && p.status === 'published')
    .map((p) => {
      let score = 0;
      if (p.categoryId === post.categoryId) score += 3;
      if (post.tagIds?.length && p.tagIds?.length) {
        const shared = p.tagIds.filter((t) => post.tagIds.includes(t)).length;
        score += shared * 2;
      }
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.post);

  return (
    <PostPageClient
      post={post}
      category={category}
      comments={comments}
      relatedPosts={relatedPosts}
    />
  );
}
