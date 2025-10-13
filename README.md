# Sistem Manajemen Inventaris Peralatan Laboratorium

Sistem manajemen inventaris peralatan laboratorium yang komprehensif, dibangun dengan Next.js, TypeScript, Supabase, dan komponen shadcn/ui. Sistem ini mengotomatisasi pelacakan peralatan, proses peminjaman/pengembalian, dan pelaporan untuk institusi pendidikan.

## Fitur

- **Manajemen Peralatan**: Operasi CRUD lengkap untuk peralatan laboratorium
- **Manajemen Pengguna**: Kontrol akses berbasis peran (admin, staf lab, dosen, mahasiswa)
- **Sistem Peminjaman**: Permintaan peminjaman peralatan dengan alur kerja persetujuan
- **Dashboard Real-time**: Statistik dan aktivitas terkini
- **Desain Responsif**: Berfungsi di desktop dan perangkat mobile
- **UI Modern**: Dibangun dengan komponen shadcn/ui dan Tailwind CSS

## Teknologi yang Digunakan

- **Frontend**: Next.js 14 dengan App Router
- **Komponen UI**: shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Autentikasi**: Supabase Auth
- **Styling**: Tailwind CSS
- **Penanganan Form**: React Hook Form dengan validasi Zod
- **Manajemen State**: Zustand
- **Pengambilan Data**: TanStack Query (React Query)

## Memulai

### Persyaratan

- Node.js 18+ terinstal
- Akun dan proyek Supabase

### Instalasi

1. **Salin repositori**
   ```bash
   git clone <repository-url>
   cd lab-inventory-system
   ```

2. **Instal dependensi**
   ```bash
   npm install
   ```

3. **Siapkan Supabase**

   a. Buat proyek Supabase baru di [supabase.com](https://supabase.com)

   b. Jalankan skema database:
   ```sql
   -- Salin dan eksekusi isi dari database/schema.sql di editor SQL Supabase Anda
   ```

   c. Dapatkan URL Supabase dan anon key dari dashboard Supabase

4. **Variabel lingkungan**

   Buat file `.env.local` di direktori root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=url_supabase_anda
   NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_key_supabase_anda
   DATABASE_URL=url_database_anda
   ```

5. **Jalankan server development**
   ```bash
   npm run dev
   ```

6. **Buka browser Anda**

   Buka [http://localhost:3000](http://localhost:3000)

## Skema Database

Sistem menggunakan tabel utama berikut:

- `categories` - Kategori peralatan
- `equipment` - Item peralatan laboratorium
- `user_profiles` - Informasi dan peran pengguna
- `borrowing_transactions` - Catatan peminjaman peralatan
- `maintenance_records` - Log pemeliharaan peralatan

Lihat `database/schema.sql` untuk definisi skema lengkap.

## Peran Pengguna

- **Admin**: Akses penuh ke semua fitur dan manajemen pengguna
- **Staf Lab**: Dapat mengelola peralatan dan menyetujui permintaan peminjaman
- **Dosen**: Dapat meminjam peralatan dan melihat laporan
- **Mahasiswa**: Dapat meminjam peralatan dan melihat item yang tersedia

## Penggunaan

### Untuk Admin

1. Daftarkan akun dengan peran admin
2. Siapkan kategori peralatan
3. Tambahkan peralatan laboratorium
4. Kelola akun pengguna
5. Pantau aktivitas peminjaman

### Untuk Staf Lab

1. Daftarkan akun dengan peran lab_staff
2. Tambahkan dan kelola peralatan
3. Setujui permintaan peminjaman
4. Lacak pemeliharaan peralatan

### Untuk Mahasiswa dan Dosen

1. Daftarkan akun dengan peran yang sesuai
2. Jelajahi peralatan yang tersedia
3. Ajukan permintaan peminjaman
4. Kembalikan peralatan tepat waktu

## Struktur Proyek

```
lab-inventory-system/
├── app/
│   ├── (auth)/           # Halaman autentikasi
│   ├── (dashboard)/      # Halaman dashboard
│   ├── api/             # Rute API
│   ├── components/      # Komponen yang dapat digunakan kembali
│   ├── lib/             # Utilitas dan konfigurasi
│   └── globals.css      # Gaya global
├── components/
│   ├── ui/              # Komponen shadcn/ui
│   ├── auth/            # Komponen autentikasi
│   ├── equipment/       # Komponen manajemen peralatan
│   └── ...              # Komponen fitur lainnya
├── database/
│   └── schema.sql       # Skema database
└── public/              # Aset statis
```

## Status Saat Ini

✅ **Fitur Selesai:**
- Setup proyek Next.js dengan TypeScript
- Konfigurasi Supabase dan skema database
- Sistem autentikasi dengan kontrol akses berbasis peran
- Operasi CRUD manajemen peralatan
- Integrasi komponen shadcn/ui
- Fondasi desain responsif

🚧 **Dalam Pengerjaan:**
- Sistem transaksi peminjaman
- Dashboard canggih dengan statistik
- Antarmuka manajemen pengguna
- Fungsionalitas pelaporan

## Berkontribusi

1. Fork repositori
2. Buat cabang fitur
3. Lakukan perubahan Anda
4. Uji secara menyeluruh
5. Ajukan pull request

## Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT.

## Dukungan

Untuk dukungan dan pertanyaan, buka isu di repositori.

---

**Catatan**: Ini adalah sistem manajemen inventaris laboratorium yang komprehensif. Pastikan untuk mengkonfigurasi Supabase dengan benar dan menjalankan skema database sebelum menggunakan aplikasi.
