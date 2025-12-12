interface LoadingSkeletonProps {
  className?: string
  variant?: "default" | "glass" | "card"
}

export function LoadingSkeleton({ className = "", variant = "default" }: LoadingSkeletonProps) {
  const variantStyles = {
    default: "bg-[#eef0f8] rounded-[12px]",
    glass: "bg-white/40 backdrop-blur-sm rounded-[12px] border border-[#dfe2ec]/50",
    card: "bg-[#f7f6fb]/60 backdrop-blur-sm rounded-[16px] border border-[#dfe2ec]/30"
  }

  return (
    <div
      className={`animate-pulse ${variantStyles[variant]} ${className}`}
      role="status"
      aria-label="Loading..."
    />
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      <div className="rounded-2xl border-2 border-[#dfe2ec] bg-white shadow-[0_25px_55px_rgba(17,24,39,0.06)] overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f7f6fb] border-b-2 border-[#dfe2ec]">
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="text-left px-6 py-4 font-semibold text-[#111827] text-[15px]">
                    <LoadingSkeleton variant="glass" className="h-4 w-24" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dfe2ec]">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="transition-colors hover:bg-[#ffe4f2]">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} className="h-14 px-6 py-4">
                      <LoadingSkeleton
                        variant="glass"
                        className={`h-4 ${colIndex === 0 ? 'w-32' : colIndex === columns - 1 ? 'w-20' : 'w-24'}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card skeleton */}
        <div className="lg:hidden divide-y divide-[#dfe2ec]">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <LoadingSkeleton variant="glass" className="h-6 w-32" />
                <LoadingSkeleton variant="glass" className="h-6 w-16" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <LoadingSkeleton variant="glass" className="h-4 w-20" />
                  <LoadingSkeleton variant="glass" className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                  <LoadingSkeleton variant="glass" className="h-4 w-16" />
                  <LoadingSkeleton variant="glass" className="h-4 w-20" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <LoadingSkeleton variant="glass" className="h-8 w-8 rounded-xl" />
                <LoadingSkeleton variant="glass" className="h-8 w-8 rounded-xl" />
                <LoadingSkeleton variant="glass" className="h-8 w-8 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border-2 border-[#dfe2ec] bg-white/85 backdrop-blur-xl shadow-[0_25px_55px_rgba(17,24,39,0.06)] p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <LoadingSkeleton variant="glass" className="h-4 w-16" />
            <LoadingSkeleton variant="glass" className="w-4 h-4 rounded-xl" />
          </div>
          <LoadingSkeleton variant="glass" className="h-8 w-16 mb-2 rounded-xl" />
          <LoadingSkeleton variant="glass" className="h-4 w-24 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function ShimmerLoading({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-r from-[#eef0f8] via-[#f7f6fb] to-[#eef0f8] ${className}`}
      role="status"
      aria-label="Loading..."
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header skeleton */}
      <div className="mb-6 sm:mb-8">
        <ShimmerLoading className="h-8 w-32" />
      </div>

      {/* Stats cards skeleton */}
      <CardSkeleton count={4} />

      {/* Quick actions skeleton */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8 sm:mb-12 mt-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border-2 border-[#dfe2ec] bg-white/85 backdrop-blur-xl shadow-[0_25px_55px_rgba(17,24,39,0.06)] p-4 sm:p-6">
            <ShimmerLoading className="w-5 h-5 sm:w-6 sm:h-6 mb-3 sm:mb-4" />
            <ShimmerLoading className="h-5 w-24 mb-2" />
            <ShimmerLoading className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Analytics skeleton */}
      <div className="mb-8 sm:mb-12">
        <ShimmerLoading className="h-6 w-24 mb-4 sm:mb-6" />
        <div className="rounded-2xl border-2 border-[#dfe2ec] bg-white/85 backdrop-blur-xl shadow-[0_25px_55px_rgba(17,24,39,0.06)] p-4 sm:p-6">
          <ShimmerLoading className="h-64 w-full" />
        </div>
      </div>

      {/* Recent activity skeleton */}
      <div>
        <ShimmerLoading className="h-6 w-32 mb-4 sm:mb-6" />
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  )
}