'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Calendar, Wrench, Shield, Settings, Save } from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernCard, ModernCardContent, ModernCardHeader } from '@/components/ui/modern-card';

interface NotificationPreference {
    type: string;
    email: boolean;
    push: boolean;
    in_app: boolean;
}

const notificationTypes = [
    {
        type: 'due_date_reminder',
        label: 'Pengingat Jatuh Tempo',
        description: 'Notifikasi saat peralatan hampir jatuh tempo pengembalian',
        icon: Calendar,
    },
    {
        type: 'approval_required',
        label: 'Persetujuan Diperlukan',
        description: 'Notifikasi saat ada permintaan yang memerlukan persetujuan Anda',
        icon: Bell,
    },
    {
        type: 'equipment_alert',
        label: 'Peringatan Peralatan',
        description: 'Notifikasi tentang kondisi atau status peralatan',
        icon: Wrench,
    },
    {
        type: 'system_maintenance',
        label: 'Pemeliharaan Sistem',
        description: 'Notifikasi tentang jadwal pemeliharaan dan pembaruan sistem',
        icon: Settings,
    },
    {
        type: 'safety_compliance',
        label: 'Kepatuhan Keselamatan',
        description: 'Notifikasi tentang kalibrasi dan pemeriksaan keselamatan peralatan',
        icon: Shield,
    },
];

export function NotificationPreferences() {
    const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await fetch('/api/notification-preferences');
            if (response.ok) {
                const data = await response.json();
                if (data.preferences && data.preferences.length > 0) {
                    setPreferences(data.preferences);
                } else {
                    // Set default preferences
                    setPreferences(
                        notificationTypes.map(nt => ({
                            type: nt.type,
                            email: true,
                            push: true,
                            in_app: true,
                        }))
                    );
                }
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
            // Set default preferences on error
            setPreferences(
                notificationTypes.map(nt => ({
                    type: nt.type,
                    email: true,
                    push: true,
                    in_app: true,
                }))
            );
        } finally {
            setLoading(false);
        }
    };

    const updatePreference = (type: string, channel: 'email' | 'push' | 'in_app', value: boolean) => {
        setPreferences(prev =>
            prev.map(p => (p.type === type ? { ...p, [channel]: value } : p))
        );
        setSaved(false);
    };

    const savePreferences = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/notification-preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences }),
            });
            if (response.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <ModernCard>
            <ModernCardHeader>
                <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
                    <Bell className="h-5 w-5" />
                    Preferensi Notifikasi
                </div>
                <p className="text-sm text-gray-600 font-medium">
                    Atur bagaimana Anda ingin menerima notifikasi untuk setiap jenis aktivitas
                </p>
            </ModernCardHeader>
            <ModernCardContent>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 pb-2 border-b border-gray-200">
                        <div className="col-span-6 font-medium text-gray-700">Jenis Notifikasi</div>
                        <div className="col-span-2 text-center font-medium text-gray-700">
                            <Mail className="h-4 w-4 mx-auto mb-1" />
                            <span className="text-xs">Email</span>
                        </div>
                        <div className="col-span-2 text-center font-medium text-gray-700">
                            <Bell className="h-4 w-4 mx-auto mb-1" />
                            <span className="text-xs">Push</span>
                        </div>
                        <div className="col-span-2 text-center font-medium text-gray-700">
                            <Settings className="h-4 w-4 mx-auto mb-1" />
                            <span className="text-xs">Aplikasi</span>
                        </div>
                    </div>

                    {/* Preference Rows */}
                    {notificationTypes.map(nt => {
                        const pref = preferences.find(p => p.type === nt.type) || {
                            type: nt.type,
                            email: true,
                            push: true,
                            in_app: true,
                        };
                        const Icon = nt.icon;

                        return (
                            <div key={nt.type} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                                <div className="col-span-6">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <Icon className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{nt.label}</p>
                                            <p className="text-sm text-gray-500">{nt.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={pref.email}
                                        onChange={e => updatePreference(nt.type, 'email', e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="col-span-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={pref.push}
                                        onChange={e => updatePreference(nt.type, 'push', e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="col-span-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={pref.in_app}
                                        onChange={e => updatePreference(nt.type, 'in_app', e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {/* Save Button */}
                    <div className="flex items-center justify-end gap-4 pt-4">
                        {saved && (
                            <span className="text-sm text-green-600">Preferensi berhasil disimpan!</span>
                        )}
                        <ModernButton onClick={savePreferences} disabled={saving} loading={saving}>
                            {saving ? (
                                'Menyimpan...'
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Simpan Preferensi
                                </>
                            )}
                        </ModernButton>
                    </div>
                </div>
            </ModernCardContent>
        </ModernCard>
    );
}
