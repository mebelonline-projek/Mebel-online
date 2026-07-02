# 📋 Ringkasan Troubleshooting & Migrasi

> **Proyek:** Mebel Online (Next.js 15.5.19, App Router)
> **Domain:** mebelonline.id
> **Supabase Project:** xczbowaotnvzduikgdad (ap-southeast-1)
> **Cloudflare Worker:** https://mebelonline.mebelonline.workers.dev
> **GitHub:** https://github.com/mebelonline-projek/Mebel-online
> **Update Terakhir:** 2 Juli 2026

---

## 🚀 MIGRASI 2: Vercel → Cloudflare Workers (2 Juli 2026)

### Status: ✅ DEPLOY BERHASIL — ⚠️ Gambar/Logo Belum Tampil

Worker live di: **`https://mebelonline.mebelonline.workers.dev`**

### Alasan Migrasi
- Vercel Hobby plan **melarang penggunaan komersial** — proyek ini untuk klien
- Vercel image optimization quota hampir habis (3800/5000)
- Cloudflare Pages free tier mengizinkan komersial + unlimited bandwidth

### Yang Berhasil Dilakukan

| Langkah | Status | Detail |
|---|---|---|
| Install `@opennextjs/cloudflare` + `wrangler` | ✅ | v1.20.1 + v4.106.0 |
| Hapus `sharp` dari dependencies | ✅ | Tidak kompatibel dengan Cloudflare Workers (native module) |
| Update `src/lib/upload.ts` | ✅ | Hapus import sharp, upload langsung tanpa konversi WebP server-side |
| Update `src/lib/supabase-image-loader.ts` | ✅ | Generate URL Supabase Image Transformation (`/render/image/public/...?format=webp&quality=85`) |
| Update `next.config.ts` | ✅ | Tambah `output: "standalone"`, hapus `outputFileTracingRoot` |
| Update `package.json` | ✅ | Hapus `postinstall`, tambah scripts `cf-build`, `cf-dev`, `cf-deploy` |
| Buat `wrangler.toml` | ✅ | Workers config: `workers_dev = true`, `[assets]`, `[vars]` |
| Buat `.dev.vars` | ✅ | Environment variables untuk wrangler dev (secrets) |
| Build OpenNext | ✅ | 21 halaman, 0 error TypeScript |
| Deploy ke Cloudflare Workers | ✅ | `npx wrangler deploy` — Worker live |
| Set environment variables | ✅ | Via `[vars]` di wrangler.toml + `.dev.vars` (secrets) |
| Push ke GitHub | ✅ | Semua kode aman di GitHub |

### File yang Berubah

| File | Perubahan |
|---|---|
| `wrangler.toml` | BARU — Workers config (`workers_dev = true`, `[assets]`, `[vars]`) |
| `open-next.config.ts` | BARU — Auto-generated oleh OpenNext |
| `.dev.vars` | BARU — Secrets untuk wrangler dev |
| `src/lib/upload.ts` | Hapus `import sharp`, hapus `convertToWebp()`, upload langsung |
| `src/lib/supabase-image-loader.ts` | Generate URL Supabase Image Transformation |
| `src/lib/image-compression.ts` | Update komentar (flow tetap sama) |
| `next.config.ts` | Tambah `output: "standalone"`, hapus Vercel-specific |
| `package.json` | Hapus `sharp`, hapus `postinstall`, tambah `cf-*` scripts |
| `.gitignore` | Tambah `.open-next/`, `.wrangler/`, `.dev.vars` |

### ⚠️ MASALAH YANG BELUM DIPERBAIKI

**Semua foto dan logo tidak tampil di website.**

Kemungkinan penyebab:
1. **Supabase Image Transformation belum diaktifkan** — Perlu enable di Supabase Dashboard → Storage → Settings
2. **Image loader URL format salah** — Perlu verifikasi format URL `/render/image/public/` vs `/storage/v1/object/public/`
3. **CORS issue** — Supabase Storage mungkin perlu konfigurasi CORS untuk domain workers.dev
4. **Environment variables tidak terbaca** — Perlu cek apakah `NEXT_PUBLIC_*` vars benar-benar tersedia di client-side

### Cara Deploy Ulang

```bash
# 1. Build
npm run cf-build

# 2. Deploy
npx wrangler deploy

# 3. Push ke GitHub (backup)
git add .
git commit -m "pesan commit"
git push origin master
```

### Environment Variables

**Semua variable di-set via Cloudflare Dashboard → Build Settings → Variables and secrets:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
- `RESEND_FROM_EMAIL`
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- `AUTH_URL`

**`.dev.vars` (hanya untuk local dev `wrangler dev`):**
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- `AUTH_URL`
- `RESEND_API_KEY`

> **PENTING:** Jangan gunakan `[vars]` di `wrangler.toml` karena akan membuat duplikasi
> di Worker Settings → Variables and secrets (tampil 2 halaman di Dashboard).

---

## 📜 MIGRASI 1: Prisma → Supabase JS Client (22 Juni 2026)

### Status: ✅ SELESAI

### Masalah Awal
Vercel deployment gagal karena Prisma binary engine incompatible + PostgreSQL wire protocol diblokir.

### Solusi
Hapus Prisma ORM, gunakan `@supabase/supabase-js` (REST API via HTTPS port 443).

### File yang Berubah
- `src/lib/supabase.ts` — BARU (lazy getter pattern)
- 15+ file API routes & components — Update import dari `prisma` ke `getSupabase()`
- `prisma/` folder — DIHAPUS
- `src/lib/prisma.ts` — DIHAPUS

### Pola Penting: Lazy Initialization
```typescript
// ✅ BENAR — Lazy getter
let instance: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!instance) {
    instance = createClient(url, key);
  }
  return instance;
}
```

---

## 📝 Catatan Penting

### Supabase Image Transformation
- Menggunakan engine `libvips` (sama dengan sharp) — kualitas identik
- URL format: `{supabaseUrl}/render/image/public/{bucket}/{path}?width=X&format=webp&quality=Y`
- Transformasi di-cache di CDN Supabase
- Gambar lama (sudah WebP dari sharp) tetap kompatibel

### Cloudflare Workers vs Pages
- **Workers** = deploy via `wrangler deploy` dari laptop, dapat URL `.workers.dev`
- **Pages** = deploy via Git integration, dapat URL `.pages.dev`
- Proyek ini pakai **Workers** karena lebih fleksibel untuk Next.js SSR

### Keamanan
- `.dev.vars` berisi secrets — JANGAN di-push ke GitHub (sudah di `.gitignore`)
- `SUPABASE_SERVICE_KEY` hanya untuk server-side
- `NEXT_PUBLIC_*` aman untuk client-side

---

## 🔗 Referensi

- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Image Transformations](https://supabase.com/docs/guides/storage/image-transformations)
- [OpenNext Cloudflare](https://opennextjs.org/cloudflare)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)