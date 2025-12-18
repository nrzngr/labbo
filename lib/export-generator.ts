import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Labbo Brand Colors
const COLORS = {
    primary: '#ff007a', // Labbo Pink
    secondary: '#f0f3ff',
    text: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
};

export interface ExportColumn {
    header: string;
    key: string;
    // Optional formatter function
    formatter?: (value: any) => string;
}

interface ExportOptions {
    filename: string;
    title: string;
    columns: ExportColumn[];
    data: any[];
}

/**
 * loads an image from a URL and returns a base64 string
 */
const loadImage = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error('Failed to load logo', e);
        return '';
    }
};

/**
 * Generate and download an Excel file
 */
export const generateExcel = ({ filename, title, columns, data }: ExportOptions) => {
    // Map data to column headers
    const exportData = data.map((item) => {
        const row: Record<string, any> = {};
        columns.forEach((col) => {
            const val = item[col.key];
            row[col.header] = col.formatter ? col.formatter(val) : val;
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Basic styling isn't supported in free SheetJS CE (Community Edition)
    // But we can ensure column widths are decent if needed, or just let it be raw data.
    // For now, raw data is standard for Excel exports.

    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Generate and download a PDF file with Labbo branding
 */
export const generatePDF = async ({ filename, title, columns, data }: ExportOptions) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoData = await loadImage('/Logo.png');

    // --- Header Section ---

    // Add Logo if available
    if (logoData) {
        // approx 10x10 mm aspect ratio? Adjust based on actual logo
        // Assuming square-ish or wide logo. Let's make it 15mm high.
        try {
            doc.addImage(logoData, 'PNG', 14, 10, 15, 15);
        } catch (e) {
            // fallback if logo fails (wrong format etc)
        }
    }



    // Document Title (Right Aligned or Center below)
    doc.setFontSize(16);
    doc.setTextColor(COLORS.text);
    doc.text(title.toUpperCase(), pageWidth - 14, 20, { align: 'right' });

    // Date
    const dateStr = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.setFontSize(9);
    doc.setTextColor(COLORS.muted);
    doc.text(`Dicetak pada: ${dateStr}`, pageWidth - 14, 26, { align: 'right' });

    // Decorative Line
    doc.setLineWidth(0.5);
    doc.setDrawColor(COLORS.primary); // Pink Line
    doc.line(14, 32, pageWidth - 14, 32);

    // --- Table ---

    // Prepare table body
    const tableBody = data.map(item =>
        columns.map(col => {
            const val = item[col.key];
            return col.formatter ? col.formatter(val) : (val ?? '-');
        })
    );

    // Prepare table headers
    const tableHeaders = columns.map(col => col.header);

    // @ts-ignore - jspdf-autotable types might be slightly off in some envs
    // @ts-ignore - jspdf-autotable types might be slightly off in some envs
    autoTable(doc, {
        head: [tableHeaders],
        body: tableBody,
        startY: 38,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3,
            textColor: COLORS.text,
            lineColor: COLORS.border,
        },
        headStyles: {
            fillColor: COLORS.primary,
            textColor: '#ffffff',
            fontStyle: 'bold',
            halign: 'center',
        },
        alternateRowStyles: {
            fillColor: COLORS.secondary,
        },
        didDrawPage: (data: any) => {
            // Footer
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.setFontSize(8);
            doc.setTextColor(COLORS.muted);
            doc.text(
                `Halaman ${data.pageNumber} - Dokumen ini dibuat secara otomatis oleh Labbo`,
                data.settings.margin.left,
                pageHeight - 10
            );
        }
    });

    doc.save(`${filename}.pdf`);
};
