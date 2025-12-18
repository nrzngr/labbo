'use client'

import { ModernCard } from '@/components/ui/modern-card'
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
    FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BorrowingTransaction {
    id: string
    borrow_date: string
    expected_return_date: string
    actual_return_date: string | null
    status: string
    purpose: string | null
    notes: string | null
    equipment: {
        name: string
        serial_number: string
    }
    user: {
        full_name: string
        email: string
        nim: string | null
        department: string
    }
}

interface MonitoringItemCardProps {
    transaction: BorrowingTransaction
}

export function MonitoringItemCard({ transaction }: MonitoringItemCardProps) {
    const getDaysRemaining = (expectedDate: string) => {
        const today = new Date()
        const returnDate = new Date(expectedDate)
        const diffTime = returnDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

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

    const daysRemaining = getDaysRemaining(transaction.expected_return_date)
    const isUrgent = daysRemaining <= 2 && daysRemaining >= 0 && transaction.status === 'active'
    const isOverdue = daysRemaining < 0 && transaction.status === 'active'
    const statusConfig = getStatusConfig(transaction.status)
    const StatusIcon = statusConfig.icon

    return (
        <div className="relative bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
            {/* Left Colored Strip */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", statusConfig.border)} />

            <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between pl-3">
                {/* Left Section: Equipment & User */}
                <div className="flex-1 space-y-4">
                    {/* Header Line: Equipment Name & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#ff007a] transition-colors">
                            {transaction.equipment.name}
                        </h3>

                        <div className="flex items-center gap-2">
                            {/* Status Pill */}
                            <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold", statusConfig.bg, statusConfig.color)}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {statusConfig.label}
                            </div>

                            {/* Urgent/Overdue Badge */}
                            {(isUrgent || isOverdue) && (
                                <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold animate-pulse",
                                    isOverdue ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                                )}>
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {isOverdue ? 'Terlambat' : 'Segera Kembali'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Info Row */}
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#ff007a] to-[#ff5c8d] flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                            {transaction.user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-gray-900">{transaction.user.full_name}</span>
                                <span className="text-xs text-gray-500 font-medium">• {transaction.user.nim || '-'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {transaction.user.department}
                                </span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span className="flex items-center gap-1 font-mono text-gray-400">
                                    <Package className="w-3 h-3" />
                                    {transaction.equipment.serial_number}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Date & Note Row */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{formatDate(transaction.borrow_date)}</span>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <span className={cn("font-medium", isOverdue && "text-red-500")}>
                                {formatDate(transaction.expected_return_date)}
                            </span>
                        </div>

                        {transaction.purpose && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <FileText className="w-3.5 h-3.5" />
                                <span className="text-xs truncate max-w-[200px]">{transaction.purpose.replace(/[\[\]"]/g, '')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section: Countdown */}
                {transaction.status === 'active' && (
                    <div className="lg:border-l lg:border-gray-100 lg:pl-6 min-w-[120px] flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center pt-4 lg:pt-0 border-t border-gray-100 lg:border-t-0 mt-2 lg:mt-0">
                        <div className="text-right">
                            <span className="text-4xl font-black tracking-tight text-gray-900 block leading-none">
                                {Math.abs(daysRemaining)}
                            </span>
                            <span className={cn("text-xs font-bold uppercase tracking-wider mt-1 block",
                                daysRemaining < 0 ? "text-red-500" : "text-gray-500"
                            )}>
                                {daysRemaining < 0 ? 'Hari Terlambat' : 'Hari Tersisa'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Placeholder for non-active states to balance layout if needed, or actions */}
                {transaction.status !== 'active' && (
                    <div className="hidden lg:block lg:border-l lg:border-gray-100 lg:pl-6 min-w-[120px]">
                        {/* Could add action buttons here later */}
                    </div>
                )}
            </div>
        </div>
    )
}
