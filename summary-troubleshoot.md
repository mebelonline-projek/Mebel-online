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

## 8. Update Sesi 2026-06-21 — Sesudah Fix

### Yang sudah dilakukan di sesi ini:
- ✅ **binaryTargets** ditambahkan di `prisma/schema.prisma` — `["native", "linux-musl"]` (kompatibilitas Vercel serverless)
- ✅ **serverExternalPackages** ditambahkan di `next.config.ts` — `["@prisma/client", "bcryptjs"]` (biar Prisma terbundle benar di serverless)
- ✅ **outputFileTracingRoot** dihapus dari `next.config.ts` (menyebabkan error double path `/vercel/path0/vercel/path0/`)
- ✅ **DATABASE_URL** dan **DIRECT_URL** di Vercel production dihapus lalu di-set ulang dengan credential yang sama
- ✅ **Test koneksi database dari lokal**: ✅ SUKSES (Admin:1, Product:32, Category:13)
- ✅ **Build lokal**: ✅ SUKSES (16 halaman, 0 error)

### Status Terkini:
- ❌ **Deploy Vercel masih gagal** — build berhasil, runtime error (Application error)
- ❌ **Domain mebelonline.id** masih error
- ❌ **Database credential `Mebelonline02`** valid dari lokal tapi gagal dari Vercel

### Kemungkinan penyebab yang belum diperiksa:
1. Perlu cek **Network Restrictions** di Supabase (Project Settings → Database) — mungkin Vercel IP diblok
2. Database mungkin masih menggunakan **password lama** yang dipakai sebelum reset — coba pakai password `BZhuvrEzC8dHV4nw` di connection string
3. Perbedaan **Prisma engine** antara lokal (Windows) dan Vercel (Linux) — binaryTargets sudah ditambahkan tapi perlu verifikasi
4. Mungkin ada **caching env var** di Vercel yang masih pakai nilai lama meski sudah dihapus & di-set ulang
