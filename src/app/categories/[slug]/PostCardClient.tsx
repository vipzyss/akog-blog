'use client';

import PostCard from '@/components/blog/PostCard';

interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  categoryId: string;
  tagIds: string[];
  publishedAt: string | null;
  views: number;
  categoryName?: string;
}

export default function PostCardClient({ posts }: { posts: PostSummary[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} categoryName={post.categoryName} />
      ))}
    </div>
  );
}
