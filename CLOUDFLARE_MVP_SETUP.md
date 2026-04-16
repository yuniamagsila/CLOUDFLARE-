# Cloudflare MVP Setup

Panduan minimum untuk menjalankan project ini di Cloudflare Pages + Functions + D1.

## 1) Install dependency

```bash
npm install
```

## 2) Buat database D1

```bash
npx wrangler d1 create karyo_os
```

Setelah command di atas selesai:

1. Salin `database_id` hasil output.
2. Tempel ke field `database_id` di `wrangler.toml`.

## 3) Jalankan migration D1

```bash
npm run d1:migrate:local
# untuk cloud account
npm run d1:migrate:remote
```

Migration awal ada di `migrations/0001_initial.sql`.

## 4) Jalankan app lokal

```bash
npm run dev
```

Frontend akan memanggil endpoint Functions di `/api/auth`, `/api/users`, dan `/api/gatepass`.

## 5) Build dan deploy ke Cloudflare Pages

```bash
npm run cf:build
npm run cf:deploy
```

## Catatan

- Migrasi ini sengaja sederhana: endpoint API masih placeholder-friendly untuk menjaga kompatibilitas frontend.
- Nama fungsi frontend pada modul `auth`, `users`, dan `gatepass` dipertahankan agar perubahan aman/incremental.
- Modul lain yang masih menggunakan Supabase bisa dimigrasi bertahap setelah MVP stabil.
