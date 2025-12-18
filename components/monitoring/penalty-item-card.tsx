'use client'

import {
    Package,
    Timer,
    CheckCircle,
    Clock,
    Eye,
    AlertTriangle
} from 'lucide-react'
import { ModernButton } from '@/components/ui/modern-button'
import { cn } from '@/lib/utils'

interface OverdueTransaction {
    id: string
    user_id: string
    equipment_id: string
    borrow_date: string
    expected_return_date: string
    actual_return_date: string | null
    status: string
    notes: string | null
    penalty_amount: number | null
    penalty_paid: boolean | null
    created_at: string
    user: {
        full_name: string
        email: string
        department: string
        nim: string | null
    } | null
    equipment: {
        name: string
        serial_number: string
    } | null
}

interface PenaltyItemCardProps {
    item: OverdueTransaction
    onViewDetail: (item: OverdueTransaction) => void
    getDaysLate: (date: string) => number
    calculatePenalty: (days: number) => number
    formatCurrency: (amount: number) => string
}

export function PenaltyItemCard({
    item,
    onViewDetail,
    getDaysLate,
    calculatePenalty,
    formatCurrency
}: PenaltyItemCardProps) {
    const daysLate = getDaysLate(item.expected_return_date)
    const penaltyAmount = calculatePenalty(daysLate)
    const isPaid = item.penalty_paid === true
    const isReturned = item.status === 'returned'

    return (
        <div className="relative bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
            {/* Left Status Strip */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1.5",
                isPaid ? "bg-green-500" :
                    isReturned ? "bg-blue-500" :
                        "bg-red-500"
            )} />

            <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between pl-3">
                {/* Main Info Section */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3 lg:hidden">
                        {/* Mobile Top Row: Amount & Status */}
                        <div>
                            <span className="text-xl font-black text-red-600 block">{formatCurrency(penaltyAmount)}</span>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Denda</span>
                        </div>
                        <div className={cn("p-1.5 rounded-lg",
                            isPaid ? "bg-green-100 text-green-700" :
                                isReturned ? "bg-blue-100 text-blue-700" :
                                    "bg-red-100 text-red-700"
                        )}>
                            {isPaid ? <CheckCircle className="w-5 h-5" /> :
                                isReturned ? <CheckCircle className="w-5 h-5" /> :
                                    <Timer className="w-5 h-5" />}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* User Avatar & Info */}
                        <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white",
                                isPaid || isReturned ? "bg-gradient-to-br from-green-400 to-green-600" : "bg-gradient-to-br from-red-500 to-red-600"
                            )}>
                                {item.user?.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-gray-900 truncate max-w-[150px] sm:max-w-none">{item.user?.full_name || 'N/A'}</span>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <span>{item.user?.nim || item.user?.email}</span>
                                    <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                                    <span className="font-medium text-gray-400">{item.user?.department}</span>
                                </div>
                            </div>
                        </div>

                        {/* Equipment Details */}
                        <div className="hidden sm:block w-px h-8 bg-gray-100 mx-2" />

                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <Package className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium">{item.equipment?.name}</span>
                            <span className="text-gray-300">|</span>
                            <span className="font-mono text-xs text-gray-400">{item.equipment?.serial_number}</span>
                        </div>
                    </div>
                </div>

                {/* Right Section: Stats & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-6 border-t border-gray-100 pt-4 lg:pt-0 lg:border-t-0 mt-2 lg:mt-0">
                    {/* Desktop Amount View */}
                    <div className="hidden lg:block text-right min-w-[100px]">
                        <span className="text-xl font-black text-red-600 block leading-tight">{formatCurrency(penaltyAmount)}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Denda</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Days Late Badge */}
                        <div className="flex flex-col items-center px-3 py-1 bg-red-50 rounded-lg border border-red-100">
                            <span className="text-sm font-bold text-red-600">{daysLate} Hari</span>
                            <span className="text-[10px] text-red-400 uppercase font-medium">Terlambat</span>
                        </div>

                        {/* Status Badge (Desktop) & Action Button */}
                        <div className="flex items-center gap-3">
                            <div className="hidden lg:flex">
                                {isPaid ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                        <CheckCircle className="w-3.5 h-3.5" /> Dibayar
                                    </span>
                                ) : isReturned ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                        <CheckCircle className="w-3.5 h-3.5" /> Dikembalikan
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                        <Timer className="w-3.5 h-3.5" /> Menunggu
                                    </span>
                                )}
                            </div>

                            <ModernButton
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewDetail(item)}
                                className="bg-gray-100 hover:bg-pink-50 hover:text-[#ff007a] transition-colors rounded-full w-9 h-9 p-0 flex items-center justify-center"
                            >
                                <Eye className="w-4 h-4" />
                            </ModernButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
