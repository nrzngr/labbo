"use client";

import { useState, useEffect } from 'react';
import {
    UserCheck, UserX, Clock, Search, Filter,
    Mail, Building2, GraduationCap, CheckCircle, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PendingUser {
    id: string;
    email: string;
    full_name: string;
    role: string;
    department: string;
    nim?: string;
    nip?: string;
    phone?: string;
    created_at: string;
    approval_status: 'pending' | 'approved' | 'rejected';
}

const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    lab_staff: 'Staf Lab',
    lecturer: 'Dosen',
    student: 'Mahasiswa',
};

export default function PendingUsersPage() {
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/users/pending');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching pending users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        setProcessing(true);
        try {
            const response = await fetch(`/api/users/${userId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' }),
            });

            if (response.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId));
            }
        } catch (error) {
            console.error('Error approving user:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedUser) return;

        setProcessing(true);
        try {
            const response = await fetch(`/api/users/${selectedUser.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', reason: rejectReason }),
            });

            if (response.ok) {
                setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
                setShowRejectDialog(false);
                setSelectedUser(null);
                setRejectReason('');
            }
        } catch (error) {
            console.error('Error rejecting user:', error);
        } finally {
            setProcessing(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
                    <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Persetujuan Pengguna</h1>
                    <p className="text-gray-500 mt-1">
                        Tinjau dan setujui pendaftaran pengguna baru
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-yellow-100">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{users.length}</p>
                                    <p className="text-sm text-gray-500">Menunggu Persetujuan</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-blue-100">
                                    <GraduationCap className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {users.filter(u => u.role === 'student').length}
                                    </p>
                                    <p className="text-sm text-gray-500">Mahasiswa</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-purple-100">
                                    <Building2 className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {users.filter(u => u.role === 'lecturer').length}
                                    </p>
                                    <p className="text-sm text-gray-500">Dosen</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="py-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari nama atau email..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Users List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Pendaftaran Baru</CardTitle>
                        <CardDescription>
                            {filteredUsers.length} pengguna menunggu persetujuan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-xl font-medium text-gray-900">Tidak Ada Permintaan</p>
                                <p className="text-gray-500 mt-1">
                                    Semua pendaftaran telah diproses
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                                                        {user.full_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                                                            <Badge variant="outline">{roleLabels[user.role]}</Badge>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="h-4 w-4" />
                                                                {user.email}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-4 w-4" />
                                                                {user.department}
                                                            </div>
                                                            {user.nim && (
                                                                <div className="flex items-center gap-2">
                                                                    <GraduationCap className="h-4 w-4" />
                                                                    NIM: {user.nim}
                                                                </div>
                                                            )}
                                                            {user.nip && (
                                                                <div className="flex items-center gap-2">
                                                                    <GraduationCap className="h-4 w-4" />
                                                                    NIP: {user.nip}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            Mendaftar: {formatDate(user.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowRejectDialog(true);
                                                    }}
                                                    disabled={processing}
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Tolak
                                                </Button>
                                                <Button
                                                    onClick={() => handleApprove(user.id)}
                                                    disabled={processing}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Setujui
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Reject Dialog */}
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tolak Pendaftaran</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Anda akan menolak pendaftaran <strong>{selectedUser?.full_name}</strong>.
                                Berikan alasan penolakan (opsional):
                            </p>
                            <Textarea
                                placeholder="Alasan penolakan..."
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                rows={3}
                            />
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowRejectDialog(false);
                                        setSelectedUser(null);
                                        setRejectReason('');
                                    }}
                                    className="flex-1"
                                >
                                    Batal
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={processing}
                                    className="flex-1"
                                >
                                    {processing ? 'Memproses...' : 'Tolak Pendaftaran'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            );
}
