"use client";

import { useState, useEffect } from 'react';
import {
    Bell, Check, CheckCheck, Trash2, AlertCircle, Calendar,
    Settings, Wrench, Shield, Filter, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { cn } from '@/lib/utils';
;

;

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

const notificationIcons = {
    due_date_reminder: Calendar,
    approval_required: CheckCheck,
    system_maintenance: Settings,
    equipment_alert: Wrench,
    safety_compliance: Shield,
};

const typeLabels = {
    due_date_reminder: 'Pengingat Jatuh Tempo',
    approval_required: 'Persetujuan Diperlukan',
    system_maintenance: 'Pemeliharaan Sistem',
    equipment_alert: 'Peringatan Peralatan',
    safety_compliance: 'Kepatuhan Keselamatan',
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

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [total, setTotal] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const url = filter === 'unread'
                ? '/api/notifications?unread=true&limit=50'
                : '/api/notifications?limit=50';
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setTotal(data.total || 0);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const markAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: true }),
            });
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/mark-all-read', { method: 'POST' });
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            if (response.ok) {
                const notification = notifications.find(n => n.id === id);
                setNotifications(prev => prev.filter(n => n.id !== id));
                if (notification && !notification.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredNotifications = filter === 'all'
        ? notifications
        : filter === 'unread'
            ? notifications.filter(n => !n.is_read)
            : notifications.filter(n => n.type === filter);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
                        <p className="text-gray-500">
                            {unreadCount > 0
                                ? `Anda memiliki ${unreadCount} notifikasi belum dibaca`
                                : 'Semua notifikasi telah dibaca'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={fetchNotifications}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Segarkan
                        </Button>
                        {unreadCount > 0 && (
                            <Button size="sm" onClick={markAllAsRead}>
                                <CheckCheck className="h-4 w-4 mr-2" />
                                Tandai Semua Dibaca
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500 mr-2">Filter:</span>
                            {[
                                { value: 'all', label: 'Semua' },
                                { value: 'unread', label: 'Belum Dibaca' },
                                { value: 'due_date_reminder', label: 'Jatuh Tempo' },
                                { value: 'approval_required', label: 'Persetujuan' },
                                { value: 'equipment_alert', label: 'Peralatan' },
                            ].map(f => (
                                <Button
                                    key={f.value}
                                    variant={filter === f.value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilter(f.value)}
                                >
                                    {f.label}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Daftar Notifikasi
                            <Badge variant="secondary">{filteredNotifications.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="text-center py-12">
                                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-xl font-medium text-gray-900">Tidak Ada Notifikasi</p>
                                <p className="text-gray-500 mt-1">
                                    {filter === 'unread'
                                        ? 'Semua notifikasi telah dibaca'
                                        : 'Belum ada notifikasi untuk ditampilkan'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredNotifications.map(notification => {
                                    const Icon = notificationIcons[notification.type] || AlertCircle;
                                    return (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                'p-4 rounded-lg border transition-all hover:shadow-md',
                                                !notification.is_read
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : 'bg-white border-gray-200'
                                            )}
                                        >
                                            <div className="flex gap-4">
                                                <div
                                                    className={cn(
                                                        'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                                                        notification.priority === 'urgent' ? 'bg-red-100' :
                                                            notification.priority === 'high' ? 'bg-orange-100' :
                                                                notification.priority === 'medium' ? 'bg-blue-100' : 'bg-gray-100'
                                                    )}
                                                >
                                                    <Icon
                                                        className={cn(
                                                            'h-6 w-6',
                                                            notification.priority === 'urgent' ? 'text-red-600' :
                                                                notification.priority === 'high' ? 'text-orange-600' :
                                                                    notification.priority === 'medium' ? 'text-blue-600' : 'text-gray-600'
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className={cn(
                                                                'text-base',
                                                                notification.is_read ? 'text-gray-700' : 'text-gray-900 font-semibold'
                                                            )}>
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                {notification.message}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                                                <Badge className={priorityColors[notification.priority]}>
                                                                    {priorityLabels[notification.priority]}
                                                                </Badge>
                                                                <Badge variant="outline">
                                                                    {typeLabels[notification.type]}
                                                                </Badge>
                                                                <span className="text-xs text-gray-400">
                                                                    {formatDate(notification.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {!notification.is_read && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => markAsRead(notification.id)}
                                                                    title="Tandai dibaca"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => deleteNotification(notification.id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
