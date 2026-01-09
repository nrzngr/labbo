'use client';

import { useState, useEffect } from 'react';
import {
    Filter, X, Save, Trash2, Search, ChevronDown,
    ChevronUp, SlidersHorizontal
} from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModernBadge } from '@/components/ui/modern-badge';
import { ModernCard, ModernCardContent, ModernCardHeader } from '@/components/ui/modern-card';
import { cn } from '@/lib/utils';

interface FilterOption {
    value: string;
    label: string;
}

interface AdvancedFilterPanelProps {
    filterType: 'equipment' | 'transactions' | 'users';
    onFilterChange: (filters: Record<string, unknown>) => void;
    savedFilters?: SavedFilter[];
    onSaveFilter?: (name: string, filters: Record<string, unknown>) => void;
    onDeleteFilter?: (id: string) => void;
}

interface SavedFilter {
    id: string;
    name: string;
    filters: Record<string, unknown>;
    is_default: boolean;
}

const categoryOptions: FilterOption[] = [
    { value: 'electronics', label: 'Elektronik' },
    { value: 'mechanical', label: 'Mekanikal' },
    { value: 'chemical', label: 'Kimia' },
    { value: 'optical', label: 'Optik' },
    { value: 'measurement', label: 'Pengukuran' },
    { value: 'computer', label: 'Komputer' },
    { value: 'general', label: 'Umum' },
];

const statusOptions: FilterOption[] = [
    { value: 'available', label: 'Tersedia' },
    { value: 'borrowed', label: 'Dipinjam' },
    { value: 'maintenance', label: 'Pemeliharaan' },
    { value: 'retired', label: 'Rusak / Hilang' },
];

const conditionOptions: FilterOption[] = [
    { value: 'excellent', label: 'Sangat Baik' },
    { value: 'good', label: 'Baik' },
    { value: 'fair', label: 'Cukup' },
    { value: 'poor', label: 'Buruk' },
];

export function AdvancedFilterPanel({
    filterType,
    onFilterChange,
    savedFilters = [],
    onSaveFilter,
    onDeleteFilter,
}: AdvancedFilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filters, setFilters] = useState<Record<string, unknown>>({});
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [filterName, setFilterName] = useState('');

    const handleFilterChange = (key: string, value: unknown) => {
        const newFilters = { ...filters, [key]: value };
        if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
            delete newFilters[key];
        }
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const toggleArrayFilter = (key: string, value: string) => {
        const current = (filters[key] as string[]) || [];
        const newValue = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        handleFilterChange(key, newValue);
    };

    const clearFilters = () => {
        setFilters({});
        onFilterChange({});
    };

    const loadSavedFilter = (savedFilter: SavedFilter) => {
        setFilters(savedFilter.filters);
        onFilterChange(savedFilter.filters);
    };

    const handleSaveFilter = () => {
        if (filterName.trim() && onSaveFilter) {
            onSaveFilter(filterName.trim(), filters);
            setFilterName('');
            setShowSaveDialog(false);
        }
    };

    const activeFilterCount = Object.keys(filters).length;

    return (
        <ModernCard>
            <ModernCardHeader className="py-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 text-left"
                    >
                        <SlidersHorizontal className="h-5 w-5 text-gray-500" />
                        <h3 className="text-base font-semibold leading-none tracking-tight text-gray-900">Filter Lanjutan</h3>
                        {activeFilterCount > 0 && (
                            <ModernBadge variant="secondary">{activeFilterCount} aktif</ModernBadge>
                        )}
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                    </button>

                    {activeFilterCount > 0 && (
                        <ModernButton variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="h-4 w-4 mr-1" />
                            Hapus Filter
                        </ModernButton>
                    )}
                </div>
            </ModernCardHeader>

            {isExpanded && (
                <ModernCardContent className="pt-0 space-y-6">
                    {/* Saved Filters */}
                    {savedFilters.length > 0 && (
                        <div className="space-y-2">
                            <Label>Filter Tersimpan</Label>
                            <div className="flex flex-wrap gap-2">
                                {savedFilters.map(sf => (
                                    <div key={sf.id} className="flex items-center gap-1">
                                        <ModernButton
                                            variant="outline"
                                            size="sm"
                                            onClick={() => loadSavedFilter(sf)}
                                            className={cn(sf.is_default && 'border-blue-500')}
                                        >
                                            {sf.name}
                                        </ModernButton>
                                        {onDeleteFilter && (
                                            <button
                                                onClick={() => onDeleteFilter(sf.id)}
                                                className="p-1 text-gray-400 hover:text-red-600"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search */}
                    <div className="space-y-2">
                        <Label>Pencarian</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari nama, serial number, atau deskripsi..."
                                value={(filters.search as string) || ''}
                                onChange={e => handleFilterChange('search', e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Equipment Filters */}
                    {filterType === 'equipment' && (
                        <>
                            <div className="space-y-2">
                                <Label>Kategori</Label>
                                <div className="flex flex-wrap gap-2">
                                    {categoryOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => toggleArrayFilter('categories', option.value)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-full text-sm border transition-colors',
                                                ((filters.categories as string[]) || []).includes(option.value)
                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {statusOptions.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => toggleArrayFilter('status', option.value)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-full text-sm border transition-colors',
                                                    ((filters.status as string[]) || []).includes(option.value)
                                                        ? 'bg-blue-500 text-white border-blue-500'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                                                )}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Kondisi</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {conditionOptions.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => toggleArrayFilter('condition', option.value)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-full text-sm border transition-colors',
                                                    ((filters.condition as string[]) || []).includes(option.value)
                                                        ? 'bg-blue-500 text-white border-blue-500'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                                                )}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Harga Min (Rp)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={(filters.min_price as string) || ''}
                                        onChange={e => handleFilterChange('min_price', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Harga Maks (Rp)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Tanpa batas"
                                        value={(filters.max_price as string) || ''}
                                        onChange={e => handleFilterChange('max_price', e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Transaction Filters */}
                    {filterType === 'transactions' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tanggal Mulai</Label>
                                <Input
                                    type="date"
                                    value={(filters.start_date as string) || ''}
                                    onChange={e => handleFilterChange('start_date', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal Akhir</Label>
                                <Input
                                    type="date"
                                    value={(filters.end_date as string) || ''}
                                    onChange={e => handleFilterChange('end_date', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Save Filter Button */}
                    {onSaveFilter && activeFilterCount > 0 && (
                        <div className="flex items-center gap-2 pt-4 border-t">
                            {showSaveDialog ? (
                                <>
                                    <Input
                                        placeholder="Nama filter..."
                                        value={filterName}
                                        onChange={e => setFilterName(e.target.value)}
                                        className="max-w-xs"
                                    />
                                    <ModernButton size="sm" onClick={handleSaveFilter}>
                                        Simpan
                                    </ModernButton>
                                    <ModernButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowSaveDialog(false);
                                            setFilterName('');
                                        }}
                                    >
                                        Batal
                                    </ModernButton>
                                </>
                            ) : (
                                <ModernButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowSaveDialog(true)}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Simpan Filter Ini
                                </ModernButton>
                            )}
                        </div>
                    )}
                </ModernCardContent>
            )}
        </ModernCard>
    );
}
