'use client';

import { useState, useEffect } from 'react';
import {
    AlertTriangle, Wrench, Calendar, Package,
    ChevronRight, Clock, AlertCircle
} from 'lucide-react';
import { ModernBadge } from '@/components/ui/modern-badge';
import { ModernCard, ModernCardContent, ModernCardHeader } from '@/components/ui/modern-card';
import { cn } from '@/lib/utils';

interface Alert {
    id: string;
    type: 'low_stock' | 'poor_condition' | 'calibration_due' | 'maintenance_due' | 'overdue';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    equipment_id?: string;
    equipment_name?: string;
    due_date?: string;
}

const alertIcons = {
    low_stock: Package,
    poor_condition: AlertTriangle,
    calibration_due: Calendar,
    maintenance_due: Wrench,
    overdue: Clock,
};

const alertColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
};

const severityLabels = {
    info: 'Info',
    warning: 'Peringatan',
    critical: 'Kritis',
};

export function EquipmentAlerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/alerts');
            if (response.ok) {
                const data = await response.json();
                setAlerts(data.alerts || []);
            } else {
                // Fallback to mock data for demo
                setAlerts([
                    {
                        id: '1',
                        type: 'poor_condition',
                        severity: 'warning',
                        title: 'Kondisi Peralatan Buruk',
                        message: 'Oscilloscope perlu diperiksa',
                        equipment_name: 'Oscilloscope Digital',
                    },
                    {
                        id: '2',
                        type: 'calibration_due',
                        severity: 'warning',
                        title: 'Kalibrasi Mendekati Jatuh Tempo',
                        message: 'Multimeter perlu dikalibrasi dalam 7 hari',
                        equipment_name: 'Multimeter Fluke',
                        due_date: '2025-12-20',
                    },
                    {
                        id: '3',
                        type: 'overdue',
                        severity: 'critical',
                        title: 'Peminjaman Terlambat',
                        message: 'Peralatan belum dikembalikan',
                        equipment_name: 'Spektrofotometer',
                    },
                ]);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ModernCard>
                <ModernCardHeader>
                    <div className="flex items-center gap-2 text-xl font-bold">
                        <AlertCircle className="h-5 w-5" />
                        Peringatan Peralatan
                    </div>
                </ModernCardHeader>
                <ModernCardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                </ModernCardContent>
            </ModernCard>
        );
    }

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;

    return (
        <ModernCard>
            <ModernCardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xl font-bold">
                            <AlertCircle className="h-5 w-5" />
                            Peringatan Peralatan
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                            {alerts.length} peringatan aktif
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {criticalCount > 0 && (
                            <ModernBadge variant="destructive">{criticalCount} Kritis</ModernBadge>
                        )}
                        {warningCount > 0 && (
                            <ModernBadge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-none">{warningCount} Peringatan</ModernBadge>
                        )}
                    </div>
                </div>
            </ModernCardHeader>
            <ModernCardContent>
                {alerts.length === 0 ? (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                            <Package className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-gray-500">Tidak ada peringatan saat ini</p>
                        <p className="text-sm text-gray-400">Semua peralatan dalam kondisi baik</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.slice(0, 5).map(alert => {
                            const Icon = alertIcons[alert.type];
                            return (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        'flex items-start gap-3 p-3 rounded-lg border',
                                        alertColors[alert.severity]
                                    )}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{alert.title}</span>
                                            <ModernBadge variant="outline" className="text-xs">
                                                {severityLabels[alert.severity]}
                                            </ModernBadge>
                                        </div>
                                        <p className="text-sm opacity-80 mt-0.5">{alert.message}</p>
                                        {alert.equipment_name && (
                                            <p className="text-sm font-medium mt-1">{alert.equipment_name}</p>
                                        )}
                                        {alert.due_date && (
                                            <p className="text-xs opacity-60 mt-1">
                                                Jatuh tempo: {new Date(alert.due_date).toLocaleDateString('id-ID')}
                                            </p>
                                        )}
                                    </div>
                                    <button className="flex-shrink-0 p-1 hover:bg-black/5 rounded">
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}

                        {alerts.length > 5 && (
                            <a
                                href="/dashboard/alerts"
                                className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
                            >
                                Lihat semua {alerts.length} peringatan
                            </a>
                        )}
                    </div>
                )}

            </ModernCardContent>
        </ModernCard >
    );
}
