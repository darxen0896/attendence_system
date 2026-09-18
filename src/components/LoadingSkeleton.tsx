export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700"
          >
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl mb-3" />
            <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="h-11 bg-slate-200 dark:bg-slate-700 rounded-xl" />

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex-1" />
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
