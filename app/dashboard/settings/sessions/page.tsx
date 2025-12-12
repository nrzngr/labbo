"use client";

import { useState, useEffect } from 'react';
import {
    Monitor, Smartphone, Globe, Clock, MapPin,
    LogOut, Shield, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/dashboard-layout';
;

;

interface Session {
    id: string;
    session_token: string;
    device_type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
    ip_address: string;
    location: string | null;
    created_at: string;
    last_accessed: string;
    is_current: boolean;
}

export default function SessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [terminating, setTerminating] = useState<string | null>(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/sessions');
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions || []);
            } else {
                // Mock data for demo
                setSessions([
                    {
                        id: '1',
                        session_token: 'current',
                        device_type: 'desktop',
                        browser: 'Chrome 120',
                        os: 'Windows 11',
                        ip_address: '192.168.1.100',
                        location: 'Jakarta, Indonesia',
                        created_at: new Date().toISOString(),
                        last_accessed: new Date().toISOString(),
                        is_current: true,
                    },
                    {
                        id: '2',
                        session_token: 'other1',
                        device_type: 'mobile',
                        browser: 'Safari 17',
                        os: 'iOS 17',
                        ip_address: '192.168.1.101',
                        location: 'Jakarta, Indonesia',
                        created_at: new Date(Date.now() - 86400000).toISOString(),
                        last_accessed: new Date(Date.now() - 3600000).toISOString(),
                        is_current: false,
                    },
                ]);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const terminateSession = async (sessionId: string) => {
        setTerminating(sessionId);
        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
            }
        } catch (error) {
            console.error('Error terminating session:', error);
        } finally {
            setTerminating(null);
        }
    };

    const terminateAllOthers = async () => {
        if (!confirm('Apakah Anda yakin ingin mengakhiri semua sesi lain?')) return;

        try {
            const response = await fetch('/api/sessions/terminate-all', {
                method: 'POST',
            });

            if (response.ok) {
                setSessions(prev => prev.filter(s => s.is_current));
            }
        } catch (error) {
            console.error('Error terminating sessions:', error);
        }
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'mobile':
                return Smartphone;
            case 'tablet':
                return Monitor;
            default:
                return Monitor;
        }
    };

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

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        return `${diffDays} hari lalu`;
    };

    const otherSessions = sessions.filter(s => !s.is_current);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sesi Aktif</h1>
                        <p className="text-gray-500 mt-1">
                            Kelola perangkat dan sesi yang terhubung ke akun Anda
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchSessions}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Segarkan
                        </Button>
                        {otherSessions.length > 0 && (
                            <Button variant="destructive" onClick={terminateAllOthers}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Akhiri Semua Sesi Lain
                            </Button>
                        )}
                    </div>
                </div>

                {/* Security Notice */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-blue-900">Tips Keamanan</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    Jika Anda melihat sesi yang tidak dikenali, segera akhiri sesi tersebut
                                    dan ganti password Anda untuk melindungi akun.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Current Session */}
                <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">Sesi Saat Ini</CardTitle>
                            <Badge className="bg-green-500">Aktif</Badge>
                        </div>
                        <CardDescription>
                            Perangkat yang sedang Anda gunakan sekarang
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                            </div>
                        ) : (
                            sessions
                                .filter(s => s.is_current)
                                .map(session => {
                                    const DeviceIcon = getDeviceIcon(session.device_type);
                                    return (
                                        <div key={session.id} className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-green-100">
                                                <DeviceIcon className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">
                                                    {session.browser} di {session.os}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Globe className="h-3.5 w-3.5" />
                                                        {session.ip_address}
                                                    </span>
                                                    {session.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {session.location}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        Login: {formatDate(session.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </CardContent>
                </Card>

                {/* Other Sessions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Sesi Lainnya</CardTitle>
                        <CardDescription>
                            Perangkat lain yang terhubung ke akun Anda
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                        ) : otherSessions.length === 0 ? (
                            <div className="text-center py-8">
                                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Tidak ada sesi lain yang aktif</p>
                                <p className="text-sm text-gray-400">
                                    Akun Anda hanya terhubung ke perangkat ini
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {otherSessions.map(session => {
                                    const DeviceIcon = getDeviceIcon(session.device_type);
                                    return (
                                        <div
                                            key={session.id}
                                            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="p-3 rounded-lg bg-gray-100">
                                                <DeviceIcon className="h-6 w-6 text-gray-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900">
                                                    {session.browser} di {session.os}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Globe className="h-3.5 w-3.5" />
                                                        {session.ip_address}
                                                    </span>
                                                    {session.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {session.location}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        Aktif {getTimeAgo(session.last_accessed)}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => terminateSession(session.id)}
                                                disabled={terminating === session.id}
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                {terminating === session.id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                ) : (
                                                    <>
                                                        <LogOut className="h-4 w-4 mr-1" />
                                                        Akhiri
                                                    </>
                                                )}
                                            </Button>
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
