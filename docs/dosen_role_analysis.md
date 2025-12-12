# Analisis Role Dosen - Lab Inventory System

## 🔍 Temuan Saat Ini

### Status Quo
Saat ini, **Dosen** dan **Mahasiswa** memiliki akses yang **identik** ke sistem:

**Menu yang Tersedia:**
- ✅ Dashboard
- ✅ Katalog Peralatan
- ✅ Peminjaman Saya
- ✅ Notifikasi
- ✅ Profil Saya

### ⚠️ Masalah Identifikasi

**Ini tidak sesuai dengan hierarki universitas Indonesia:**
1. Dosen memiliki otoritas lebih tinggi daripada Mahasiswa
2. Dosen bertanggung jawab atas mahasiswa dan penelitian
3. Dosen memerlukan akses monitoring untuk keperluan akademik
4. Dosen sering membutuhkan prioritas dan fleksibilitas lebih dalam penggunaan peralatan

---

## 💡 Usulan Peningkatan Role Dosen

### 1. **Dashboard yang Lebih Kaya**
Dosen perlu melihat:
- **Statistik Departemen**: Total peminjaman oleh mahasiswa di departemennya
- **Equipment Availability**: Real-time status peralatan yang sering digunakan
- **Pending Approvals**: Jika sistem implementasi approval berlapis (opsional)
- **Research Equipment Usage**: Track penggunaan alat untuk penelitian

### 2. **Borrowing Privileges yang Lebih Tinggi**
| **Fitur** | Mahasiswa | Dosen |
|-----------|-----------|-------|
| Max Items | 3 | **5-7** |
| Durasi Default | 7 hari | **14-30 hari** |
| Priority Booking | ❌ | ✅ |
| Extend Limit | 1x | **2-3x** |

### 3. **Akses Monitoring (READ-ONLY)**
Dosen perlu dapat:
- **Melihat Transaksi Mahasiswa**: Filter berdasarkan NIM/Nama untuk monitoring bimbingan
- **Laporan Penggunaan Peralatan**: Export data untuk keperluan penelitian
- **Equipment History**: Riwayat peralatan yang pernah dipinjam (untuk riset)

### 4. **Fitur Rekomendasi/Endorsement**
- Dosen dapat memberikan **rekomendasi** untuk peminjaman mahasiswa yang membutuhkan approval khusus
- Sistem bisa mengirim notifikasi ke admin: "Direkomendasikan oleh: Dr. Ahmad"

### 5. **Akses Reservasi Prioritas**
- **Reservation System**: Dosen bisa booking peralatan untuk praktikum/penelitian di masa depan
- **Bulk Reservation**: Booking multiple items sekaligus untuk keperluan lab teaching

---

## 📋 Implementasi yang Diusulkan

### Phase 1: Enhanced Borrowing Limits (Quick Win)
**Database:**
```sql
-- Update borrowing_limits untuk dosen
UPDATE borrowing_limits 
SET max_items = 7, max_duration_days = 30 
WHERE role = 'dosen';
```

**Code Changes:**
- `lib/borrowing-config.ts`: Sesuaikan limit dosen
- `components/student/borrow-request-form.tsx`: Conditional UI berdasarkan role

### Phase 2: Dashboard Enhancements
**New Components:**
- `components/dosen/dosen-dashboard-stats.tsx`: Statistik untuk dosen
- `components/dosen/department-equipment-chart.tsx`: Grafik penggunaan departemen

### Phase 3: Monitoring Access (READ-ONLY)
**New Pages:**
- `/dashboard/monitoring/borrowings`: Laporan peminjaman (Dosen: view only, Admin: full access)
- `/dashboard/reports`: Export functionality

**Sidebar Updates:**
```tsx
{
  title: 'Monitoring Mahasiswa',
  href: '/dashboard/monitoring/borrowings',
  icon: Users,
  roles: ['dosen', 'admin', 'lab_staff'],
},
{
  title: 'Laporan & Statistik',
  href: '/dashboard/reports',
  icon: BarChart3,
  roles: ['dosen', 'admin', 'lab_staff'],
}
```

### Phase 4: Reservation System
**New Table:**
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  equipment_id UUID REFERENCES equipment(id),
  reserved_from TIMESTAMPTZ NOT NULL,
  reserved_until TIMESTAMPTZ NOT NULL,
  purpose TEXT,
  status reservation_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 Prioritas

### 🔥 High Priority (Implementasi Segera)
1. **Borrowing Limits**: Naikkan max items dan durasi untuk dosen
2. **Sidebar Menu**: Tambahkan "Monitoring Mahasiswa" (read-only view)
3. **Dashboard Stats**: Enhanced dashboard untuk dosen

### 🟡 Medium Priority (Minggu Depan)
4. **Reports & Export**: Kemampuan export data transaksi
5. **Equipment History View**: Lihat riwayat peralatan

### 🟢 Low Priority (Future Enhancement)
6. **Reservation System**: Booking peralatan untuk teaching/research
7. **Recommendation Feature**: Dosen bisa endorse peminjaman mahasiswa
8. **Department Analytics**: Deep-dive analytics per departemen

---

## 🚀 Quick Action Items

**Untuk SEGERA meningkatkan experience Dosen:**

1. **Update `components/layout/sidebar.tsx`**:
   - Tambah menu "Monitoring" khusus dosen
   - Tambah menu "Laporan" untuk export data

2. **Update `lib/borrowing-config.ts`**:
   ```ts
   export const ROLE_LIMITS = {
     mahasiswa: { maxItems: 3, maxDays: 7 },
     dosen: { maxItems: 7, maxDays: 30 }, // ⬅️ Enhanced
     lab_staff: { maxItems: 5, maxDays: 14 },
   }
   ```

3. **Create Simple Monitoring Page**:
   - Copy dari `app/dashboard/transactions/page.tsx`
   - Ubah jadi read-only
   - Filter hanya mahasiswa (untuk dosen)

---

## 🎓 Konteks Universitas Indonesia

**Kenapa ini penting:**
- Dosen adalah **pembimbing akademik** dan **peneliti**
- Mereka perlu **monitor** mahasiswa bimbingan mereka
- Equipment sering digunakan untuk **riset** yang memerlukan durasi lebih lama
- Dosen perlu **prioritas** untuk teaching dan research

**Benefit untuk Lab:**
- Transparansi penggunaan peralatan per departemen
- Dosen bisa tracking mahasiswa yang sering telat/bermasalah
- Meningkatkan kolaborasi penelitian dengan data usage yang jelas
