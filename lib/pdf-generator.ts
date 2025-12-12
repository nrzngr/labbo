import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

interface BorrowingData {
    id: string
    borrowerName: string
    borrowerNim: string
    borrowerDepartment: string
    equipmentName: string
    serialNumber: string
    borrowDate: string
    expectedReturnDate: string
    purpose: string
    notes?: string
}

export const generateBorrowingLetter = (data: BorrowingData): void => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header - Kop Surat
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('LABORATORIUM TEKNIK', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Fakultas Teknik - Universitas', pageWidth / 2, 27, { align: 'center' })
    doc.text('Jl. Kampus No. 1, Kota', pageWidth / 2, 33, { align: 'center' })

    // Line separator
    doc.setLineWidth(0.5)
    doc.line(20, 38, pageWidth - 20, 38)
    doc.setLineWidth(0.2)
    doc.line(20, 39, pageWidth - 20, 39)

    // Title
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('SURAT PEMINJAMAN PERALATAN', pageWidth / 2, 50, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`No: SPP/${data.id.substring(0, 8).toUpperCase()}/${new Date().getFullYear()}`, pageWidth / 2, 57, { align: 'center' })

    // Body
    let yPos = 70

    doc.setFontSize(10)
    doc.text('Yang bertanda tangan di bawah ini:', 20, yPos)

    yPos += 10
    const borrowerInfo = [
        ['Nama', data.borrowerName],
        ['NIM', data.borrowerNim],
        ['Jurusan/Prodi', data.borrowerDepartment],
    ]

    borrowerInfo.forEach(([label, value]) => {
        doc.text(`${label}`, 25, yPos)
        doc.text(`: ${value}`, 65, yPos)
        yPos += 7
    })

    yPos += 5
    doc.text('Dengan ini menyatakan meminjam peralatan laboratorium sebagai berikut:', 20, yPos)

    yPos += 10
    const equipmentInfo = [
        ['Nama Peralatan', data.equipmentName],
        ['Nomor Seri', data.serialNumber],
        ['Tanggal Pinjam', formatDate(data.borrowDate)],
        ['Tanggal Kembali', formatDate(data.expectedReturnDate)],
        ['Tujuan', getPurposeLabel(data.purpose)],
    ]

    equipmentInfo.forEach(([label, value]) => {
        doc.text(`${label}`, 25, yPos)
        doc.text(`: ${value}`, 75, yPos)
        yPos += 7
    })

    if (data.notes) {
        yPos += 3
        doc.text('Catatan', 25, yPos)
        doc.text(`: ${data.notes}`, 75, yPos)
        yPos += 7
    }

    // Terms
    yPos += 10
    doc.setFont('helvetica', 'bold')
    doc.text('Ketentuan:', 20, yPos)
    doc.setFont('helvetica', 'normal')

    const terms = [
        'Peminjam bertanggung jawab penuh atas peralatan yang dipinjam.',
        'Peralatan harus dikembalikan dalam kondisi baik dan tepat waktu.',
        'Keterlambatan pengembalian dikenakan denda Rp 5.000/hari.',
        'Kerusakan atau kehilangan menjadi tanggung jawab peminjam.',
    ]

    yPos += 7
    terms.forEach((term, index) => {
        doc.text(`${index + 1}. ${term}`, 25, yPos)
        yPos += 6
    })

    // Signatures
    yPos += 15
    const signatureY = yPos

    // Left signature - Peminjam
    doc.text('Peminjam,', 40, signatureY, { align: 'center' })
    doc.text('(.............................)', 40, signatureY + 30, { align: 'center' })
    doc.text(data.borrowerName, 40, signatureY + 37, { align: 'center' })

    // Right signature - Petugas Lab
    doc.text('Petugas Laboratorium,', pageWidth - 50, signatureY, { align: 'center' })
    doc.text('(.............................)', pageWidth - 50, signatureY + 30, { align: 'center' })
    doc.text('_________________', pageWidth - 50, signatureY + 37, { align: 'center' })

    // Date
    const today = new Date()
    const formattedDate = formatDate(today.toISOString().split('T')[0])
    doc.text(`Kota, ${formattedDate}`, pageWidth - 20, yPos - 25, { align: 'right' })

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(128)
    doc.text('Dokumen ini digenerate secara otomatis oleh Sistem Inventaris Lab', pageWidth / 2, 285, { align: 'center' })

    // Save
    doc.save(`Surat_Peminjaman_${data.id.substring(0, 8)}.pdf`)
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

function getPurposeLabel(purpose: string): string {
    const labels: Record<string, string> = {
        praktikum: 'Praktikum',
        tugas_akhir: 'Tugas Akhir / Skripsi',
        penelitian: 'Penelitian',
        lainnya: 'Lainnya'
    }
    return labels[purpose] || purpose
}

export default generateBorrowingLetter
