# Context.md — Riwayat & Status Proyek

> File ini adalah **log riwayat** proyek. SETIAP SESI BARU WAJIB baca file ini
> sebelum mulai bekerja agar tahu perubahan terakhir, keputusan yang sudah dibuat,
> dan apa yang masih pending.
>
> Update file ini setiap kali ada perubahan signifikan (fitur baru selesai,
> perubahan arsitektur, pergantian dependency, masalah yang ditemukan).

---

## Ringkasan Proyek

**Nama:** Muara Teweh — Landing Page Toko Furnitur + Admin Dashboard
**Tech Stack:** Next.js 15 (latest), TypeScript, Tailwind CSS v4, shadcn/ui, Prisma 6 (PostgreSQL via Supabase), NextAuth.js v5, Resend, Framer Motion 12, Lucide React
**Deploy:** Vercel (akun klien) + Supabase (Singapore) + GitHub
**Status:** ✅ Production — build berhasil (21 halaman) — Terdeploy di Vercel
**URL Production:** https://mebel-online.vercel.app
**GitHub:** https://github.com/mebelonline-projek/Mebel-online
**Supabase:** xczbowaotnvzduikgdad (Singapore)
**Akun Vercel/GitHub/Supabase:** Klien (terpisah dari akun pribadi developer)

---

## Riwayat Perubahan

### [2026-06-16] — Init proyek & landing page + admin dashboard

#### Yang dilakukan:
1. **Init Next.js 15** — App Router, TypeScript, Tailwind CSS, src directory
2. **Install dependencies** — Prisma, NextAuth v5, Resend, Framer Motion, React Hook Form, Zod, Lucide, shadcn/ui
3. **Setup shadcn/ui** — 18 komponen UI
4. **Setup branding** — Font (Inter, Fredoka, Poppins), warna (Maroon #B31324, Orange #F5A300, Cream #FDF8F5)
5. **Database schema (Prisma)** — Admin, PasswordResetToken, Category, Product, SiteConfig
6. **API routes** — auth, products, categories, settings, upload
7. **Landing page komponen** — Navbar, Hero, ProductCard, ProductGrid, AboutSection, ContactSection, Footer, WhatsAppButton
8. **Admin dashboard** — Sidebar, Header, Login, Forgot/Reset Password, Dashboard overview, Products CRUD, Categories CRUD, Settings, Profile
9. **Setup brand warna di globals.css**
10. **Middleware** — proteksi route admin
11. **Seed data** — admin default + 5 kategori + 15 produk + site config

### [2026-06-16] — Phase 4: Polish (Security, SEO, Accessibility, Error Handling, Documentation)

#### Yang dilakukan:

**Security:**
1. **API Auth Middleware** — `src/lib/api-auth.ts` (helper `requireAdmin()`)
   - Proteksi semua endpoint POST/PUT/DELETE di: products, categories, settings, upload
   - Proteksi GET products dengan `?all=true` (produk non-aktif)
   - Public GET tetap terbuka (landing page)
2. **Fix Profile Password Change** — endpoint baru `POST /api/auth/change-password`
   - Verifikasi current password sebelum update (bcrypt)
   - Profile page diubah dari fake token ke endpoint baru
3. **Rate Limiting** — `src/lib/rate-limit.ts`
   - Forgot password: 3 request / 15 menit per IP
   - Reset password: 5 request / 15 menit per IP
4. **AUTH_SECRET guidance** — `.env.example` diperbaiki dengan instruksi generate
5. **CSRF documentation** — dicatat di SECURITY-CHECKLIST.md

**SEO:**
1. **ISR fix** — hapus `force-dynamic`, biarkan `revalidate = 60` (ISR aktif)
2. **Dynamic Metadata** — `generateMetadata()` di page.tsx baca dari DB settings
3. **OpenGraph dinamis** — pakai hero_image dari settings
4. **Sitemap** — `src/app/sitemap.ts`
5. **Robots.txt** — `src/app/robots.ts` (allow /, disallow /admin/)
6. **JSON-LD Structured Data** — LocalBusiness schema inline di landing page

**Accessibility:**
1. **Reduced Motion** — `useReducedMotion()` dari Framer Motion di semua 7 landing components
   - Nonaktifkan parallax, slide, scale animation saat prefers-reduced-motion
   - WhatsAppButton pulse ring disembunyikan
   - Scroll indicator infinite bounce dinonaktifkan
2. **Aria Labels** — Navbar (aria-label, aria-expanded), ProductGrid (aria-pressed), Scroll indicator (role, tabIndex, keydown)
3. **Keyboard Navigation** — Navbar mobile sheet focusable, scrollToSection pindahkan focus
4. **Focus Management** — Setelah scroll, focus pindah ke heading section (tabindex -1 + focus())

**Animation & Polish:**
1. **Error Boundaries** — `src/components/ErrorBoundary.tsx` + `ErrorFallback.tsx`
   - Wrap dashboard children dengan ErrorBoundary
   - Fallback UI dengan retry button
   - Development mode: tampilkan error message
2. **Loading States** — `src/app/loading.tsx` + `src/app/admin/dashboard/loading.tsx`
3. **Admin Tab Titles** — Dashboard layout metadata diperbaiki

**Dokumentasi:**
1. **ARCHITECTURE.md** — diisi semua section (tech stack, data flow, modul, ADR, naming, scope boundary)
2. **DEPENDENCIES.md** — dicatat semua dependency beserta fungsi dan alasan
3. **SECURITY-CHECKLIST.md** — diupdate dengan checklist terproteksi

#### Status:
- ✅ Build berhasil (17 halaman, 0 error, 0 warning)
- ✅ API routes terproteksi (requireAdmin)
- ✅ Rate limiting aktif di auth endpoints
- ✅ Profile password change sudah benar
- ✅ SEO: dynamic metadata, sitemap, robots, JSON-LD, ISR
- ✅ Accessibility: reduced motion, aria labels, keyboard nav, focus management
- ✅ Error boundaries + loading states
- ✅ Dokumentasi arsitektur dan dependency lengkap
- ⚠️ Gambar placeholder dari Unsplash (setting di seed), user bisa upload sendiri via Supabase
- ⚠️ Upload gambar butuh setup Supabase Storage (.env)
- ⚠️ Email reset password butuh setup Resend (.env)
- ⚠️ Supabase dan Resend masih placeholder — fitur email dan upload tidak akan berfungsi tanpa API key nyata
- ⚠️ AUTH_SECRET masih placeholder — generate ulang sebelum production

### [2026-06-16] — Deployment & Bug Fixes

#### Yang dilakukan:

**Infrastructure Setup:**
1. **GitHub** — repository baru di akun klien (`mebelonline-projek/Mebel-online`)
2. **Supabase** — PostgreSQL database + Storage bucket `furniture-images` (public read policy)
3. **Vercel** — deploy akun klien, environment variables untuk Supabase & NextAuth
4. **Prisma migration** — SQLite → PostgreSQL, tambah `DIRECT_URL` untuk direct connection

**Upgrades:**
1. **Next.js upgrade** — 15.2.4 → latest (fix celah keamanan CVE-2025-66478)
2. **Middleware fix** — ekspor diubah jadi `export const middleware = auth` (format Next.js terbaru)

**Bug Fixes (🔴 kritis):**
1. **ImageUpload onChange salah** — baris 132 settings page: input text pakai `onChange` yang akses `e.target.files`, diganti ke `e.target.value` + tambah `onChange` prop
2. **GET /api/settings publik** — siapa pun bisa baca semua settings toko, sekarang diproteksi `requireAdmin()`
3. **Rate limiter in-memory** — data hilang tiap server restart (Vercel serverless). Pindah ke database Prisma (tabel `RateLimit` baru + auto-cleanup setiap 5 menit)

**Database Schema:**
- Model `RateLimit` baru — `identifier`, `action`, `count`, `expiresAt`
- Unique constraint `[identifier, action]`
- Index on `expiresAt` untuk cleanup

#### Status:
- ✅ Deployed ke Vercel akun klien
- ✅ Database PostgreSQL + seed data
- ✅ Storage Supabase aktif (upload gambar jalan)
- ✅ API settings terproteksi
- ✅ Rate limiter persistent (database-based)
- ✅ Next.js versi terbaru (aman)
- ⚠️ Resend API key masih placeholder — fitur lupa password belum bisa
- ⚠️ Rate limiter fail open — kalau DB error, request tetap diizinkan (safety)

1. **Prisma v6 (bukan v7)** — v7 ubah format konfigurasi secara drastis, pilih v6 yang lebih stabil
2. **SQLite untuk development** — gampang, file-based. PostgreSQL via Supabase untuk production
3. **Credentials-only auth** — single admin, no OAuth
4. **JWT 30 menit** — stateless, no refresh token
5. **requireAdmin() pattern** — proteksi API via helper, bukan middleware (karena NextAuth middleware hanya proteksi page)
6. **Database-based rate limiter** — tadinya in-memory (hilang saat restart), sekarang pindah ke tabel `RateLimit` di Prisma. Cocok untuk Vercel serverless. Fail open jika DB error.
7. **GitHub/Vercel/Supabase akun klien** — semuanya pake akun terpisah dari developer (ownership jelas untuk handover)
8. **Status .env:**
   - ✅ `DATABASE_URL` + `DIRECT_URL` — PostgreSQL Supabase
   - ✅ `NEXT_PUBLIC_SUPABASE_URL` + `keys` — Supabase Storage
   - ⚠️ `RESEND_API_KEY` — masih placeholder
   - ⚠️ `AUTH_SECRET` — masih placeholder (generate ulang sebelum production)

---

## Aturan Sesi Baru

1. **Baca `context.md` ini dulu** — sebelum mulai coding, baca seluruh file ini
2. **Baca `CLAUDE.md`** — untuk aturan keamanan dan struktur kode
3. **Jangan ubah `context.md` tanpa konfirmasi** — perubahan besar harus dicatat, tapi tanya dulu
4. **Update `context.md` setelah perubahan signifikan** — fitur baru selesai, dependency berubah, arsitektur berubah
5. **Kalau ada error build, catat di sini** — biar tidak dikerjakan ulang di sesi lain

---

## Dependency Log

> Lihat `DEPENDENCIES.md` untuk detail tiap package.
>
> Quick list: next@15.2.4, react@19, prisma@6, next-auth@5 beta, framer-motion, resend, zod, lucide-react, shadcn/ui, tailwindcss v4, sonner, bcryptjs, tsx

---

## 🔗 Tautan Penting

- Dev server: `http://localhost:3000` (atau port berikutnya jika 3000 dipakai)
- Landing page: `/`
- Admin login: `/admin/login`
- Admin dashboard: `/admin/dashboard`
- Database: `prisma/dev.db` (SQLite)
- Prisma Studio: `npx prisma studio`
- Build: `npm run build`
- Seed ulang: `npx tsx prisma/seed.ts`
