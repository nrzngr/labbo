import { ModernButton } from '@/components/ui/modern-button'
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
        <ModernButton
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </ModernButton>
      )}

      {/* Previous page */}
      <ModernButton
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </ModernButton>

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
            <ModernButton
              key={pageNumber}
              variant={currentPage === pageNumber ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className="h-8 w-8 p-0"
            >
              {pageNumber}
            </ModernButton>
          )
        })}
      </div>

      {/* Next page */}
      <ModernButton
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </ModernButton>

      {/* Last page */}
      {showEdges && totalPages > 3 && (
        <ModernButton
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </ModernButton>
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
  // Handle edge case when there are no items
  if (totalItems === 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Tidak ada item
      </div>
    )
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      Menampilkan {startItem}-{endItem} dari {totalItems} item
      {totalPages > 1 && ` (Halaman ${currentPage} dari ${totalPages})`}
    </div>
  )
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  showInfo?: boolean
  className?: string
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showInfo = true,
  className = ''
}: TablePaginationProps) {
  // Handle edge case when there are no items
  if (totalItems === 0 && totalPages <= 1) {
    return (
      <div className={`flex items-center justify-center py-6 ${className}`}>
        <span className="text-sm text-gray-400 italic">Tidak ada item untuk ditampilkan</span>
      </div>
    )
  }

  const startItem = Math.max((currentPage - 1) * itemsPerPage + 1, 1)
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`flex items-center justify-between gap-6 py-5 px-6 bg-gray-50/50 border-t border-gray-100 ${className}`}>
      {/* Left: Item count info */}
      {showInfo && totalItems > 0 && (
        <p className="text-sm text-gray-600">
          Menampilkan <span className="font-bold text-[#ff007a]">{startItem}-{endItem}</span> dari <span className="font-bold text-gray-900">{totalItems}</span> item
        </p>
      )}

      {/* Right: Controls */}
      <div className="flex items-center gap-6 ml-auto">
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-medium">Baris per halaman:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                onPageSizeChange(Number(value))
                onPageChange(1)
              }}
            >
              <SelectTrigger className="h-9 w-20 border-gray-200 bg-white text-sm font-semibold rounded-xl hover:border-[#ff007a] focus:ring-2 focus:ring-[#ff007a]/20 shadow-sm px-3">
                <SelectValue placeholder={itemsPerPage.toString()} />
              </SelectTrigger>
              <SelectContent side="top" className="rounded-xl">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()} className="text-sm font-medium">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page navigation */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            siblingCount={1}
            showEdges={totalPages > 5}
          />
        )}
      </div>
    </div>
  )
}