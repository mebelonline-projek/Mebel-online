# Changelog

Semua perubahan signifikan pada proyek Mebel Online akan dicatat di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

---

## [Unreleased]

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
- Perbaikan keamanan