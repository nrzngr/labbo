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
import { generateExcel, generatePDF, ExportColumn } from '@/lib/export-generator';
import { toast } from 'sonner';

interface ExportDropdownProps {
    data: any[];
    columns: ExportColumn[];
    filename: string;
    title: string;
    disabled?: boolean;
    className?: string;
}

export function ExportDropdown({
    data,
    columns,
    filename,
    title,
    disabled = false,
    className
}: ExportDropdownProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (type: 'excel' | 'pdf') => {
        if (!data.length) {
            toast.error('Tidak ada data untuk diekspor');
            return;
        }

        setIsExporting(true);
        try {
            if (type === 'excel') {
                generateExcel({ filename, title, columns, data });
                toast.success('Berhasil mengekspor ke Excel');
            } else {
                await generatePDF({ filename, title, columns, data });
                toast.success('Berhasil mengekspor ke PDF');
            }
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Gagal mengekspor data');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <ModernButton
                    variant="outline"
                    disabled={disabled || isExporting}
                    className={className}
                    leftIcon={isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                >
                    {isExporting ? 'Mengekspor...' : 'Ekspor'}
                </ModernButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => handleExport('excel')} disabled={isExporting}>
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    <span>Excel Workbook (.xlsx)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isExporting}>
                    <FileText className="h-4 w-4 mr-2 text-pink-600" />
                    <span>PDF Document (.pdf)</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
