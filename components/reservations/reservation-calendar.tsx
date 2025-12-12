'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, ChevronLeft, ChevronRight, Plus, Clock,
    User, Package, X, Check, AlertCircle
} from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernBadge } from '@/components/ui/modern-badge';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Reservation {
    id: string;
    equipment_id: string;
    user_id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
    equipment?: {
        name: string;
        serial_number: string;
    };
    user?: {
        full_name: string;
        email: string;
    };
}

interface ReservationCalendarProps {
    equipmentId?: string;
    onSelectSlot?: (date: Date) => void;
    editable?: boolean;
}

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
    completed: 'bg-blue-100 text-blue-800 border-blue-300',
};

const statusLabels = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    cancelled: 'Dibatalkan',
    completed: 'Selesai',
};

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function ReservationCalendar({ equipmentId, onSelectSlot, editable = false }: ReservationCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            let url = `/api/reservations?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`;
            if (equipmentId) {
                url += `&equipment_id=${equipmentId}`;
            }

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setReservations(data.reservations || []);
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [currentDate, equipmentId]);

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Add empty slots for days before the first of the month
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const getReservationsForDate = (date: Date) => {
        return reservations.filter(r => {
            const start = new Date(r.start_time);
            const end = new Date(r.end_time);
            return date >= new Date(start.setHours(0, 0, 0, 0)) &&
                date <= new Date(end.setHours(23, 59, 59, 999));
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const days = getDaysInMonth();

    return (
        <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ModernButton variant="outline" size="sm" onClick={previousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </ModernButton>
                    <ModernButton variant="outline" size="sm" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </ModernButton>
                    <h2 className="text-xl font-semibold ml-2">
                        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <ModernButton variant="outline" size="sm" onClick={goToToday}>
                        Hari Ini
                    </ModernButton>
                    {editable && (
                        <ModernButton size="sm" onClick={() => onSelectSlot?.(new Date())}>
                            <Plus className="h-4 w-4 mr-2" />
                            Reservasi Baru
                        </ModernButton>
                    )}
                </div>
            </div>

            {/* Calendar Grid */}
            <ModernCard>
                <ModernCardContent className="p-0">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 border-b">
                        {DAYS.map(day => (
                            <div
                                key={day}
                                className="p-3 text-center text-sm font-medium text-gray-500 border-r last:border-r-0"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7">
                        {days.map((date, index) => {
                            const dayReservations = date ? getReservationsForDate(date) : [];
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        'min-h-[120px] p-2 border-r border-b last:border-r-0',
                                        !date && 'bg-gray-50',
                                        date && isToday(date) && 'bg-blue-50'
                                    )}
                                    onClick={() => date && editable && onSelectSlot?.(date)}
                                >
                                    {date && (
                                        <>
                                            <div className={cn(
                                                'text-sm font-medium mb-1',
                                                isToday(date) ? 'text-blue-600' : 'text-gray-700'
                                            )}>
                                                {date.getDate()}
                                            </div>
                                            <div className="space-y-1">
                                                {dayReservations.slice(0, 3).map(reservation => (
                                                    <button
                                                        key={reservation.id}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setSelectedReservation(reservation);
                                                        }}
                                                        className={cn(
                                                            'w-full text-left text-xs p-1 rounded border truncate',
                                                            statusColors[reservation.status]
                                                        )}
                                                    >
                                                        {formatTime(reservation.start_time)} - {reservation.equipment?.name || reservation.title}
                                                    </button>
                                                ))}
                                                {dayReservations.length > 3 && (
                                                    <div className="text-xs text-gray-500 text-center">
                                                        +{dayReservations.length - 3} lainnya
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ModernCardContent>
            </ModernCard>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-gray-500">Keterangan:</span>
                {Object.entries(statusLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-1">
                        <div className={cn('w-3 h-3 rounded', statusColors[key as keyof typeof statusColors].split(' ')[0])} />
                        <span>{label}</span>
                    </div>
                ))}
            </div>

            {/* Reservation Detail Dialog */}
            <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detail Reservasi</DialogTitle>
                    </DialogHeader>
                    {selectedReservation && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <ModernBadge className={statusColors[selectedReservation.status]}>
                                    {statusLabels[selectedReservation.status]}
                                </ModernBadge>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="font-medium">{selectedReservation.equipment?.name || selectedReservation.title}</p>
                                        {selectedReservation.equipment?.serial_number && (
                                            <p className="text-sm text-gray-500">SN: {selectedReservation.equipment.serial_number}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="font-medium">{selectedReservation.user?.full_name}</p>
                                        <p className="text-sm text-gray-500">{selectedReservation.user?.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="font-medium">
                                            {new Date(selectedReservation.start_time).toLocaleDateString('id-ID', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatTime(selectedReservation.start_time)} - {formatTime(selectedReservation.end_time)}
                                        </p>
                                    </div>
                                </div>

                                {selectedReservation.description && (
                                    <div className="pt-2 border-t">
                                        <p className="text-sm text-gray-500">{selectedReservation.description}</p>
                                    </div>
                                )}
                            </div>

                            {editable && selectedReservation.status === 'pending' && (
                                <div className="flex gap-2 pt-4">
                                    <ModernButton variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                                        <X className="h-4 w-4 mr-2" />
                                        Tolak
                                    </ModernButton>
                                    <ModernButton className="flex-1">
                                        <Check className="h-4 w-4 mr-2" />
                                        Setujui
                                    </ModernButton>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
