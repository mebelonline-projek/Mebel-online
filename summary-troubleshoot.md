# 📋 Ringkasan Troubleshooting: Migrasi Prisma → Supabase JS Client

> **Proyek:** Mebel Online (Next.js 15.5.19, App Router)
> **Domain:** mebelonline.id
> **Supabase Project:** xczbowaotnvzduikgdad (ap-southeast-1)
> **Vercel Project:** prj_ywmW0ddwJ7k4DttrpPRLWjEMMrYZ
> **Tanggal:** 22 Juni 2026

---

## 1. Masalah Awal

**Gejala:** Vercel deployment gagal terus-menerus selama 2 hari. Build error terkait Prisma.

**Error yang Muncul:**
```
Error: Prisma binary engine incompatible with Vercel Lambda environment
- Expected: linux-musl
- Found: rhel-openssl-3.0.x
```

Selain itu, PostgreSQL wire protocol (port 5432) diblokir oleh Vercel Edge Network, menyebabkan koneksi database terputus.

---

## 2. Akar Masalah (Root Cause)

| Faktor | Detail |
|--------|--------|
| **Prisma Engine** | Prisma menggunakan binary engine native (`query-engine`) yang harus cocok dengan OS runtime. Vercel Lambda menggunakan `rhel-openssl-3.0.x`, sementara Prisma 개발 environment menggunakan `linux-musl`. |
| **PostgreSQL Wire Protocol** | Vercel Free/Pro tidak mengizinkan koneksi TCP langsung ke port 5432 (PostgreSQL). Hanya HTTP/HTTPS (port 80/443) yang diizinkan. |
| **Kombinasi** | Prisma membutuhkan koneksi langsung ke database via wire protocol, yang tidak bisa melewati firewall Vercel. |

---

## 3. Solusi: Migrasi ke Supabase JS Client

**Keputusan:** Hapus Prisma ORM, gunakan `@supabase/supabase-js` (REST API via HTTPS port 443).

### 3.1. File Baru: `src/lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
    }
    if (!supabaseServiceKey) {
      throw new Error("SUPABASE_SERVICE_KEY is not set");
    }

    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseInstance;
}

export type Tables =
  | "Admin"
  | "PasswordResetToken"
  | "Category"
  | "Product"
  | "SiteConfig"
  | "RateLimit";
```

### 3.2. Package yang Berubah

| Package | Status |
|---------|--------|
| `@prisma/client` | **DIHAPUS** |
| `prisma` | **DIHAPUS** |
| `@supabase/supabase-js` | **DITAMBAHKAN** (versi terbaru) |

### 3.3. Konfigurasi yang Berubah

**`next.config.ts`** — Hapus `@prisma/client` dari `serverExternalPackages`:
```typescript
const nextConfig = {
  // ...
  serverExternalPackages: [], // @prisma/client sudah tidak ada
};
```

### 3.4. File yang Diupdate (15+ file)

Setiap file yang sebelumnya mengimpor `prisma` atau `PrismaClient` diubah sebagai berikut:

| File | Perubahan |
|------|-----------|
| `src/lib/auth.ts` | `import { supabase }` → `import { getSupabase }` |
| `src/lib/site-config.ts` | Semua fungsi pakai `getSupabase()` |
| `src/lib/rate-limit.ts` | `getSupabase()` di createRateLimiter & setInterval cleanup |
| `src/app/page.tsx` | `getSupabase()` di component level |
| `src/app/admin/dashboard/page.tsx` | `getSupabase()` di component level |
| `src/app/api/products/route.ts` | `getSupabase()` di handler GET/POST |
| `src/app/api/products/[id]/route.ts` | `getSupabase()` di handler GET/PUT/DELETE |
| `src/app/api/products/by-category/route.ts` | `getSupabase()` di handler GET |
| `src/app/api/products/renumber/route.ts` | `getSupabase()` di handler POST |
| `src/app/api/categories/route.ts` | `getSupabase()` di handler GET/POST/PUT/DELETE |
| `src/app/api/categories/renumber/route.ts` | `getSupabase()` di handler POST |
| `src/app/api/auth/forgot-password/route.ts` | `getSupabase()` di handler POST |
| `src/app/api/auth/reset-password/route.ts` | `getSupabase()` di handler POST |
| `src/app/api/auth/change-password/route.ts` | `getSupabase()` di handler POST |

### 3.5. Pola Penting: Lazy Initialization

**Masalah:** Jika Supabase client dibuat di level module (eager singleton), maka `process.env.SUPABASE_SERVICE_KEY` akan diakses saat **build time** di Vercel, padahal env var hanya tersedia saat **runtime**.

**Solusi:** Gunakan **lazy getter** (`getSupabase()`) yang hanya membuat instance saat benar-benar dipanggil.

```typescript
// ❌ SALAH — Eager singleton (throw error saat build)
export const supabase = createClient(url, key);

// ✅ BENAR — Lazy getter (hanya dipanggil saat runtime)
export function getSupabase() {
  if (!instance) {
    instance = createClient(url, key);
  }
  return instance;
}
```

### 3.6. File yang Dihapus

| File/Folder | Keterangan |
|-------------|------------|
| `prisma/` | Seluruh folder schema, migrations, seed |
| `src/lib/prisma.ts` | File singleton PrismaClient |

---

## 4. Environment Variables

### 4.1. Diperlukan di `.env.local` & Vercel

```
NEXT_PUBLIC_SUPABASE_URL=https://xczbowaotnvzduikgdad.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...
AUTH_SECRET=...
```

### 4.2. Catatan Penting

- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` harus ada di lokal **dan** Vercel.
- `SUPABASE_SERVICE_KEY` **hanya** untuk server-side (jangan bocorkan ke client). Di Vercel, ini harus diisi di Dashboard → Project Settings → Environment Variables.
- Variable dengan prefix `NEXT_PUBLIC_` akan di-inject saat build time.
- Variable tanpa prefix hanya tersedia saat runtime di server.

---

## 5. Troubleshooting Steps (Jika Masalah Terjadi Lagi)

### 5.1. Build Gagal di Vercel

```bash
# 1. Cek log build Vercel
vercel logs --all

# 2. Pastikan env var sudah diset di Vercel
#    Dashboard → Project → Settings → Environment Variables
#    Cek: SUPABASE_SERVICE_KEY, NEXT_PUBLIC_SUPABASE_URL

# 3. Pastikan tidak ada import Prisma yang tersisa
findstr /s "prisma" src\*.ts src\*.tsx

# 4. Pastikan tidak ada eager singleton
#    Cari pola "export const supabase" — seharusnya tidak ada
findstr /s "export const supabase" src\*.ts src\*.tsx
```

### 5.2. Localhost Gagal Load

```bash
# 1. Pastikan .env.local ada dan lengkap
# 2. Restart dev server (Ctrl+C, lalu npm run dev lagi)
# 3. Cek terminal untuk error message
# 4. Pastikan tidak ada file yang masih import 'prisma'
findstr /s "prisma" src\*.ts src\*.tsx
# 5. Pastikan pola getSupabase() digunakan dengan benar
#    (bukan import { supabase } tapi import { getSupabase })
```

### 5.3. Runtime Error: "SUPABASE_SERVICE_KEY is not set"

Ini berarti ada kode yang memanggil `getSupabase()` di saat env var belum tersedia, misalnya:
- Dipanggil di **build time** (misalnya di `generateMetadata` atau `generateStaticParams`)
- Dipanggil di **client component** (ingat: `SUPABASE_SERVICE_KEY` hanya ada di server)

**Solusi:** Pastikan `getSupabase()` hanya dipanggil di Server Components atau Route Handlers.

---

## 6. Lessons Learned

### 6.1. Prisma + Vercel = Tidak Disarankan

Prisma menggunakan binary engine native yang bermasalah dengan Vercel Lambda. Jika tetap ingin menggunakan Prisma:
- Gunakan `prisma generate --no-engine` (Data Proxy)
- Atau gunakan Prisma Accelerate (layanan berbayar)
- Atau deploy ke VPS/VDS yang memberikan akses penuh ke environment

### 6.2. Supabase JS Client adalah Alternatif yang Lebih Baik untuk Vercel

- Menggunakan REST API via HTTPS (port 443) — kompatibel dengan Vercel
- Tidak ada binary engine — murni JavaScript/TypeScript
- Row Level Security (RLS) built-in
- Lebih ringan di bundle size

### 6.3. Lazy Initialization adalah Best Practice

Selalu gunakan pola lazy getter untuk koneksi database atau client yang membutuhkan env vars:

```typescript
let instance: Client | null = null;
export function getClient(): Client {
  if (!instance) {
    const key = process.env.SECRET_KEY;
    if (!key) throw new Error("SECRET_KEY is not set");
    instance = new Client(key);
  }
  return instance;
}
```

### 6.4. Env Var Naming Convention

- `NEXT_PUBLIC_*` → Untuk variabel yang aman diakses client (build time)
- Tanpa prefix → Untuk server-side only (runtime)
- Jangan pernah mengekspos `SERVICE_KEY` atau secret ke client

---

## 7. Referensi

- [Supabase JS Client Documentation](https://supabase.com/docs/reference/javascript/introduction)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

> **Status:** ✅ SEMUA NORMAL — Localhost dan mebelonline.id berfungsi dengan baik.