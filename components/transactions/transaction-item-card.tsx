'use client'

import { ModernBadge } from '@/components/ui/modern-badge'
import {
    Calendar,
    Package,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    TrendingUp,
    ArrowRight,
    Building2,
    FileText,
    User
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionItemCardProps {
    transaction: any; // Using any for flexibility as types might vary slightly across pages, ideally verify against BorrowingTransaction
}

export function TransactionItemCard({ transaction }: TransactionItemCardProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getStatusConfig = (status: string) => {
        const config: Record<string, { color: string, bg: string, icon: any, label: string, border: string }> = {
            pending: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'bg-yellow-500', icon: Clock, label: 'Menunggu' },
            active: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'bg-purple-500', icon: TrendingUp, label: 'Aktif' },
            returned: { color: 'text-green-600', bg: 'bg-green-50', border: 'bg-green-500', icon: CheckCircle, label: 'Dikembalikan' },
            overdue: { color: 'text-red-600', bg: 'bg-red-50', border: 'bg-red-500', icon: AlertCircle, label: 'Terlambat' },
            rejected: { color: 'text-red-600', bg: 'bg-red-50', border: 'bg-red-500', icon: XCircle, label: 'Ditolak' },
        }
        return config[status] || config.active
    }

    const statusConfig = getStatusConfig(transaction.status)
    const StatusIcon = statusConfig.icon

    return (
        <div className="relative bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
            {/* Left Colored Strip */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", statusConfig.border)} />

            <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between pl-3">
                {/* Left Section: Equipment & User */}
                <div className="flex-1 space-y-3">
                    {/* Header Line: Equipment Name & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#ff007a] transition-colors">
                            {transaction.equipment?.name || 'Unknown Equipment'}
                        </h3>
                        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold w-fit", statusConfig.bg, statusConfig.color)}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusConfig.label}
                        </div>
                    </div>

                    {/* User Info Row */}
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs ring-2 ring-white">
                            <User className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-gray-900 text-sm">{transaction.user?.full_name}</span>
                                <span className="text-xs text-gray-500 font-medium">• {transaction.user?.nim || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Date & Details */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2 text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100">
                            <Package className="w-3 h-3 text-gray-400" />
                            <span className="font-mono">{transaction.equipment?.serial_number}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium text-xs">{formatDate(transaction.borrow_date)}</span>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <span className="font-medium text-xs">
                                {formatDate(transaction.actual_return_date || transaction.expected_return_date)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Section: Compact Status/Action placeholder */}
                <div className="flex items-center justify-between lg:justify-end border-t border-gray-100 pt-3 lg:pt-0 lg:border-t-0 mt-1 lg:mt-0">
                    {/* Can add action buttons here if needed */}
                </div>
            </div>
        </div>
    )
}
