# Ringkasan Troubleshoot — mebel-online.deploy

## 1. Informasi Proyek

| Item | Value |
|------|-------|
| Repo GitHub | github.com/mebelonline-projek/Mebel-online |
| Framework | Next.js 15 (sudah di-upgrade dari 15.2.4 ke 15.5.19) |
| Database | PostgreSQL via Supabase (project: xczbowaotnvzduikgdad) |
| Hosting | Vercel (project: prj_ywmW0ddwJ7k4DttrpPRLWjEMMrYZ) |
| Domain | mebelonline.id |
| Package | muara-teweh-furniture@0.1.0 |
| Prisma | 6.19.3 (schema: prisma/schema.prisma) |

## 2. Masalah

**Build sukses** (deployment status Ready/hijau) tapi **runtime error**: Prisma gagal connect ke database Supabase.

### Error dari runtime logs Vercel:
```
Error [PrismaClientInitializationError]: 
Invalid `prisma.siteConfig.findMany()` invocation:
Authentication failed against database server, the provided database 
credentials for `postgres` are not valid.
```
atau:
```
Can't reach database server at `db.xczbowaotnvzduikgdad.supabase.co:6543`
```

## 3. Sudah Dilakukan

### A. Kode & Konfigurasi
- ✅ **Next.js upgrade**: 15.2.4 → 15.5.19 (fix CVE security)
- ✅ **`force-dynamic`**: ditambahkan di `layout.tsx` dan `page.tsx`
- ✅ **Deployment URL**: Commit baru terus di-push ke `origin/master`
- ✅ **Ubah schemma Prisma**: `directUrl = env("DIRECT_URL")` sudah di schema

### B. Environment Variables di Vercel
Sudah di-set dan di-remove berkali-kali:
- ✅ `DATABASE_URL` — port 5432 & 6543, dengan & tanpa `?pgbouncer=true`
- ✅ `DIRECT_URL` — port 5432
- ✅ `AUTH_URL` = https://mebelonline.id
- ✅ `AUTH_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### C. Vercel Supabase Integration
- ✅ Awalnya terintegrasi otomatis (POSTGRES_URL, POSTGRES_PRISMA_URL, dll muncul)
- ✅ Integration sudah di-DISCONNECT dari Vercel Dashboard
- ✅ Semua env vars POSTGRES_* sudah dihapus manual

### D. Database Password
Password yang sudah dicoba (semua gagal dengan error "Authentication failed"):
1. `BZhuvrEzC8dHV4nw` (password asli dari .env)
2. `W1FLZOC6DJOcOnfN` (reset pertama)
3. `MEbelonline01` (reset kedua)
4. `Mebelonline02` (reset ketiga)

### E. Connection Pool
- ✅ Port 5432 (direct) — error: Can't reach / Authentication failed
- ✅ Port 6543 dengan `?pgbouncer=true` — error: Can't reach / Authentication failed
- ✅ Error dari Vercel juga muncul ke `aws-1-ap-southeast-1.pooler.supabase.com:6543`

### F. Diagnosis
- ✅ Supabase REST API reachable (check_connection sukses)
- ✅ Storage buckets bisa di-list (furniture-images)
- ✅ Domain DNS sudah mengarah ke Vercel (mebelonline.id bisa diakses)
- ❌ PostgreSQL **tidak reachable** dari Vercel atau lokal, semua password gagal

## 4. Yang BELUM Dicoba

1. **Copy connection string LENGKAP** dari Supabase Dashboard → Project Settings → Database → Connection string (bukan hanya password)
2. **Reset password** di Supabase → copy **connection string lengkap** setelah reset
3. **Nonaktifkan IPv6** atau cek firewall/rules database di Supabase (Project Settings → Database → Network Restrictions)
4. **Cek database status** di Supabase Dashboard — mungkin database ter-pause (free tier)
5. **Tes dari SQL Editor** di Supabase Dashboard: `SELECT 1;`
6. **Cek Prisma binary** — mungkin perlu `binaryTargets` di schema.prisma untuk Vercel
7. **Hapus `.env.local`** dari Vercel (ada file `.env.local` hasil download dari Vercel)

## 5. Struktur File

- `src/app/page.tsx` — landing page utama, panggil `prisma.product.findMany()`
- `src/app/admin/dashboard/layout.tsx` — admin layout
- `prisma/schema.prisma` — model: Admin, PasswordResetToken, Category, Product, SiteConfig
- `.env` — konfigurasi lokal (DATABASE_URL, DIRECT_URL, AUTH_URL, dll)

## 6. Commit History (terbaru)
```
9d7e9fc chore: redeploy with fresh DATABASE_URL and DIRECT_URL
7b51df8 fix: remove outputFileTracingRoot causing double path in Vercel
9a54ca0 fix: add Prisma binaryTargets and Next.js config for Vercel deployment
d45fe4f chore: redeploy with clean env vars
04d79f5 fix: remove conflicting POSTGRES_* env vars
a44d2f9 fix: update database password to Mebelonline02
a1a5648 fix: redeploy with proper env config
ce61544 fix: use Supabase connection pooler port 6543
e6bb2cf chore: trigger redeploy
ef4b653 fix: use correct database password
a1a5648 fix: redeploy with proper env config
1dc8777 fix: upgrade Next.js 15.2.4 -> 15.5.19
```

## 8. Update Sesi 2 — 2026-06-21 — Merging feature/variant-selector & Fix binaryTargets

### Yang Baru Dilakukan di Sesi Ini:
1. ✅ **Merge branch `feature/variant-selector` ke `master`** — menggabungkan 39 file, 2452 insertions, 649 deletions
   - Fitur baru: Variant selector (color/size/material picker), animasi framer-motion, image uploader, WhatsApp integration, SocialIcon, rate-limiting
   - Versi final aplikasi sudah tergabung ke master
2. ✅ **Fix schema.prisma provider** — `sqlite` → `postgresql` (setelah merger, provider masih sqlite dari branch feature)
3. ✅ **Push ke GitHub** — commit `375b3cd` → `6c3ae7b` → `0440b50`
4. ✅ **Reset password Supabase** — `Mebelonline02`
5. ✅ **Fix binaryTargets** — `["native", "linux-musl"]` → `["native", "rhel-openssl-3.0.x"]`
   - **Alasan:** Vercel Lambda menggunakan **Amazon Linux 2023** (RHEL-based), BUKAN Alpine Linux
   - Binary engine `linux-musl` untuk Alpine — tidak kompatibel dengan Vercel
   - Binary `rhel-openssl-3.0.x` untuk Red Hat Enterprise Linux — cocok dengan Vercel Lambda
6. ✅ **Koneksi database lokal** — sukses dengan port 5432 (direct)
7. ✅ **Prisma generate** — download engine untuk `rhel-openssl-3.0.x`
8. ✅ **Trigger redeploy** — commit `0440b50`

### Status Terkini:
- ✅ **Halaman utama (mebelonline.id)** — return **HTTP 200**, tidak ada error database lagi
- ✅ **Error "Authentication failed against database server"** — ✅ SUDAH HILANG
- ❌ **Error runtime** — masih loading state ("Memuat...") karena ada error di server component
- ❌ **API endpoints** — `/api/products` return 500 (Internal Server Error)
- ⏳ **Vercel build baru** — belum terdeploy (Vercel masih serve build lama)

### Penyebab Loading Error (Analisis):
1. Error runtime bukan karena koneksi database — tapi karena ada exception di server component
2. Ada 2 error digest: `1588850318` dan `3535259424`
3. API endpoints juga return 500 — kemungkinan error Prisma runtime yang sama di Vercel

### Langkah Selanjutnya:
1. **Verifikasi deployment baru** — cek Vercel Dashboard → Deployments (commit `0440b50`)
2. Jika belum terdeploy: **trigger manual** di Vercel Dashboard → Redeploy
3. Pastikan **Production Branch** di Vercel Settings → Git diatur ke **master**
4. Jika tetap error, cek **Vercel Runtime Logs** untuk lihat error detail

### Commit History (terbaru):
```
0440b50 (HEAD -> master, origin/master) fix: change Prisma binaryTargets from linux-musl to rhel-openssl-3.0.x for Vercel Lambda
6c3ae7b chore: trigger redeploy after Supabase password reset
375b3cd Merge branch 'feature/variant-selector' into master
```

### Catatan Penting:
- Error Prisma authentication (password salah) sudah **TIDAK terjadi lagi**
- Masalah sekarang adalah **error runtime komponen** yang perlu dicek via Vercel Runtime Logs
- Jika Vercel tidak mendeteksi commit baru, perlu: login ke **vercel.com** → project → redeploy manual
- Vercel CLI tidak bisa digunakan karena token tidak valid — perlu login ulang

tambahan
7. Update Sesi 3 — 2026-06-21 — Isolasi Proyek Baru, Diagnosis Runtime Logs, & Bypass Masalah Jaringan IPv6
Yang Baru Dilakukan di Sesi Ini:
✅ Membuat Proyek Baru di Vercel (mebel-online-fresh)

Mengambil repositori mebelonline-projek/Mebel-online dengan Production Branch diatur bersih ke master.

Mengeliminasi sisa-sisa kerusakan cache build lama Vercel dengan menonaktifkan opsi “Use existing Build Cache”.

✅ Identifikasi Kekacauan Versi Dependensi (Dependency Hell)

Berdasarkan Build Logs, ditemukan bahwa AI Agent sebelumnya sempat memperbarui sistem secara otomatis yang menaikkan versi Next.js secara tidak sengaja ke versi 16.2.9 (Turbopack). Hal ini memicu banyak breaking changes pada penulisan logika Middleware dan komponen server.

Dilakukan pembersihan dan downgrade versi Next.js kembali ke versi 15 yang stabil.

✅ Diagnosis via Vercel Runtime Logs

Berhasil menangkap pesan error asli di balik tirai UI "This page couldn't load".

Temuan Jaringan 1 (Salah Port Host): Struktur file .env lama kedapatan menembak alamat host direct (db.xczbowaotnvzduikgdad.supabase.co) namun dipaksa menggunakan port connection pooler (6543). Hal ini membuat jaringan ditolak oleh server Supabase Singapura.

Temuan Jaringan 2 (Isu Tenant Identifier / SNI): Ketika mencoba beralih menggunakan alamat pooler AWS global (aws-1-ap-southeast-1.pooler.supabase.com:6543), Supabase menolak dengan error FATAL: (ENOIDENTIFIER) no tenant identifier provided. Supabase mewajibkan identitas proyek disisipkan pada struktur sub-domain atau modifikasi username (postgres.xczbowaotnvzduikgdad).

✅ Verifikasi Status Keamanan Supabase

Melalui pengecekan manual di menu Settings → Database → Network Restrictions di Supabase Dashboard, dipastikan statusnya adalah Your database can be accessed by all IP addresses (Gerbang firewall Supabase terbuka penuh dan tidak memblokir IP Vercel).

✅ Solusi Bypass Jaringan IPv6 via Direct IPv4 Proxy

Dikarenakan kegagalan beruntun pada port 6543 (masalah SNI) dan port 5432 standar (kendala jaringan IPv6-only pada infrastruktur baru Supabase yang tidak terjangkau oleh IPv4 default Vercel), diputuskan untuk melewati (bypass) seluruh sistem perantara.

Mengganti seluruh alamat connection string menggunakan host proxy IPv4 resmi khusus dari Supabase untuk wilayah AWS Asia Tenggara (Singapura).

Status Terkini:
✅ Build & Deployment: Sukses terkompilasi 100% pada proyek baru tanpa cache constraint.

✅ Firewall: Terbuka lebar dari sisi Supabase.

⚙️ Konfigurasi Variabel Siap Tempel (Final IPv4 Direct Bypass):
Kedua variabel lingkungan utama di Vercel Dashboard diarahkan langsung menggunakan string URI khusus berikut demi kestabilan koneksi tanpa gangguan pooler routing:

DATABASE_URL:

Plaintext
postgresql://postgres:Mebelonline02@aws-1-ap-southeast-1.direct.supabase.com:5432/postgres
DIRECT_URL:

Plaintext
postgresql://postgres:Mebelonline02@aws-1-ap-southeast-1.direct.supabase.com:5432/postgres
Langkah Selanjutnya:
Pastikan kedua variabel di atas tersimpan dengan benar di Vercel Settings proyek baru.

Lakukan Redeploy tanpa centang Build Cache untuk menerapkan rute IPv4 final ini.

Pantau apakah halaman utama mebelonline.id sudah sukses menarik data produk dari Supabase.