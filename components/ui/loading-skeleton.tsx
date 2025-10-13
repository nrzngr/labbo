interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className = "" }: LoadingSkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      role="status"
      aria-label="Loading..."
    />
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      <div className="border border-black">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-black">
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="text-left p-4 font-medium">
                    <LoadingSkeleton className="h-4 w-24" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-t border-black">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} className="p-4">
                      <LoadingSkeleton
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
        <div className="lg:hidden divide-y divide-black">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <LoadingSkeleton className="h-6 w-32" />
                <LoadingSkeleton className="h-6 w-16" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <LoadingSkeleton className="h-4 w-20" />
                  <LoadingSkeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                  <LoadingSkeleton className="h-4 w-16" />
                  <LoadingSkeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <LoadingSkeleton className="h-8 w-8" />
                <LoadingSkeleton className="h-8 w-8" />
                <LoadingSkeleton className="h-8 w-8" />
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
        <div key={i} className="border border-black p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <LoadingSkeleton className="h-4 w-16" />
            <LoadingSkeleton className="w-4 h-4" />
          </div>
          <LoadingSkeleton className="h-8 w-16 mb-2" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header skeleton */}
      <div className="mb-6 sm:mb-8">
        <LoadingSkeleton className="h-8 w-32" />
      </div>

      {/* Stats cards skeleton */}
      <CardSkeleton count={4} />

      {/* Quick actions skeleton */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8 sm:mb-12 mt-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-black p-4 sm:p-6">
            <LoadingSkeleton className="w-5 h-5 sm:w-6 sm:h-6 mb-3 sm:mb-4" />
            <LoadingSkeleton className="h-5 w-24 mb-2" />
            <LoadingSkeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Analytics skeleton */}
      <div className="mb-8 sm:mb-12">
        <LoadingSkeleton className="h-6 w-24 mb-4 sm:mb-6" />
        <div className="border border-black p-4 sm:p-6">
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Recent activity skeleton */}
      <div>
        <LoadingSkeleton className="h-6 w-32 mb-4 sm:mb-6" />
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  )
}