import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function PostLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          {/* 面包屑骨架 */}
          <div className="mb-8 flex items-center gap-2">
            <div className="skeleton h-4 w-8 rounded" />
            <div className="skeleton h-4 w-12 rounded" />
          </div>

          {/* 标题骨架 */}
          <div className="mb-10">
            <div className="skeleton mb-4 h-10 w-3/4 rounded-2xl" />
            <div className="mb-4 flex gap-3">
              <div className="skeleton h-6 w-16 rounded-full" />
              <div className="skeleton h-6 w-24 rounded-full" />
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
            {/* 封面骨架 */}
            <div className="skeleton aspect-video w-full rounded-2xl" />
          </div>

          {/* 内容骨架 */}
          <div className="glass-heavy rounded-2xl p-6 md:p-10 space-y-4">
            <div className="skeleton h-5 w-full rounded-lg" />
            <div className="skeleton h-5 w-5/6 rounded-lg" />
            <div className="skeleton h-5 w-4/6 rounded-lg" />
            <div className="skeleton h-5 w-full rounded-lg" />
            <div className="skeleton h-5 w-3/4 rounded-lg" />
            <div className="skeleton h-5 w-full rounded-lg" />
            <div className="skeleton h-5 w-2/3 rounded-lg" />
            <div className="skeleton h-5 w-5/6 rounded-lg" />
            <div className="skeleton h-5 w-1/2 rounded-lg" />
          </div>
        </div>

        {/* 侧边栏骨架 */}
        <div className="hidden lg:block">
          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="skeleton h-5 w-20 rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-2/3 rounded ml-3" />
            <div className="skeleton h-4 w-4/5 rounded" />
            <div className="skeleton h-4 w-1/2 rounded ml-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
