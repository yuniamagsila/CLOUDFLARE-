# Perincian Fitur Per Peran — Karyo OS

> Dokumen ini dihasilkan dari analisis kode sumber repositori secara langsung. Setiap fitur diverifikasi terhadap routing (`src/router/`), halaman (`src/pages/`), store (`src/stores/`), hook (`src/hooks/`), dan API (`src/api/`).

---

## Daftar Peran

| Kode Peran | Nama Lengkap | Prefix Route |
|------------|--------------|--------------|
| `admin` | Administrator Sistem | `/admin` |
| `komandan` | Komandan Satuan | `/komandan` |
| `prajurit` | Prajurit / Personel | `/prajurit` |
| `guard` | Petugas Penjaga Gerbang | `/guard` |

---

## 👑 ADMIN

Akses penuh ke seluruh sistem. Admin juga dapat mengakses semua route `komandan` dan `prajurit`.

### 1. Dashboard Pusat Kendali
- **Route:** `/admin/dashboard`
- **Halaman:** `AdminDashboard.tsx`
- Statistik real-time: total personel, personel online, jumlah tugas, rekap absensi hari ini, dan gate pass aktif
- Hitung overdue gate pass secara client-side (`waktu_kembali < now` pada baris berstatus `out`)
- Heat-map absensi 30 hari terakhir (seluruh satuan)
- Auto-refresh + langganan Supabase Realtime

### 2. Manajemen User / Personel
- **Route:** `/admin/users`
- **Halaman:** `AdminUsersPage.tsx`
- CRUD data personel (tambah, edit, aktifkan/nonaktifkan akun)
- Reset PIN individu
- Bulk reset PIN seluruh personel
- Import data personel via file CSV

### 3. Manajemen Logistik
- **Route:** `/admin/logistics`
- **Halaman:** `AdminLogisticsPage.tsx`
- Kelola inventaris item logistik (tambah, edit, hapus)
- Review permintaan logistik dari Komandan (approve / reject)
- Lihat riwayat seluruh permintaan logistik

### 4. Manajemen Pengumuman
- **Route:** `/admin/announcements`
- **Halaman:** `AdminAnnouncementsPage.tsx`
- Buat dan hapus pengumuman
- Pin / unpin pengumuman ke posisi teratas
- Target pengumuman per role dan per satuan

### 5. Rekap Absensi
- **Route:** `/admin/attendance`
- **Halaman:** `AdminAttendancePage.tsx`
- Laporan absensi seluruh personel lintas satuan
- Filter per tanggal
- Export rekap ke format CSV

### 6. Jadwal Shift
- **Route:** `/admin/schedule`
- **Halaman:** `AdminSchedulePage.tsx`
- Penjadwalan shift kerja personel
- Lihat dan kelola jadwal per periode

### 7. Dokumen
- **Route:** `/admin/documents`
- **Halaman:** `AdminDocumentsPage.tsx`
- Upload dokumen resmi
- Arsip dan unduh dokumen

### 8. Audit Log
- **Route:** `/admin/audit`
- **Halaman:** `AdminAuditPage.tsx`
- Riwayat seluruh aktivitas sistem: `LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`
- Filter per aksi, per pengguna, dan per rentang waktu

### 9. Pengaturan Sistem
- **Route:** `/admin/settings`
- **Halaman:** `AdminSettingsPage.tsx`
- Konfigurasi interval auto-refresh
- Pengaturan notifikasi sistem
- Pengaturan tema tampilan

### 10. Monitor Gate Pass
- **Route:** `/admin/gatepass-monitor`
- **Halaman:** `GatePassMonitorPage.tsx` (shared dengan Komandan)
- Lihat semua gate pass yang berstatus `out` (sedang keluar)
- Highlight gate pass yang berstatus overdue (waktu kembali terlewat)
- Tampilkan nama dan NRP personel via join data

---

## 🪖 KOMANDAN

Akses ke data satuan sendiri. Komandan juga dapat mengakses semua route `prajurit`.

### 1. Dashboard Pusat Operasi
- **Route:** `/komandan/dashboard`
- **Halaman:** `KomandanDashboard.tsx`
- Statistik personel satuan sendiri: total, online/offline
- Daftar tugas aktif yang sedang berjalan
- Pengumuman yang di-pin oleh Admin
- Langganan Supabase Realtime (dengan `useCallback` untuk callback yang stabil)

### 2. Manajemen Tugas
- **Route:** `/komandan/tasks`
- **Halaman:** `KomandanTasksPage.tsx`
- Buat tugas baru untuk prajurit (prioritas, deadline, assignee)
- Tinjau laporan penyelesaian dari prajurit
- Approve tugas yang telah diselesaikan
- Reject tugas dengan catatan alasan penolakan
- Filter tugas berdasarkan status

### 3. Data Personel Satuan
- **Route:** `/komandan/personnel`
- **Halaman:** `KomandanPersonnelPage.tsx`
- Lihat daftar personel di satuan sendiri (filter by `user.satuan`)
- Filter status: online / offline
- Pencarian berdasarkan nama atau NRP

### 4. Laporan
- **Route:** `/komandan/reports`
- **Halaman:** `KomandanReportsPage.tsx`
- Laporan absensi satuan per tanggal
- Daftar tugas satuan dengan status masing-masing
- Review pengajuan izin dari personel di bawahnya (approve / reject)
- Export CSV absensi dan tugas satuan

### 5. Evaluasi Personel
- **Route:** `/komandan/evaluation`
- **Halaman:** `KomandanEvaluationPage.tsx`
- Catat peringatan (SP), penghargaan, atau catatan disiplin per personel
- Filter evaluasi by satuan via join data

### 6. Absensi Satuan
- **Route:** `/komandan/attendance`
- **Halaman:** `KomandanAttendancePage.tsx`
- Rekap absensi harian satuan sendiri per tanggal
- Langganan Supabase Realtime (dengan `useCallback` untuk callback yang stabil)

### 7. Permintaan Logistik
- **Route:** `/komandan/logistics-request`
- **Halaman:** `KomandanLogisticsRequestPage.tsx`
- Ajukan permintaan perlengkapan/logistik kepada Admin
- Lihat riwayat permintaan yang pernah diajukan
- Monitor status permintaan (pending / approved / rejected)

### 8. Approval Gate Pass
- **Route:** `/komandan/gatepass-approval`
- **Halaman:** `GatePassApprovalPage.tsx`
- Lihat semua gate pass yang diajukan oleh prajurit di satuan sendiri
- Approve atau reject pengajuan gate pass
- Tampilkan nama dan NRP pemohon via join data

### 9. Monitor Gate Pass
- **Route:** `/komandan/gatepass-monitor`
- **Halaman:** `GatePassMonitorPage.tsx` (shared dengan Admin)
- Lihat gate pass berstatus `out` (sedang di luar)
- Highlight overdue gate pass

---

## 🪂 PRAJURIT

Akses ke data dan fitur milik diri sendiri.

### 1. Dashboard
- **Route:** `/prajurit/dashboard`
- **Halaman:** `PrajuritDashboard.tsx`
- Status absensi hari ini (sudah / belum check-in)
- Tombol check-in / check-out langsung dari dashboard
- Jumlah pesan masuk yang belum dibaca
- Daftar tugas aktif yang ditugaskan ke diri sendiri
- Pengumuman terbaru dari Admin
- Alert notifikasi jika ada tugas yang ditolak Komandan

### 2. Tugas Saya
- **Route:** `/prajurit/tasks`
- **Halaman:** `PrajuritTasksPage.tsx`
- Lihat daftar tugas yang ditugaskan ke diri sendiri (`assigned_to`)
- Mulai kerjakan tugas: status `pending` → `in_progress`
- Kirim laporan penyelesaian: status `in_progress` → `done`
- Filter tugas berdasarkan status (pending, in_progress, done, rejected)

### 3. Absensi
- **Route:** `/prajurit/attendance`
- **Halaman:** `PrajuritAttendancePage.tsx`
- Check-in harian (rekam waktu masuk)
- Check-out harian (rekam waktu keluar)
- Riwayat absensi 30 hari terakhir milik sendiri

### 4. Pesan
- **Route:** `/prajurit/messages`
- **Halaman:** `PrajuritMessagesPage.tsx`
- Inbox: terima pesan dari personel lain
- Terkirim: lihat pesan yang sudah dikirim
- Kirim pesan baru ke personel lain
- Mark as read / Mark all read
- Update realtime via Supabase Realtime

### 5. Pengajuan Izin
- **Route:** `/prajurit/leave`
- **Halaman:** `PrajuritLeavePage.tsx`
- Ajukan permohonan izin: cuti, sakit, dinas luar
- Isi tanggal mulai, tanggal selesai, dan alasan
- Lihat riwayat pengajuan izin dan status persetujuan dari Komandan

### 6. Profil
- **Route:** `/prajurit/profile`
- **Halaman:** `PrajuritProfilePage.tsx`
- Lihat data diri (nama, NRP, pangkat, satuan)
- Ganti PIN (wajib verifikasi PIN lama terlebih dahulu)
- Upload dan ganti foto avatar
- Statistik tugas dan absensi 30 hari terakhir
- Heat-map absensi pribadi

### 7. Gate Pass
- **Route:** `/prajurit/gatepass`
- **Halaman:** `GatePassPage.tsx`
- Ajukan gate pass: isi tujuan, keperluan, waktu keluar, dan waktu kembali yang direncanakan
- Lihat riwayat pengajuan gate pass milik sendiri
- Tampilkan QR code untuk di-scan oleh Guard saat keluar/masuk gerbang
- Notifikasi jika gate pass berstatus overdue (waktu kembali terlewat)

---

## 🛡️ GUARD

Akses terbatas khusus operasi pemindaian di gerbang.

### 1. Scan Gate Pass
- **Route:** `/guard/gatepass-scan`
- **Halaman:** `GateScannerPage.tsx`
- Scan QR code gate pass menggunakan kamera perangkat (library `html5-qrcode`)
- Proses keluar dan masuk personel via Supabase RPC `server_scan_gate_pass`
- Tampilkan hasil scan: nama personel, NRP, tujuan, dan status badge (valid / ditolak / overdue)

---

## 🔐 Fitur Sistem (Semua Peran)

| Fitur | Deskripsi |
|-------|-----------|
| **Login** | Autentikasi via NRP + PIN 6 digit |
| **Logout** | Hapus sesi dan redirect ke halaman login |
| **Enkripsi Sesi** | Sesi dienkripsi AES-GCM; kunci di `sessionStorage`, ciphertext di `localStorage`, expire 8 jam |
| **Notifikasi Browser** | Push notification saat ada pesan baru atau update tugas; opt-in per sesi |
| **Pengumuman** | Semua peran dapat membaca pengumuman dari Admin, diurutkan berdasarkan status pin |
| **Realtime Updates** | Seluruh data (tugas, absensi, pesan, gate pass, logistik) auto-update via Supabase Realtime tanpa perlu reload halaman |
| **Error Boundary** | Menangkap error runtime dan menampilkan halaman error yang informatif |
| **Halaman 404** | Halaman not found dengan tombol kembali ke login |

---

## 🔒 Matriks Akses Route

| Route | admin | komandan | prajurit | guard |
|-------|:-----:|:--------:|:--------:|:-----:|
| `/admin/*` | ✅ | ❌ | ❌ | ❌ |
| `/komandan/*` | ✅ | ✅ | ❌ | ❌ |
| `/prajurit/*` | ✅ | ✅ | ✅ | ❌ |
| `/guard/*` | ✅ | ❌ | ❌ | ✅ |

> Akses route dikontrol di `src/router/` menggunakan field `allowedRoles` pada setiap definisi route.

---

## 📊 Batasan Data Per Peran (Row-Level)

Selain pembatasan route, data yang ditampilkan juga dibatasi di level query database:

| Data | Admin | Komandan | Prajurit | Guard |
|------|-------|----------|----------|-------|
| **Personel** | Semua satuan | Satuan sendiri saja | Diri sendiri | — |
| **Tugas** | Semua | Yang dibuat (`assigned_by`) | Yang ditugaskan ke diri sendiri (`assigned_to`) | — |
| **Absensi** | Semua satuan | Satuan sendiri | Milik sendiri | — |
| **Gate Pass** | Semua (dengan join user) | Semua (untuk approval/monitor) | Milik sendiri | Semua (untuk scan) |
| **Pesan** | — | — | Milik sendiri (inbox/sent) | — |
| **Logistik** | Inventaris + semua permintaan | Permintaan yang dibuat sendiri | — | — |
| **Evaluasi** | — | Satuan sendiri via join | — | — |

---

*Dokumen ini dibuat secara otomatis berdasarkan analisis kode sumber repositori pada 2026-04-15.*
