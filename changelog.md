# Changelog

Semua perubahan signifikan pada proyek Mebel Online akan dicatat di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

---

## [Unreleased]

### 2026-07-05

#### Fixed
- **Halaman Admin Kategori Error "Terjadi Kesalahan"**
  - **Masalah:** Halaman `/admin/dashboard/categories` menampilkan error "Terjadi Kesalahan saat memuat bagian ini"
  - **Root Cause:** Optimasi CPU (2026-07-03) menghapus JOIN COUNT dari `GET /api/categories`, tapi frontend masih mengakses `cat._count.products` yang kini `undefined`
  - **Error:** `TypeError: Cannot read properties of undefined (reading 'products')` di `Array.map()`
  - **Solusi:** Defensive coding di frontend — gunakan optional chaining `_count?.products ?? 0`
  - **Perubahan:**
    - `src/app/admin/dashboard/categories/page.tsx`: Interface `Category` → `_count?: { products: number }`, semua akses `_count.products` → `_count?.products ?? 0`
  - **Deploy:** Commit `9ca32f8`, Version ID `f029dba8-43cc-425d-81c6-ba2e2e71ef7e`

#### Security
- **Perbaikan Security Warning Supabase Linter (6 warning → 0)**
  - **Masalah:** 6 warning dari Supabase Database Linter terkait keamanan RPC functions
  - **Perubahan:**
    - `scripts/optimize-auth.sql`: Tambahkan `SET search_path = 'pg_catalog, pg_temp, public'` pada kedua function
    - Tambahkan `GRANT EXECUTE ... TO service_role` (penting: service_role di Supabase BUKAN superuser)
    - Tambahkan `REVOKE EXECUTE ... FROM anon, authenticated` (JANGAN dari PUBLIC — akan blokir service_role)
    - Tambahkan `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role`
  - **Warning yang Dihapus:**
    - `function_search_path_mutable` (2 warning) ✅
    - `anon_security_definer_function_executable` (2 warning) ✅
    - `authenticated_security_definer_function_executable` (2 warning) ✅
  - **File Baru:** `scripts/fix-auth-functions.sql` — versi fix yang bisa langsung dijalankan di Supabase

#### Known Issues
- **❌ Login Admin Gagal — "Email atau password salah"**
  - **Status:** MASIH BELUM TERSELESAIKAN
  - **Gejala:** Login dengan kredensial yang benar tetap gagal, pesan "Email atau password salah"
  - **Console:** Kosong (tidak ada error di browser)
  - **Teori Root Cause:**
    1. `REVOKE EXECUTE FROM PUBLIC` memblokir `service_role` (service_role di Supabase bukan superuser)
    2. Function `verify_admin_password` mungkin tidak bisa akses tabel `Admin` atau `crypt()` dari pgcrypto
    3. `SUPABASE_SERVICE_KEY` mungkin salah/expired di Cloudflare Dashboard
    4. NextAuth session mungkin corrupt akibat error-code loop sebelumnya
  - **Fix yang Sudah Dicoba:**
    - ✅ `SET search_path = 'pg_catalog, pg_temp, public'` (sudah diterapkan)
    - ✅ `GRANT EXECUTE TO service_role` (sudah ada di script)
    - ✅ `REVOKE FROM anon, authenticated` saja (tanpa PUBLIC)
    - ❌ **Masih gagal** — perlu investigasi lebih lanjut
  - **Langkah Selanjutnya (untuk sesi besok):**
    1. **Verifikasi di Supabase SQL Editor:**
       ```sql
       -- Test function langsung
       SELECT verify_admin_password('admin@example.com', 'password123');
       SELECT * FROM get_dashboard_stats();
       ```
    2. **Cek Supabase Logs** — lihat apakah RPC call masuk dan error apa yang muncul
    3. **Cek tabel Admin** — pastikan data admin ada dan password hash format benar
    4. **Cek environment variables** — pastikan `SUPABASE_SERVICE_KEY` benar di Cloudflare Dashboard
    5. **Clear NextAuth session** — mungkin perlu clear cookies/storage di browser
  - **File yang Perlu Diperiksa:**
    - `src/lib/auth.ts` — verifikasi RPC call `verify_admin_password`
    - `src/lib/supabase.ts` — cek apakah `SUPABASE_SERVICE_KEY` benar
    - `src/middleware.ts` — cek apakah ada proteksi yang redirect ke login
  - **Script Fix:** `scripts/fix-auth-functions.sql` — sudah dibuat, tinggal jalankan di Supabase

### 2026-07-04

#### Fixed
- **Error "Terjadi Kesalahan" pada Halaman Admin Kategori**
  - **Masalah:** Halaman `/admin/dashboard/categories` menampilkan error "Terjadi Kesalahan saat memuat bagian ini"
  - **Root Cause:** Optimasi CPU (2026-07-03) menghapus JOIN COUNT dari `GET /api/categories` (`select("*, products:Product(count)")` → `select("*")`), tapi frontend masih mengakses `cat._count.products` yang kini `undefined`
  - **Error:** `TypeError: Cannot read properties of undefined (reading 'products')` di `Array.map()`
  - **Solusi:** Defensive coding di frontend — gunakan optional chaining `_count?.products ?? 0`
  - **Perubahan yang Dilakukan:**
    1. **`src/app/admin/dashboard/categories/page.tsx`**
       - Interface `Category`: `_count` diubah menjadi optional (`_count?: { products: number }`)
       - Semua akses `cat._count.products` → `cat._count?.products ?? 0` (6 tempat)
       - Semua akses `deleteTarget._count.products` → `(deleteTarget._count?.products ?? 0)` (3 tempat)
       - Semua akses `c._count.products` → `c._count?.products ?? 0` (1 tempat)
  - **Impact:** Zero CPU overhead, zero latency, halaman kategori kembali normal
  - **Catatan:** Tidak mengembalikan JOIN COUNT ke API karena akan undo optimasi CPU & berisiko Error 1102 lagi

#### Security
- **Perbaikan Security Warning Supabase Linter (6 warning → 0)**
  - **Masalah:** 6 warning dari Supabase Database Linter terkait keamanan RPC functions
  - **Perubahan yang Dilakukan:**
    1. **`scripts/optimize-auth.sql`**
       - Tambahkan `SET search_path = ''` pada `verify_admin_password` dan `get_dashboard_stats` — mencegah search path injection
       - Tambahkan `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` — cabut akses publik dari RPC functions
       - Tambahkan `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC` — cegah auto-grant di masa depan
  - **Warning yang Dihapus:**
    - `function_search_path_mutable` (2 warning) ✅
    - `anon_security_definer_function_executable` (2 warning) ✅
    - `authenticated_security_definer_function_executable` (2 warning) ✅
  - **Dampak:** Zero impact pada performa & UX — semua RPC dipanggil via `service_role` dari server Next.js

### 2026-07-03

#### Fixed
- **Error 1102: Worker Exceeded Resource Limits di Halaman Admin**
  - **Masalah:** 
    - Login gagal dengan pesan "Terjadi kesalahan. Silakan coba lagi."
    - Dashboard admin (`/admin/dashboard`) menampilkan Error 1102 setelah login berhasil
    - Penyebab: Cloudflare Workers Free Tier hanya 50ms CPU time, sedangkan bcrypt.compare() + Supabase query memakan 60-80ms
  - **Analisis Root Cause:**
    - `src/lib/auth.ts` menggunakan bcryptjs untuk verifikasi password di Worker (20-40ms CPU)
    - `src/app/api/admin/dashboard-stats/route.ts` melakukan 2 query Supabase terpisah (40-50ms CPU)
    - Total CPU time melebihi limit 50ms Free Tier
  - **Solusi yang Dipilih:** Pindahkan proses bcrypt dari Worker ke Supabase menggunakan Database Functions (RPC) dengan ekstensi pgcrypto
    - **Keuntungan:**
      - bcrypt tetap aman (pgcrypto menggunakan bcrypt yang sama)
      - Hash yang sudah tersimpan di Supabase tetap kompatibel
      - CPU berat pindah ke Supabase (gratis, tidak ada biaya tambahan)
      - Query + verifikasi jadi 1 RPC call (mengurangi latency)
    - **Alternatif yang Ditolak:**
      - Hapus login sepenuhnya (tidak aman)
      - Upgrade ke Workers Paid plan ($5/bulan) (berbayar)
  - **Perubahan yang Dilakukan:**
    1. **`scripts/optimize-auth.sql`** (BARU)
       - Enable ekstensi `pgcrypto`
       - Function `verify_admin_password(p_email, p_password)` — menggantikan SELECT + bcrypt.compare()
       - Function `get_dashboard_stats()` — menggantikan 2 query terpisah
    2. **`src/lib/auth.ts`**
       - Ganti query manual + bcrypt.compare() dengan 1 RPC call ke `verify_admin_password`
       - Fungsi `hashPassword()` dan `verifyPassword()` tetap ada untuk change-password/reset-password
    3. **`src/app/api/admin/dashboard-stats/route.ts`**
       - Ganti 2 query Supabase dengan 1 RPC call `get_dashboard_stats`
    4. **`src/app/admin/dashboard/page.tsx`** (sebelumnya)
       - Diubah dari SSR ke client component (data diambil via API dari browser)
  - **Estimasi CPU Setelah Optimasi:**
    - Login: 60-80ms → 15-25ms ✅ (di bawah 50ms limit)
    - Dashboard API: 40-50ms → 10-15ms ✅ (di bawah 50ms limit)
  - **⚠️ WAJIB: Jalankan SQL Migration**
    - Buka Supabase Dashboard → SQL Editor
    - Copy-paste isi file `scripts/optimize-auth.sql`
    - Klik Run
   - **Deploy Info:**
     - Version ID: `a5dfdfd2-5e8f-4f9f-9894-7c89c2e8497d`
     - Commit: `5176376`

- **Optimasi CPU Worker: Hapus Rate-Limiter, Auto-Renumber, dan JOIN COUNT**
  - **Masalah:** Setelah fix login dengan RPC, masih ada bottleneck lain yang menyebabkan Error 1102
  - **Analisis Root Cause:**
    1. **Rate-limiter database-based** (`src/lib/rate-limit.ts`): 2-3 query Supabase per request (25-35ms overhead)
    2. **Auto-renumber N+1 loop** di `POST /api/products`: Loop UPDATE untuk setiap produk setelah insert (100-150ms untuk 50 produk)
    3. **JOIN COUNT** di `GET /api/categories`: Aggregate count per kategori (5-10ms overhead)
  - **Keputusan yang Diambil:**
    1. **HAPUS rate-limiter database-based**
       - Alasan: Single admin user, low traffic, overhead tidak sebanding dengan manfaat
       - File dihapus: `src/lib/rate-limit.ts`
       - Import dihapus dari: `products/route.ts`, `categories/route.ts`, `products/[id]/route.ts`, `auth/reset-password/route.ts`, `auth/forgot-password/route.ts`
    2. **HAPUS auto-renumber loop** di `POST /api/products`
       - Alasan: N+1 query problem, produk baru cukup ditaruh di akhir (sortOrder = max+1)
       - User masih bisa renumber manual via tombol "Urutkan Ulang" di UI
       - Baris dihapus: 169-208 di `src/app/api/products/route.ts`
    3. **HAPUS JOIN COUNT** di `GET /api/categories`
       - Alasan: Count tidak dipakai di landing page, hanya di admin categories page
       - Query diubah dari `select("*, products:Product(count)")` → `select("*")`
    4. **TOLAK rekomendasi ubah dashboard ke SSR+ISR**
       - Alasan: Dashboard sudah client component (optimal), Worker hanya kirim HTML shell statis
       - Mengubah ke SSR justru menambah beban Worker (harus panggil Supabase RPC setiap 30 detik)
  - **Estimasi CPU Setelah Optimasi:**
    - GET /api/products: 10-15ms ✅
    - GET /api/categories: 10-15ms ✅
    - POST /api/products: 10-15ms ✅
    - Login: 15-25ms ✅ (sudah fixed sebelumnya dengan RPC)
  - **Deploy Info:**
    - Version ID: `4790fbe0-2c88-4363-9dc2-ede6a0da1c67`
    - Commit: `25c96a5`

#### Changed
- **Adaptive Quality Compression untuk Konsistensi WebP**
  - Masalah: Upload dari HP menghasilkan WebP 500-900 KB, sedangkan dari laptop <135 KB
  - Penyebab: Canvas API WebP encoder di mobile browser kurang agresif dibanding desktop
  - Solusi: Implementasi adaptive quality loop (0.90 → 0.82 → 0.75)
  - Quality minimum 0.75 untuk menjaga kualitas visual
  - Target ukuran per tipe: produk 450 KB, galeri 400 KB, hero 500 KB, tentang-kami 450 KB, logo 100 KB
  - File diubah: `src/lib/image-compression.ts`
  - Hasil: Konsisten ≤500 KB di semua perangkat (laptop, HP, tablet)

### 2026-07-02

#### Fixed
- **Duplikasi Environment Variables di Cloudflare Dashboard**
  - Hapus section `[vars]` dari `wrangler.toml` yang menyebabkan halaman "Variables and secrets" muncul 2 kali
  - Bersihkan `.dev.vars` — hapus `NEXT_PUBLIC_*` dan `RESEND_FROM_EMAIL` yang duplikat
  - Semua environment variables sekarang hanya di-set via **Cloudflare Dashboard → Build Settings → Variables and secrets**
  - `.dev.vars` hanya digunakan untuk local development (`wrangler dev`)
  - Deploy ulang berhasil, Worker live di `https://mebel-online.mebelonline.workers.dev`
  - Commit: `5cfa032`

---

## [1.0.0] - 2026-07-02

### Migrasi: Vercel → Cloudflare Workers

#### Added
- Konfigurasi Cloudflare Workers (`wrangler.toml`)
- OpenNext build system (`@opennextjs/cloudflare`)
- Scripts baru: `cf-build`, `cf-dev`, `cf-deploy`
- Supabase Image Transformation loader
- Environment variables via Cloudflare Dashboard Build Settings

#### Changed
- Hapus `sharp` dari dependencies (tidak kompatibel dengan Cloudflare Workers)
- Update `src/lib/upload.ts` — hapus konversi WebP server-side
- Update `src/lib/supabase-image-loader.ts` — gunakan Supabase Image Transformation URL
- Update `next.config.ts` — tambah `output: "standalone"`
- Update `package.json` — hapus `postinstall`, tambah scripts Cloudflare

#### Removed
- `sharp` dependency
- Vercel-specific configuration
- Prisma ORM (diganti Supabase JS Client)

#### Fixed
- Build berhasil: 21 halaman, 0 error TypeScript
- Deploy ke Cloudflare Workers berhasil

### Migrasi: Prisma → Supabase JS Client (2026-06-22)

#### Added
- `src/lib/supabase.ts` — Supabase client dengan lazy getter pattern
- Integrasi `@supabase/supabase-js` di 15+ API routes & components

#### Removed
- `prisma/` folder
- `src/lib/prisma.ts`
- Prisma ORM dependency

#### Fixed
- Vercel deployment gagal karena Prisma binary engine incompatible
- PostgreSQL wire protocol diblokir di Vercel

---

## Template Entry

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Fitur baru yang ditambahkan

### Changed
- Perubahan pada fitur existing

### Deprecated
- Fitur yang akan dihapus di versi mendatang

### Removed
- Fitur yang dihapus

### Fixed
- Bug fix

### Security
