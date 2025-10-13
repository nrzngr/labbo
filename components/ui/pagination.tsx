import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showEdges?: boolean
  siblingCount?: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showEdges = true,
  siblingCount = 1,
  className = ''
}: PaginationProps) {
  const generatePageNumbers = () => {
    const pages: (number | string)[] = []

    // Always show first page if we have edges
    if (showEdges && totalPages > 1) {
      pages.push(1)
    }

    // Calculate range around current page
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    // Show ellipsis after first page if needed
    if (showEdges && leftSiblingIndex > 2) {
      pages.push('...')
    }

    // Add pages in range
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 || !showEdges) {
        pages.push(i)
      }
    }

    // Show ellipsis before last page if needed
    if (showEdges && rightSiblingIndex < totalPages - 1) {
      pages.push('...')
    }

    // Always show last page if we have edges and it's not already included
    if (showEdges && totalPages > 1 && rightSiblingIndex < totalPages) {
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) return null

  const pages = generatePageNumbers()

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* First page */}
      {showEdges && totalPages > 3 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Previous page */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      <div className="flex items-center space-x-1">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="h-8 w-8 flex items-center justify-center text-sm text-muted-foreground">
                ...
              </span>
            )
          }

          const pageNumber = page as number
          return (
            <Button
              key={pageNumber}
              variant={currentPage === pageNumber ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className="h-8 w-8 p-0"
            >
              {pageNumber}
            </Button>
          )
        })}
      </div>

      {/* Next page */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last page */}
      {showEdges && totalPages > 3 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

interface PaginationInfoProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  className?: string
}

export function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className = ''
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      Menampilkan {startItem}-{endItem} dari {totalItems} item
      {totalPages > 1 && ` (Halaman ${currentPage} dari ${totalPages})`}
    </div>
  )
}

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  showInfo?: boolean
  className?: string
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showInfo = true,
  className = ''
}: TablePaginationProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 ${className}`}>
      {showInfo && (
        <PaginationInfo
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          className="text-xs sm:text-sm"
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        siblingCount={1}
        showEdges={totalPages > 5}
        className="text-xs sm:text-sm"
      />
    </div>
  )
}