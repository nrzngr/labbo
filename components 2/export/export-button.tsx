'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportButtonProps {
    endpoint: string;
    filename: string;
    filters?: Record<string, unknown>;
    disabled?: boolean;
    className?: string;
}

export function ExportButton({ endpoint, filename, filters = {}, disabled = false, className }: ExportButtonProps) {
    const [loading, setLoading] = useState(false);
    const [loadingFormat, setLoadingFormat] = useState<string | null>(null);

    const handleExport = async (format: 'xlsx' | 'csv') => {
        setLoading(true);
        setLoadingFormat(format);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format, filters }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Gagal mengekspor data');
            }

            // Get the blob from response
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            alert(error instanceof Error ? error.message : 'Gagal mengekspor data');
        } finally {
            setLoading(false);
            setLoadingFormat(null);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <ModernButton variant="outline" disabled={disabled || loading} className={className}>
                    {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Mengekspor...' : 'Ekspor'}
                </ModernButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled={loading}>
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    <span>Ekspor ke Excel (.xlsx)</span>
                    {loadingFormat === 'xlsx' && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')} disabled={loading}>
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    <span>Ekspor ke CSV (.csv)</span>
                    {loadingFormat === 'csv' && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
