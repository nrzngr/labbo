import { LucideIcon } from 'lucide-react'
import { TrendingUp } from 'lucide-react'

interface StatCardProps {
    title: string
    value: number | string
    subtitle?: string | React.ReactNode
    icon: LucideIcon
    trend?: string
    delay?: number
    className?: string
}

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    delay = 0,
    className = ""
}: StatCardProps) {
    return (
        <div
            className={`group bg-white rounded-[20px] p-6 relative overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100/50 animate-in fade-in slide-in-from-bottom-4 ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FD1278]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
                <p className="text-[16px] font-medium text-[#222222] mb-3" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    {title}
                </p>
                <h3 className="text-[48px] font-bold text-[#222222] leading-tight mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    {value}
                </h3>
                {subtitle && (
                    <div className="flex items-center gap-2">
                        {trend && (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                <TrendingUp className="w-3 h-3" />
                                {trend}
                            </span>
                        )}
                        <div className="text-sm text-gray-400 font-medium" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            {subtitle}
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute bottom-4 right-4 w-[60px] h-[60px] bg-[#FD1278] rounded-full flex items-center justify-center shadow-lg shadow-[#FD1278]/30 group-hover:scale-110 transition-transform">
                <Icon className="w-7 h-7 text-white" />
            </div>
        </div>
    )
}
