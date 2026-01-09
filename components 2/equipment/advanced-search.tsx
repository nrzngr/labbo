'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernBadge } from '@/components/ui/modern-badge'
import { Search, Filter, X, Calendar, MapPin, DollarSign } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface AdvancedFilters {
  searchTerm: string
  status: string
  categoryId: string
  condition: string
  location: string
  minPrice: string
  maxPrice: string
  purchaseDateFrom: string
  purchaseDateTo: string
  inMaintenance: boolean
  availableOnly: boolean
}

interface AdvancedSearchProps {
  filters: AdvancedFilters
  onFiltersChange: (filters: AdvancedFilters) => void
  categories: Array<{ id: string; name: string }>
}

export function AdvancedSearch({ filters, onFiltersChange, categories }: AdvancedSearchProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, searchTerm: debouncedSearchTerm })
    }, 300)

    return () => clearTimeout(timer)
  }, [debouncedSearchTerm])

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const hasActiveFilters = useMemo(() => {
    return (
      (filters.status && filters.status !== 'all') ||
      (filters.categoryId && filters.categoryId !== 'all') ||
      (filters.condition && filters.condition !== 'all') ||
      filters.location ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.purchaseDateFrom ||
      filters.purchaseDateTo ||
      filters.inMaintenance ||
      filters.availableOnly
    )
  }, [filters])

  const handleAdvancedFilterApply = () => {
    onFiltersChange(localFilters)
    setIsAdvancedOpen(false)
  }

  const handleAdvancedFilterReset = () => {
    const resetFilters: AdvancedFilters = {
      searchTerm: filters.searchTerm,
      status: 'all',
      categoryId: 'all',
      condition: 'all',
      location: '',
      minPrice: '',
      maxPrice: '',
      purchaseDateFrom: '',
      purchaseDateTo: '',
      inMaintenance: false,
      availableOnly: false,
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
    setIsAdvancedOpen(false)
  }

  const clearAllFilters = () => {
    const emptyFilters: AdvancedFilters = {
      searchTerm: '',
      status: 'all',
      categoryId: 'all',
      condition: 'all',
      location: '',
      minPrice: '',
      maxPrice: '',
      purchaseDateFrom: '',
      purchaseDateTo: '',
      inMaintenance: false,
      availableOnly: false,
    }
    setLocalFilters(emptyFilters)
    setDebouncedSearchTerm('')
    onFiltersChange(emptyFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.status && filters.status !== 'all') count++
    if (filters.categoryId && filters.categoryId !== 'all') count++
    if (filters.condition && filters.condition !== 'all') count++
    if (filters.location) count++
    if (filters.minPrice) count++
    if (filters.maxPrice) count++
    if (filters.purchaseDateFrom) count++
    if (filters.purchaseDateTo) count++
    if (filters.inMaintenance) count++
    if (filters.availableOnly) count++
    return count
  }

  return (
    <div className="space-y-4">
      {/* Main search bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, serial number, atau deskripsi..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:bg-white outline-none transition-all"
              value={debouncedSearchTerm}
              onChange={(e) => setDebouncedSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Button */}
          <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <DialogTrigger asChild>
              <button
                className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${hasActiveFilters
                  ? 'bg-[#ff007a] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Filter className="w-5 h-5" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none rounded-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Advanced Filters</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status and Condition */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={localFilters.status}
                      onValueChange={(value) => setLocalFilters({ ...localFilters, status: value })}
                    >
                      <SelectTrigger className="border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#ff007a]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="borrowed">Borrowed</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Rusak / Hilang</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select
                      value={localFilters.condition}
                      onValueChange={(value) => setLocalFilters({ ...localFilters, condition: value })}
                    >
                      <SelectTrigger className="border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#ff007a]">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Conditions</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Category and Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={localFilters.categoryId}
                      onValueChange={(value) => setLocalFilters({ ...localFilters, categoryId: value })}
                    >
                      <SelectTrigger className="border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#ff007a]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">
                      <MapPin className="inline w-3 h-3 mr-1" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      placeholder="Filter by location"
                      className="border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#ff007a]"
                      value={localFilters.location}
                      onChange={(e) => setLocalFilters({ ...localFilters, location: e.target.value })}
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>
                    <DollarSign className="inline w-3 h-3 mr-1" />
                    Price Range
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder="Min price"
                      className="border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#ff007a]"
                      value={localFilters.minPrice}
                      onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Max price"
                      className="border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#ff007a]"
                      value={localFilters.maxPrice}
                      onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
                    />
                  </div>
                </div>

                {/* Purchase Date Range */}
                <div className="space-y-2">
                  <Label>
                    <Calendar className="inline w-3 h-3 mr-1" />
                    Purchase Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      className="border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#ff007a]"
                      value={localFilters.purchaseDateFrom}
                      onChange={(e) => setLocalFilters({ ...localFilters, purchaseDateFrom: e.target.value })}
                    />
                    <Input
                      type="date"
                      className="border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-[#ff007a]"
                      value={localFilters.purchaseDateTo}
                      onChange={(e) => setLocalFilters({ ...localFilters, purchaseDateTo: e.target.value })}
                    />
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="space-y-2">
                  <Label>Quick Filters</Label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-[#ff007a] focus:ring-[#ff007a]"
                        checked={localFilters.availableOnly}
                        onChange={(e) => setLocalFilters({ ...localFilters, availableOnly: e.target.checked })}
                      />
                      <span className="text-sm">Available equipment only</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-[#ff007a] focus:ring-[#ff007a]"
                        checked={localFilters.inMaintenance}
                        onChange={(e) => setLocalFilters({ ...localFilters, inMaintenance: e.target.checked })}
                      />
                      <span className="text-sm">Under maintenance</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAdvancedFilterApply}
                    className="flex-1 py-3 bg-[#ff007a] text-white rounded-xl font-semibold hover:bg-[#e0106c] transition-all shadow-lg shadow-[#ff007a]/30"
                  >
                    Terapkan Filter
                  </button>
                  <button
                    onClick={handleAdvancedFilterReset}
                    className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100"
            >
              <X className="w-4 h-4" />
              Hapus Semua
            </button>
          )}
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.status && filters.status !== 'all' && (
              <ModernBadge variant="secondary" className="gap-1">
                Status: {filters.status}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => onFiltersChange({ ...filters, status: 'all' })}
                />
              </ModernBadge>
            )}
            {filters.categoryId && filters.categoryId !== 'all' && (
              <ModernBadge variant="secondary" className="gap-1">
                Category: {categories.find(c => c.id === filters.categoryId)?.name || filters.categoryId}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => onFiltersChange({ ...filters, categoryId: 'all' })}
                />
              </ModernBadge>
            )}
            {filters.condition && filters.condition !== 'all' && (
              <ModernBadge variant="secondary" className="gap-1">
                Condition: {filters.condition}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => onFiltersChange({ ...filters, condition: 'all' })}
                />
              </ModernBadge>
            )}
            {filters.location && (
              <ModernBadge variant="secondary" className="gap-1">
                Location: {filters.location}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => onFiltersChange({ ...filters, location: '' })}
                />
              </ModernBadge>
            )}
            {filters.availableOnly && (
              <ModernBadge variant="secondary" className="gap-1">
                Available Only
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => onFiltersChange({ ...filters, availableOnly: false })}
                />
              </ModernBadge>
            )}
            {filters.inMaintenance && (
              <ModernBadge variant="secondary" className="gap-1">
                Under Maintenance
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => onFiltersChange({ ...filters, inMaintenance: false })}
                />
              </ModernBadge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}