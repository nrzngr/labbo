'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Package, FileText, Loader2 } from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ModernCard, ModernCardContent, ModernCardHeader } from '@/components/ui/modern-card';

interface Equipment {
    id: string;
    name: string;
    serial_number: string;
    status: string;
}

interface ReservationFormProps {
    equipmentId?: string;
    selectedDate?: Date;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function ReservationForm({
    equipmentId: initialEquipmentId,
    selectedDate,
    onSuccess,
    onCancel
}: ReservationFormProps) {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        equipment_id: initialEquipmentId || '',
        title: '',
        description: '',
        start_date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
        start_time: '08:00',
        end_date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
        end_time: '17:00',
    });

    useEffect(() => {
        fetchEquipment();
    }, []);

    const fetchEquipment = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/equipment?status=available');
            if (response.ok) {
                const data = await response.json();
                setEquipment(data.equipment || []);
            }
        } catch (err) {
            console.error('Error fetching equipment:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            // Combine date and time
            const start_time = new Date(`${formData.start_date}T${formData.start_time}`).toISOString();
            const end_time = new Date(`${formData.end_date}T${formData.end_time}`).toISOString();

            // Validate times
            if (new Date(start_time) >= new Date(end_time)) {
                throw new Error('Waktu selesai harus setelah waktu mulai');
            }

            if (new Date(start_time) < new Date()) {
                throw new Error('Tidak dapat membuat reservasi untuk waktu yang sudah lewat');
            }

            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    equipment_id: formData.equipment_id,
                    title: formData.title,
                    description: formData.description,
                    start_time,
                    end_time,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Gagal membuat reservasi');
            }

            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat reservasi');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModernCard>
            <ModernCardHeader>
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <h3 className="font-semibold leading-none tracking-tight">Buat Reservasi Baru</h3>
                </div>
            </ModernCardHeader>
            <ModernCardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Equipment Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="equipment">Peralatan *</Label>
                        <div className="relative">
                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                                id="equipment"
                                value={formData.equipment_id}
                                onChange={e => setFormData({ ...formData, equipment_id: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={!!initialEquipmentId}
                            >
                                <option value="">Pilih peralatan...</option>
                                {equipment.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.serial_number})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Judul/Keperluan *</Label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Contoh: Praktikum Fisika Dasar"
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mulai *</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Selesai *</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="time"
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi (Opsional)</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Tambahkan catatan atau deskripsi tambahan..."
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        {onCancel && (
                            <ModernButton type="button" variant="outline" onClick={onCancel} className="flex-1">
                                Batal
                            </ModernButton>
                        )}
                        <ModernButton type="submit" disabled={submitting} loading={submitting} className="flex-1">
                            {!submitting && (
                                <>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Buat Reservasi
                                </>
                            )}
                        </ModernButton>
                    </div>
                </form>
            </ModernCardContent>
        </ModernCard>
    );
}
