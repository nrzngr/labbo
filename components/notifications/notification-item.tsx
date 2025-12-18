import { ModernCard } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernButton } from '@/components/ui/modern-button'
import { cn } from '@/lib/utils'
import {
    Bell,
    Info,
    AlertTriangle,
    CheckCircle,
    AlertOctagon,
    Trash2,
    Clock,
    Check
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

export interface Notification {
    id: string
    user_id: string
    type: string
    title: string
    message: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    is_read: boolean
    data: any
    created_at: string
}

interface NotificationItemProps {
    notification: Notification
    onMarkAsRead: (id: string) => void
    onDelete: (id: string) => void
    isMarkingRead: boolean
    isDeleting: boolean
}

export function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
    isMarkingRead,
    isDeleting
}: NotificationItemProps) {

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'critical':
                return {
                    icon: AlertOctagon,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    border: 'border-l-red-500',
                    badge: 'destructive' as const
                }
            case 'high':
                return {
                    icon: AlertTriangle,
                    color: 'text-orange-600',
                    bg: 'bg-orange-50',
                    border: 'border-l-orange-500',
                    badge: 'destructive' as const
                }
            case 'medium':
                return {
                    icon: Info, // Changed from Bell to Info for medium to be distinct
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                    border: 'border-l-blue-500',
                    badge: 'default' as const
                }
            case 'low':
            default:
                return {
                    icon: CheckCircle, // Changed to CheckCircle or similar benign icon
                    color: 'text-gray-600',
                    bg: 'bg-gray-50',
                    border: 'border-l-gray-400',
                    badge: 'secondary' as const
                }
        }
    }

    const style = getPriorityStyle(notification.priority)
    const Icon = style.icon

    return (
        <ModernCard className={cn(
            "group relative overflow-hidden transition-all duration-300 hover:shadow-md border-l-4",
            style.border,
            !notification.is_read ? "bg-white" : "bg-gray-50/50"
        )}>
            <div className="p-4 flex gap-4">
                {/* Icon Column */}
                <div className={cn(
                    "h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors",
                    style.bg,
                    style.color
                )}>
                    <Icon className="h-5 w-5" />
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={cn(
                            "font-semibold text-gray-900 leading-tight pr-8",
                            !notification.is_read && "text-blue-700"
                        )}>
                            {notification.title}
                        </h3>
                        <span className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                        </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                        {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                        <ModernBadge variant={style.badge} className="uppercase text-[10px] tracking-wider h-5 px-1.5">
                            {notification.priority}
                        </ModernBadge>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {!notification.is_read && (
                                <ModernButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onMarkAsRead(notification.id)}
                                    disabled={isMarkingRead}
                                    className="h-8 px-2 text-blue-600 hover:bg-blue-50"
                                    title="Tandai sudah dibaca"
                                >
                                    <Check className="h-4 w-4 mr-1" />
                                    <span className="text-xs">Baca</span>
                                </ModernButton>
                            )}
                            <ModernButton
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(notification.id)}
                                disabled={isDeleting}
                                className="h-8 px-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                title="Hapus"
                            >
                                <Trash2 className="h-4 w-4" />
                            </ModernButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* Unread Indicator Dot */}
            {!notification.is_read && (
                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500 shadow-md ring-4 ring-white" />
            )}
        </ModernCard>
    )
}
