'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, AlertCircle, Calendar, Settings, Wrench, Shield } from 'lucide-react';
import { ModernBadge } from '@/components/ui/modern-badge';
import { cn } from '@/lib/utils';

interface Notification {
    id: string;
    type: 'due_date_reminder' | 'approval_required' | 'system_maintenance' | 'equipment_alert' | 'safety_compliance';
    title: string;
    message: string;
    is_read: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    data: Record<string, unknown> | null;
    created_at: string;
    read_at: string | null;
}

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

const notificationIcons = {
    due_date_reminder: Calendar,
    approval_required: CheckCheck,
    system_maintenance: Settings,
    equipment_alert: Wrench,
    safety_compliance: Shield,
};

const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
};

const priorityLabels = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    urgent: 'Mendesak',
};

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const url = showUnreadOnly ? '/api/notifications?unread=true' : '/api/notifications';
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, showUnreadOnly]);

    const markAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: true }),
            });
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
            });
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
                );
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (!isOpen) return null;

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                        {unreadCount > 0 && (
                            <ModernBadge variant="destructive" className="text-xs">
                                {unreadCount} baru
                            </ModernBadge>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showUnreadOnly}
                            onChange={e => setShowUnreadOnly(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        Hanya belum dibaca
                    </label>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Tandai semua dibaca
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Memuat notifikasi...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Tidak ada notifikasi</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map(notification => {
                            const Icon = notificationIcons[notification.type] || AlertCircle;
                            return (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
                                        !notification.is_read && 'bg-blue-50/50'
                                    )}
                                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                                >
                                    <div className="flex gap-3">
                                        <div
                                            className={cn(
                                                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                                                notification.priority === 'urgent' ? 'bg-red-100' :
                                                    notification.priority === 'high' ? 'bg-orange-100' :
                                                        notification.priority === 'medium' ? 'bg-blue-100' : 'bg-gray-100'
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    'h-5 w-5',
                                                    notification.priority === 'urgent' ? 'text-red-600' :
                                                        notification.priority === 'high' ? 'text-orange-600' :
                                                            notification.priority === 'medium' ? 'text-blue-600' : 'text-gray-600'
                                                )}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    'text-sm',
                                                    notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    {!notification.is_read && (
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                markAsRead(notification.id);
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                                            title="Tandai dibaca"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            deleteNotification(notification.id);
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <ModernBadge className={cn('text-xs', priorityColors[notification.priority])}>
                                                    {priorityLabels[notification.priority]}
                                                </ModernBadge>
                                                <span className="text-xs text-gray-400">
                                                    {formatDate(notification.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <a
                    href="/dashboard/notifications"
                    className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Lihat Semua Notifikasi
                </a>
            </div>
        </div>
    );
}
