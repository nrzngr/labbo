"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernCard, ModernCardContent, ModernCardHeader } from '@/components/ui/modern-card';
import { NotificationItem, Notification } from '@/components/notifications/notification-item';
import {
    Bell,
    CheckCheck,
    RefreshCw,
    Inbox
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationsPage() {
    const [filter, setFilter] = useState<string>('all');
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading, refetch } = useQuery({
        queryKey: ['notifications', filter],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Tidak terautentikasi");

            let query = supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (filter === 'unread') {
                query = query.eq('is_read', false);
            } else if (filter !== 'all') {
                query = query.eq('type', filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Notification[];
        }
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('is_read', false);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success("Berhasil", {
                description: "Semua notifikasi ditandai sudah dibaca",
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success("Notifikasi dihapus", {
                description: "Notifikasi berhasil dihapus dari daftar",
            });
        }
    });

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pusat Notifikasi</h1>
                    <p className="text-gray-500 mt-1">
                        {unreadCount > 0
                            ? `Anda memiliki ${unreadCount} notifikasi baru yang perlu perhatian`
                            : 'Anda tidak memiliki notifikasi baru'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ModernButton
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="h-10"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Segarkan
                    </ModernButton>
                    {unreadCount > 0 && (
                        <ModernButton
                            size="sm"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                            className="h-10 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Tandai Semua Dibaca
                        </ModernButton>
                    )}
                </div>
            </div>

            <ModernCard className="border-2 border-[#dfe2ec] bg-white/85 backdrop-blur-xl shadow-sm min-h-[600px]">
                <ModernCardHeader
                    title="Daftar Notifikasi"
                    description="Pantau aktivitas dan peringatan sistem"
                    className="border-b border-[#dfe2ec]/50"
                    action={
                        <div className="bg-gray-100/50 p-1 rounded-xl flex gap-1">
                            {[
                                { value: 'all', label: 'Semua' },
                                { value: 'unread', label: 'Belum Dibaca' },
                                { value: 'equipment_alert', label: 'Peralatan' },
                            ].map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilter(f.value)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                                        filter === f.value
                                            ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    }
                />
                <ModernCardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-gray-50 p-6 rounded-full mb-4">
                                <Inbox className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Tidak ada notifikasi</h3>
                            <p className="text-gray-500 mt-1 max-w-[300px]">
                                {filter === 'unread'
                                    ? "Semua notifikasi telah dibaca. Kerja bagus!"
                                    : "Belum ada notifikasi yang masuk untuk saat ini."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                                <div key={notification.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                                    <NotificationItem
                                        notification={notification}
                                        onMarkAsRead={(id) => markReadMutation.mutate(id)}
                                        onDelete={(id) => deleteMutation.mutate(id)}
                                        isMarkingRead={markReadMutation.isPending}
                                        isDeleting={deleteMutation.isPending}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </ModernCardContent>
            </ModernCard>
        </div>
    );
}
