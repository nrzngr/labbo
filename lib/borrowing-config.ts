// Borrowing system configuration

// Role-based limits for different user types
export const ROLE_LIMITS = {
    mahasiswa: {
        maxItems: 3,
        maxDays: 14,
        maxExtensions: 1
    },
    dosen: {
        maxItems: 7,
        maxDays: 30,
        maxExtensions: 3
    },
    lab_staff: {
        maxItems: 5,
        maxDays: 21,
        maxExtensions: 2
    },
    admin: {
        maxItems: 10,
        maxDays: 60,
        maxExtensions: 5
    }
} as const

export type UserRole = keyof typeof ROLE_LIMITS

// Get limits for a specific role
export function getLimitsForRole(role: string) {
    return ROLE_LIMITS[role as UserRole] || ROLE_LIMITS.mahasiswa
}

export const BORROWING_CONFIG = {
    // Default limits (for backwards compatibility)
    MAX_ITEMS_PER_USER: 3,
    MAX_BORROW_DAYS: 14,
    MIN_BORROW_DAYS: 1,

    // Penalties
    PENALTY_RATE_PER_DAY: 5000, // Rp 5.000 per day
    PENALTY_CURRENCY: 'Rp',

    // Extension (default for mahasiswa)
    MAX_EXTENSION_DAYS: 7,
    MAX_EXTENSIONS_PER_BORROW: 1,

    // Notifications
    REMINDER_DAYS_BEFORE_DUE: 1,

    // Status labels (Indonesian)
    STATUS_LABELS: {
        pending: 'Menunggu Persetujuan',
        active: 'Aktif',
        returned: 'Dikembalikan',
        overdue: 'Terlambat',
        rejected: 'Ditolak',
        cancelled: 'Dibatalkan'
    },

    CONDITION_LABELS: {
        excellent: 'Sangat Baik',
        good: 'Baik',
        fair: 'Cukup',
        poor: 'Rusak',
        damaged: 'Rusak Berat'
    },

    EXTENSION_STATUS_LABELS: {
        pending: 'Menunggu',
        approved: 'Disetujui',
        rejected: 'Ditolak'
    }
}

// Helper functions
export function calculatePenalty(expectedDate: Date, actualDate: Date): number {
    const diffTime = actualDate.getTime() - expectedDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return 0

    return diffDays * BORROWING_CONFIG.PENALTY_RATE_PER_DAY
}

export function formatPenalty(amount: number): string {
    return `${BORROWING_CONFIG.PENALTY_CURRENCY} ${amount.toLocaleString('id-ID')}`
}

export function getOverdueDays(expectedDate: Date, actualDate?: Date): number {
    const compareDate = actualDate || new Date()
    const diffTime = compareDate.getTime() - new Date(expectedDate).getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays)
}

export function canRequestExtension(
    currentExtensions: number,
    isOverdue: boolean,
    status: string
): boolean {
    if (status !== 'active') return false
    if (isOverdue) return false
    if (currentExtensions >= BORROWING_CONFIG.MAX_EXTENSIONS_PER_BORROW) return false
    return true
}

export function getMaxBorrowDate(): Date {
    const date = new Date()
    date.setDate(date.getDate() + BORROWING_CONFIG.MAX_BORROW_DAYS)
    return date
}

export function getMinBorrowDate(): Date {
    const date = new Date()
    date.setDate(date.getDate() + BORROWING_CONFIG.MIN_BORROW_DAYS)
    return date
}
