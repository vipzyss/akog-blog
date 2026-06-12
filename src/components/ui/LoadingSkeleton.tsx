export default function LoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-heavy rounded-2xl overflow-hidden">
          <div className="skeleton h-48 w-full" />
          <div className="space-y-3 p-5">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
            <div className="flex gap-3">
              <div className="skeleton h-3 w-20 rounded-full" />
              <div className="skeleton h-3 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
