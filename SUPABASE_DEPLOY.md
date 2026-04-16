# 🚀 Panduan Deploy via Terminal (Codespace) — KARYO OS

Panduan lengkap untuk setup dan deploy **KARYO OS** ke Supabase + Cloudflare Pages langsung dari terminal GitHub Codespaces — tanpa perlu membuka browser dashboard selama proses berlangsung.

---

## 📋 Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Setup Pertama Kali](#2-setup-pertama-kali)
3. [Deploy ke Supabase + Cloudflare Pages](#3-deploy-ke-supabase--cloudflare-pages)
4. [Seed Data Sample](#4-seed-data-sample)
5. [Aktifkan Realtime](#5-aktifkan-realtime)
6. [Verifikasi Deploy](#6-verifikasi-deploy)
7. [Troubleshooting](#7-troubleshooting)
8. [Referensi Perintah CLI](#8-referensi-perintah-cli)

---

## 1. Prasyarat

Sebelum memulai, siapkan:

| Kebutuhan | Keterangan |
|---|---|
| **GitHub Codespaces** | Atau Linux terminal dengan Node.js >= 20 |
| **Akun Supabase** | Daftar gratis di [supabase.com](https://supabase.com) |
| **Akun Cloudflare** | Repository ini dideploy ke Cloudflare Pages via GitHub Actions menggunakan Wrangler CLI |
| **Supabase Project** | Buat project baru di dashboard, catat **Project ID** dan **API keys** |

### Cara mendapatkan Supabase credentials:
1. Buka [supabase.com](https://supabase.com) → pilih project kamu
2. **Settings** → **API**
3. Catat:
   - **Project URL** → untuk `VITE_SUPABASE_URL`
   - **anon public** key → untuk `VITE_SUPABASE_ANON_KEY`
4. **Settings** → **General** → catat **Reference ID** → untuk `Project ID`

### Cara mendapatkan Cloudflare credentials:
1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **My Profile** → **API Tokens**
2. Buat token baru dengan template **Edit Cloudflare Workers** atau buat Custom Token dengan izin `Cloudflare Pages: Edit`
3. Catat **Account ID** dari halaman utama dashboard Cloudflare (kanan bawah)

> ⚠️ Gunakan hanya `anon public` key di frontend. Jangan gunakan `service_role` key.

---

## 2. Setup Pertama Kali

Jalankan satu perintah ini di terminal Codespace:

```bash
bash scripts/setup.sh
```

Script ini secara otomatis akan:

| Langkah | Deskripsi |
|---|---|
| ✅ Cek Node.js | Memastikan versi >= 20 |
| ✅ Install Supabase CLI | Via npm global |
| ✅ Install dependensi | `npm ci` |
| ✅ Buat `.env.local` | Interaktif — masukkan URL + anon key Supabase |
| ✅ Login Supabase | `supabase login` |
| ✅ Link project | `supabase link --project-ref <ID>` |
| ✅ Jalankan migrasi | `supabase db push` — semua file di `supabase/migrations/` |
| ✅ Build production | `npm run build` |

### Contoh output:

```
══════════════════════════════════════
  4. Konfigurasi Environment Variables
══════════════════════════════════════
  VITE_SUPABASE_URL  (contoh: https://abcd.supabase.co) : https://xyzxyz.supabase.co
  VITE_SUPABASE_ANON_KEY (anon public key)              : eyJhbGci...

✔  .env.local berhasil dibuat.

══════════════════════════════════════
  6. Jalankan Migrasi Database
══════════════════════════════════════
ℹ  Menjalankan semua migration ke Supabase cloud...
Applying migration 001_initial_schema.sql...
Applying migration 002_seed_data.sql...
Applying migration 003_server_functions.sql...
Applying migration 004_production_rls.sql...
✔  Semua migration berhasil dijalankan.
```

---

## 3. Deploy ke Supabase + Cloudflare Pages

Setelah setup selesai, jalankan:

```bash
git push origin main
```

Workflow ini akan:

| Langkah | Perintah yang dijalankan |
|---|---|
| Terapkan migrasi terbaru | `supabase db push` |
| Build production | `npm run build` |
| Deploy ke Cloudflare Pages | `wrangler pages deploy dist --project-name karyo-os` |

### Catatan penting:
- Workflow membaca `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari GitHub Secrets saat build
- Cloudflare Pages melayani SPA dari root `/` — routing fallback ditangani oleh `public/_redirects`
- Secrets `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` wajib ditambahkan ke GitHub repository
- Setiap kali ada perubahan kode, cukup jalankan `git push origin main`

---

## 4. Seed Data Sample

> **Opsional** — hanya untuk development atau demo pertama kali.

Setelah setup, jalankan langsung via Supabase CLI:

```bash
# Lihat daftar migration yang tersedia
supabase migration list

# Seed data sudah termasuk di migration 002_seed_data.sql
# Jika belum dijalankan, push ulang:
supabase db push
```

Atau jalankan SQL secara langsung via terminal:

```bash
supabase db execute --file supabase/migrations/002_seed_data.sql
```

Data sample yang dibuat (semua PIN: **123456**):

| NRP | Nama | Role | Satuan |
|---|---|---|---|
| `1000001` | Admin Karyo | `admin` | Batalyon 1 |
| `2000001` | Budi Santoso | `komandan` | Batalyon 1 |
| `3000001` | Agus Pratama | `prajurit` | Batalyon 1 |
| `3000002` | Hendra Wijaya | `prajurit` | Batalyon 1 |
| `3000003` | Eko Susanto | `prajurit` | Batalyon 1 |

Atau buat akun admin pertama secara manual:

```bash
supabase db execute --sql "SELECT public.create_user_with_pin('1000001','123456','Admin Karyo','admin','Batalyon 1','Letnan Kolonel','Komandan Batalyon');"
```

> ⚠️ **Production:** Ganti PIN default segera setelah login pertama.

---

## 5. Aktifkan Realtime

Aktifkan Realtime untuk tabel yang diperlukan via CLI:

```bash
# Buka Supabase Studio di browser (opsional, untuk verifikasi)
supabase studio

# Atau aktifkan langsung via SQL
supabase db execute --sql "
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
  ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
"
```

| Tabel | Kegunaan |
|---|---|
| `messages` | Pesan real-time antar pengguna |
| `announcements` | Pengumuman baru muncul langsung |
| `tasks` | Update status tugas real-time |
| `attendance` | Monitoring kehadiran live (opsional) |

---

## 6. Verifikasi Deploy

### Test login via terminal (opsional):

```bash
# Cek status Supabase project
supabase status

# Cek daftar tabel yang terbuat
supabase db execute --sql "
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
"
```

Harus tampil minimal 13 tabel:
```
announcements, attendance, audit_logs, discipline_notes, documents,
leave_requests, logistics_items, logistics_requests, messages,
shift_schedules, task_reports, tasks, users
```

### Cek status Cloudflare Pages:

- Buka tab **Actions** dan lihat workflow **Cloudflare Pages Deploy**
- URL produksi: `https://karyo-os.pages.dev`

### Test RLS:

```bash
supabase db execute --sql "
  SELECT * FROM public.verify_user_pin('1000001', '123456');
"
```

### Checklist Keamanan Production

- [ ] Migration 004 (production RLS) sudah dijalankan — `supabase db push`
- [ ] PIN admin default sudah diganti setelah login pertama
- [ ] Database password Supabase disimpan di tempat aman
- [ ] `.env.local` tidak di-commit ke Git (sudah ada di `.gitignore`)
- [ ] `service_role` key tidak diekspos ke frontend
- [ ] Realtime hanya aktif untuk tabel yang diperlukan

---

## 7. Troubleshooting

### ❌ `supabase: command not found`

```bash
npm install -g supabase
# atau
npx supabase --version
```

### ❌ `Error: project not linked`

```bash
supabase link --project-ref <PROJECT_ID>
```

Project ID ada di Supabase Dashboard → **Settings** → **General** → **Reference ID**.

### ❌ `supabase db push` gagal — migration error

```bash
# Lihat status migration
supabase migration list

# Repair jika ada yang stuck
supabase migration repair --status applied <versi_migration>
```

### ❌ Build Cloudflare Pages gagal — env variable tidak terdeteksi

Pastikan secrets berikut sudah ditambahkan di repository:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Lalu jalankan ulang workflow **Cloudflare Pages Deploy** dari tab Actions.

### ❌ Deploy Wrangler gagal — autentikasi Cloudflare ditolak

Pastikan secrets berikut sudah ditambahkan di repository:

- `CLOUDFLARE_API_TOKEN` — API token dengan izin `Cloudflare Pages: Edit`
- `CLOUDFLARE_ACCOUNT_ID` — Account ID dari dashboard Cloudflare

Buat API token baru di [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens).

### ❌ Login gagal padahal NRP & PIN benar

```bash
# Cek apakah RLS session context aktif
supabase db execute --sql "
  SELECT current_setting('karyo.current_user_id', TRUE);
  SELECT current_setting('karyo.current_user_role', TRUE);
"
```

Jika kosong, berarti `authStore` tidak memanggil `set_session_context` setelah login.

### ⚡ Project Supabase "Paused" (Free Plan)

```bash
# Tidak bisa resume via CLI — buka dashboard
supabase projects list  # cek status project
# Buka https://supabase.com/dashboard → Restore project
```

---

## 8. Referensi Perintah CLI

### Supabase CLI

```bash
supabase login                        # Login ke Supabase
supabase projects list                # Daftar semua project
supabase link --project-ref <ID>      # Hubungkan ke project
supabase db push                      # Terapkan semua migration
supabase migration list               # Lihat daftar migration
supabase db execute --sql "<SQL>"     # Jalankan SQL langsung
supabase db execute --file <file.sql> # Jalankan file SQL
supabase status                       # Status project
supabase studio                       # Buka Supabase Studio di browser
supabase logout                       # Logout
```

### Wrangler CLI (Cloudflare Pages)

```bash
npx wrangler login                                              # Login ke Cloudflare
npx wrangler pages project list                                 # Daftar semua Pages project
npx wrangler pages project create karyo-os                      # Buat project baru
npx wrangler pages deploy dist --project-name karyo-os          # Deploy ke production
npx wrangler pages deployment list --project-name karyo-os      # Lihat daftar deployment
npx wrangler pages deployment tail --project-name karyo-os      # Lihat log deployment terbaru
```

### Script proyek

```bash
bash scripts/setup.sh    # Setup lengkap (sekali jalan)
bash scripts/deploy.sh   # Deploy ke Supabase + Netlify
npm run dev              # Dev server lokal
npm run build            # Build production
npm run lint             # ESLint
npm run type-check       # TypeScript check
npm test                 # Jalankan test
```

---

## 📚 Referensi

- [Supabase CLI Docs](https://supabase.com/docs/reference/cli)
- [Netlify CLI Docs](https://docs.netlify.com/cli/get-started/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Vite + Netlify Deploy](https://vitejs.dev/guide/static-deploy.html#netlify)

---

<div align="center">
  <strong>KARYO OS</strong> — Setup & Deploy via Terminal 🇮🇩
</div>
