'use client'

import Image from 'next/image'
import { Package, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Equipment {
    id: string
    name: string
    description: string
    category?: { name: string }
    category_id: string
    serial_number: string
    condition: string
    status: string
    location: string
    image_url: string
    purchase_date: string
    purchase_price: string
    created_at: string
    updated_at: string
    stock: number
    equipment_images?: Array<{
        id: string
        image_url: string
        is_primary: boolean
    }>
}

interface EquipmentGridCardProps {
    item: Equipment
    selected: boolean
    onToggleSelect: (id: string) => void
    onView: (item: Equipment) => void
    onEdit?: (item: Equipment) => void
    onDelete?: (id: string) => void
    canManage: boolean
}

export function EquipmentGridCard({
    item,
    selected,
    onToggleSelect,
    onView,
    onEdit,
    onDelete,
    canManage
}: EquipmentGridCardProps) {

    // Get the primary image or first image from equipment_images array
    const getImageUrl = () => {
        if (item.equipment_images && item.equipment_images.length > 0) {
            const primaryImage = item.equipment_images.find(img => img.is_primary)
            return primaryImage?.image_url || item.equipment_images[0].image_url
        }
        return item.image_url || null
    }

    const imageUrl = getImageUrl()

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; bgColor: string; textColor: string }> = {
            available: { label: 'Tersedia', bgColor: 'bg-[#00AC1A]', textColor: 'text-white' },
            borrowed: { label: 'Dipinjam', bgColor: 'bg-[#FF6666]', textColor: 'text-white' },
            maintenance: { label: 'Perawatan', bgColor: 'bg-[#F59E0B]', textColor: 'text-white' },
            retired: { label: 'Tidak Tersedia', bgColor: 'bg-gray-500', textColor: 'text-white' }
        }
        return configs[status] || configs.available
    }

    const getStockText = (status: string) => {
        if (typeof item.stock === 'number') {
            return `Stok ${item.stock}`
        }

        switch (status) {
            case 'available': return 'Stok 1'
            case 'borrowed': return 'Stok Habis'
            case 'maintenance': return 'Dalam Perawatan'
            case 'retired': return 'Tidak Tersedia'
            default: return 'Stok Habis'
        }
    }

    const statusConfig = getStatusConfig(item.status)

    return (
        <div
            className={cn(
                "group relative bg-white rounded-[20px] overflow-hidden transition-all duration-300 cursor-pointer",
                "shadow-[5px_5px_20px_rgba(0,0,0,0.05)] hover:shadow-[5px_5px_30px_rgba(0,0,0,0.1)]",
                selected && "ring-2 ring-[#FD1278] ring-offset-2"
            )}
            onClick={() => onView(item)}
        >
            {/* Selection Checkbox */}
            <div
                className="absolute top-3 left-3 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelect(item.id)}
                    className="w-5 h-5 rounded border-gray-300 text-[#FD1278] focus:ring-[#FD1278] cursor-pointer bg-white/90 backdrop-blur-sm"
                />
            </div>

            {/* Actions Menu */}
            {canManage && (
                <div
                    className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-white text-gray-500 hover:text-gray-700 transition-colors shadow-sm">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onView(item)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Lihat Detail
                            </DropdownMenuItem>
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(item)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-600 focus:text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hapus
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            {/* Image Area */}
            <div className="relative w-full aspect-[200/204] bg-[#E6E6E6] flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={item.name}
                        fill
                        className="object-contain p-4 drop-shadow-[4px_4px_20px_rgba(0,0,0,0.25)]"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                ) : (
                    <Package className="w-16 h-16 text-gray-400" />
                )}
            </div>

            {/* Content Area */}
            <div className="p-4 space-y-2">
                {/* Equipment Name */}
                <h3 className="font-medium text-sm text-[#222222] truncate" title={item.name}>
                    {item.name}
                </h3>

                {/* Stock Info & Status Badge Row */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#222222] font-medium">
                        {getStockText(item.status)}
                    </span>

                    {/* Status Badge */}
                    <span className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-bold text-center uppercase tracking-wide",
                        statusConfig.bgColor,
                        statusConfig.textColor
                    )}>
                        {statusConfig.label}
                    </span>
                </div>
            </div>
        </div>
    )
}
