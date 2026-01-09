import { Package, MapPin, Calendar, MoreVertical, Eye, Edit, Trash2, Box } from "lucide-react"
import { ModernButton } from "@/components/ui/modern-button"
import { ModernBadge } from "@/components/ui/modern-badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

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
}

interface EquipmentItemCardProps {
    item: Equipment
    selected: boolean
    onToggleSelect: (id: string) => void
    onView: (item: Equipment) => void
    onEdit?: (item: Equipment) => void
    onDelete?: (id: string) => void
    canManage: boolean
    isListView?: boolean
}

export function EquipmentItemCard({
    item,
    selected,
    onToggleSelect,
    onView,
    onEdit,
    onDelete,
    canManage,
    isListView = false
}: EquipmentItemCardProps) {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-500'
            case 'borrowed': return 'bg-yellow-500'
            case 'maintenance': return 'bg-purple-500'
            case 'retired': return 'bg-red-500'
            default: return 'bg-gray-500'
        }
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'available': return 'success'
            case 'borrowed': return 'warning'
            case 'maintenance': return 'default' // Purple usually maps to default in this system or we customize
            case 'retired': return 'destructive'
            default: return 'outline'
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            available: 'Tersedia',
            borrowed: 'Dipinjam',
            maintenance: 'Maintenance',
            retired: 'Rusak / Hilang'
        }
        return labels[status] || status
    }

    return (
        <div
            className={cn(
                "group relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg overflow-hidden",
                selected
                    ? "border-[#ff007a] ring-1 ring-[#ff007a] bg-[#fff0f7]/30"
                    : "border-gray-100"
            )}
        >
            {/* Left colored strip */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", getStatusColor(item.status))} />

            <div className="p-4 sm:p-5 pl-5 sm:pl-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {/* Selection Checkbox & Mobile Layout Helper */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => onToggleSelect(item.id)}
                            className="w-5 h-5 rounded border-gray-300 text-[#ff007a] focus:ring-[#ff007a] cursor-pointer"
                        />
                        {/* Item Icon/Image placeholder */}
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 flex-shrink-0">
                            <Package className="w-6 h-6 text-gray-400" />
                        </div>

                        {/* Mobile Title & Status (Visible only on very small screens if stacked) */}
                        <div className="sm:hidden flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                            <p className="text-xs text-gray-500 truncate">{item.serial_number}</p>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0 w-full">
                        <div className="hidden sm:block mb-1">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-lg text-gray-900 truncate pr-4">{item.name}</h3>
                                <div className="flex items-center gap-2">
                                    <ModernBadge variant={getStatusBadgeVariant(item.status)} size="sm">
                                        {getStatusLabel(item.status)}
                                    </ModernBadge>
                                    {/* Action Menu for Desktop */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => onView(item)}>
                                                <Eye className="w-4 h-4 mr-2" />
                                                Lihat Detail
                                            </DropdownMenuItem>
                                            {canManage && onEdit && (
                                                <DropdownMenuItem onClick={() => onEdit(item)}>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                            )}
                                            {canManage && onDelete && (
                                                <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-600 focus:text-red-600">
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Hapus
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4 mt-3 sm:mt-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Box className="w-4 h-4 text-gray-400" />
                                <span className="truncate" title={item.category?.name || 'Uncategorized'}>
                                    {item.category?.name || 'Uncategorized'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-xs">
                                    {item.serial_number}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{item.location}</span>
                            </div>
                            {/* Mobile Status Badge (replaces desktop one for layout flow) */}
                            <div className="sm:hidden col-span-2 mt-1">
                                <ModernBadge variant={getStatusBadgeVariant(item.status)} size="sm">
                                    {getStatusLabel(item.status)}
                                </ModernBadge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex sm:hidden items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <ModernButton
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onView(item)}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Detail
                    </ModernButton>
                    {canManage && onEdit && (
                        <ModernButton
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="w-10 px-0 flex items-center justify-center"
                        >
                            <Edit className="w-4 h-4" />
                        </ModernButton>
                    )}
                </div>
            </div>
        </div>
    )
}
