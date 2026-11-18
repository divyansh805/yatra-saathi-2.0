export function RideCompareSkeleton({ columns = 3 }: { columns?: 1 | 3 }) {
  const count = columns === 1 ? 3 : 3;
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading ride comparisons">
      <div className="rounded-2xl border border-[#E5DFD3] bg-[#FDFBF7] p-4 flex items-center justify-between gap-4">
        <div className="h-5 w-60 rounded-lg skeleton-shimmer" />
        <div className="h-5 w-28 rounded-lg skeleton-shimmer" />
      </div>
      <div
        className={
          columns === 3
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5'
            : 'space-y-3'
        }
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#E5DFD3] bg-white p-4 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1">
                <div className="w-9 h-9 rounded-lg skeleton-shimmer shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 rounded skeleton-shimmer" />
                  <div className="h-3.5 w-20 rounded skeleton-shimmer" />
                </div>
              </div>
              <div className="w-[82px] h-[62px] rounded-xl skeleton-shimmer shrink-0" />
            </div>
            <div className="h-14 w-full rounded-xl skeleton-shimmer" />
            <div className="flex items-center justify-between gap-3">
              <div className="h-5 w-20 rounded skeleton-shimmer" />
              <div className="h-9 w-28 rounded-xl skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiscoverySkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading local attractions">
      <div className="bg-white rounded-2xl border border-[#E5DFD3] p-4 space-y-3">
        <div className="h-10 w-full max-w-md rounded-xl skeleton-shimmer" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-28 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </div>

      <div className="flex gap-5 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[300px] sm:w-[344px] rounded-2xl border border-[#E5DFD3] bg-white overflow-hidden"
          >
            <div className="aspect-[16/10] w-full skeleton-shimmer" />
            <div className="p-5 space-y-3">
              <div className="h-3.5 w-36 rounded skeleton-shimmer" />
              <div className="h-6 w-48 rounded skeleton-shimmer" />
              <div className="h-4 w-full rounded skeleton-shimmer" />
              <div className="h-10 w-full rounded-xl skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuggestSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="p-3.5 space-y-2.5" aria-busy="true" aria-label="Searching suggestions">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-44 rounded skeleton-shimmer" />
            <div className="h-3.5 w-32 rounded skeleton-shimmer" />
          </div>
          <div className="h-4 w-16 rounded skeleton-shimmer shrink-0" />
        </div>
      ))}
    </div>
  );
}
