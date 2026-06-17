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

### [2026-06-16] — Optimasi Produk & UI Fixes

#### Yang dilakukan:
1. **Landing page: Load More Products** — `src/app/page.tsx` + `src/components/landing/ProductGrid.tsx`
   - SSR awal hanya render 20 produk (ISR tetap jalan, super cepat)
   - Tombol "Muat Lainnya" fetch halaman berikutnya via API → append ke grid
   - Tombol hilang otomatis saat semua produk termuat
   - Hitungan produk: "Menampilkan 20 dari 85 produk"
2. **Admin produk: Pagination Server-Side** — `src/app/admin/dashboard/products/page.tsx`
   - Fetch 50 produk per halaman (dari sebelumnya limit=200 semua)
   - Navigasi halaman dengan prev/next + number buttons (max 7 tombol)
   - Halaman aktif terhighlight, total produk ditampilkan
3. **Komponen SocialIcon** — `src/components/shared/SocialIcon.tsx` (BARU)
   - Logo asli untuk Instagram, Facebook, Twitter, YouTube, TikTok, Shopee, Tokopedia
   - Deteksi otomatis dari nama platform (case-insensitive, support alias: "ig", "fb", dll)
   - Fallback ke huruf pertama jika platform tidak dikenal
   - ContactSection + Footer diperbarui pakai `<SocialIcon>`
4. **Fix Hero button "Tentang Kami"** — `src/components/landing/Hero.tsx`
   - Shadcn outline variant punya `bg-background` (putih) → timpa text putih
   - Tambah `bg-transparent` override agar background hero gelap tembus
5. **Navbar cleanup** — `src/components/landing/Navbar.tsx`
   - Hapus kategori produk dari navbar (Kursi, Meja, dll)
   - Navbar sekarang: Beranda, Katalog, Tentang, Kontak

#### Status:
- ✅ Build berhasil (0 error, 0 warning)
- ✅ Landing page: load more + pagination
- ✅ Admin produk: server-side pagination 50/halaman
- ✅ Social icon: logo asli Instagram, Facebook, TikTok, dll
- ✅ Hero button putih terlihat sekarang
- ✅ Navbar bersih tanpa kategori produk

### [2026-06-17] — UI Fixes: Hero animasi, WA link, flicker produk, reorder

#### Yang dilakukan:

**Hero Animation (Mewah & Elegan):**
1. **Word-by-word title** — setiap kata muncul bergantian dengan scale effect (ease custom `[0.25, 0.46, 0.45, 0.94]`)
2. **Decorative divider** — garis gradient oranye melebar dari tengah setelah title selesai
3. **Staggered CTA** — "Lihat Koleksi" muncul duluan, "Tentang Kami" 0.2s kemudian (scale effect)
4. **Responsive height** — `min-h-[80dvh]` di mobile, tetap `h-screen max-h-[900px]` di desktop (gambar tidak terpotong parah di HP)
5. **Timeline animasi:** Badge (0.2s) → Title kata/kata (0.4s+) → Garis dekoratif (0.85s) → Subtitle (0.9s) → Tombol 1 (1.2s) → Tombol 2 (1.4s)

**Product Flicker Fix (Mobile):**
1. **Hapus y-translate** dari entrance animation ProductCard — kard hanya fade-in tanpa geser
2. **Kurangi delay** `index * 0.1` → `Math.min(index * 0.05, 0.3)` — maks delay cuma 300ms
3. **Kurangi durasi** 0.5s → 0.4s
4. **Priority images** — 6 produk pertama `priority={true}` (tidak lazy-load)

**WA Link Refactor:**
1. **Utility baru** `src/lib/wa.ts` — `buildWaLink()` + `normalizeWaNumber()` (auto 08xx → 628xx)
2. **Semua komponen** (WhatsAppButton, ProductCard, ContactSection) pakai utility terpusat
3. **WA umum** (floating button & contact) — kirim pesan default
4. **WA per produk** — kirim pesan + `\n\nProduk: {nama}` — admin langsung tahu produk yang ditanyakan
5. **Admin settings** — tambah deskripsi field "Pesan Default WA" biar paham fungsinya

**Auto Reorder Produk:**
1. **POST /api/products** — auto-fill `sortOrder` dengan `max(sortOrder) + 1` → produk baru otomatis di akhir
2. **PUT /api/products/[id]** — saat `sortOrder` berubah, produk lain direnumber transaksional:
   - Naik ke posisi lebih awal → produk di antaranya digeser mundur (+1)
   - Turun ke posisi lebih akhir → produk di antaranya digeser maju (-1)
3. **Admin tabel** — tambah kolom "Urutan" yang menampilkan nomor
4. **Form tambah produk** — auto-fill `sortOrder` dengan angka tertinggi + 1

**Landing page sorting:** tetap `sortOrder: "asc"` + fallback `createdAt: "desc"`

#### Status:
- ✅ Build berhasil (0 error)
- ✅ Commit & push: `be90816`
- ✅ Semua WA link konsisten (utility terpusat)
- ✅ Auto renumber produk saat urutan diubah
- ✅ Hero lebih mewah, responsif, tanpa crop berlebihan di HP
- ✅ Produk tidak flicker/geser saat scroll mobile

1. **Prisma v6 (bukan v7)** — v7 ubah format konfigurasi secara drastis, pilih v6 yang lebih stabil
2. **SQLite untuk development** — gampang, file-based. PostgreSQL via Supabase untuk production
3. **Credentials-only auth** — single admin, no OAuth
4. **JWT 30 menit** — stateless, no refresh token
5. **requireAdmin() pattern** — proteksi API via helper, bukan middleware (karena NextAuth middleware hanya proteksi page)
6. **Database-based rate limiter** — tadinya in-memory (hilang saat restart), sekarang pindah ke tabel `RateLimit` di Prisma. Cocok untuk Vercel serverless. Fail open jika DB error.
7. **GitHub/Vercel/Supabase akun klien** — semuanya pake akun terpisah dari developer (ownership jelas untuk handover)
8. **Status .env:**
   - ✅ `DATABASE_URL` + `DIRECT_URL` — PostgreSQL Supabase (SQLite untuk dev lokal)
   - ✅ `NEXT_PUBLIC_SUPABASE_URL` + `keys` — Supabase Storage
   - ⚠️ `RESEND_API_KEY` — masih placeholder
   - ⚠️ `AUTH_SECRET` — masih placeholder (generate ulang sebelum production)
9. **Field `variants` di Product** — JSON field, fleksibel untuk tipe varian berbeda tiap produk. Struktur: `[{ type, name, options: [{ label, value, hex?, image? }] }]`
10. **Database switching .env** — file `.env` sudah berisi kedua konfigurasi (SQLite & PostgreSQL), tinggal comment/uncomment. `schema.prisma` juga perlu ganti provider `sqlite` ↔ `postgresql` + `npx prisma generate`

---

### [2026-06-17] — Feat: Varian Selector (Color, Size, Material) di Product Card

#### Yang dilakukan:

**Data Model:**
1. **Prisma schema** — tambah field `variants String?` (JSON) di model Product
2. **Migration file** — `prisma/migrations/20260617120024_add_variants/migration.sql`
   - SQL: `ALTER TABLE "Product" ADD COLUMN "variants" TEXT`
3. **Types** — `VariantOption`, `ProductVariant` interface di `src/types/index.ts`, update `ProductWithCategory`
4. **API routes** — parse `variants` JSON di GET, simpan di POST/PUT (handler sudah ada)

**UI — Variant Picker:**
1. **`ProductVariantPicker.tsx`** (BARU) — komponen reuseable:
   - **Color type** → circle swatches (24px, ring-2 brand-maroon saat selected, animasi scale)
   - **Size/Material/Text type** → pill button (filled maroon saat selected, outline saat idle)
   - Aksesibilitas: `aria-label`, keyboard navigable
2. **`ProductCard.tsx`** — integrasi variant picker di bawah deskripsi:
   - WA message otomatis sertakan varian yang dipilih: `\nVarian: Warna=Coklat, Ukuran=M`
   - Default pilih opsi pertama setiap grup

**Admin — Kelola Varian:**
1. **`products/page.tsx`** — section "Varian Produk" di dialog create/edit:
   - Tombol "Tambah Varian" → inline form: nama grup + pilih tipe (color/size/material/text)
   - Tiap grup menampilkan options sebagai chips dengan preview warna
   - Tombol "Tambah opsi" → inline form: label + hex color (khusus color) + preview
   - Hapus grup/opsi via tombol X

**Bug Fixes:**
1. 🔴 **API PUT jalur renumber tidak simpan field lain** — saat `sortOrder` berubah, hanya sortOrder yang diupdate. Semua field (variants, name, description, dll) ikut hilang. Diperbaiki dengan update semua field di dalam `$transaction`.
2. 🔴 **`prompt()` tidak didukung Turbopack** — ganti prompt JavaScript dengan inline form proper (input + select + tombol simpan/batal)

#### File Baru:
- `src/components/landing/ProductVariantPicker.tsx`
- `prisma/migrations/20260617120024_add_variants/migration.sql`
- `prisma/migrations/migration_lock.toml`

#### File Diubah:
- `prisma/schema.prisma` — +variants field
- `src/types/index.ts` — +VariantOption, ProductVariant
- `src/app/page.tsx` — parse variants di SSR
- `src/app/api/products/route.ts` — handle variants
- `src/app/api/products/[id]/route.ts` — handle variants + fix renumber bug
- `src/components/landing/ProductCard.tsx` — integrasi variant picker
- `src/app/admin/dashboard/products/page.tsx` — UI kelola varian

#### Status:
- ✅ Branch: `feature/variant-selector` (terpisah dari master)
- ✅ Build: TypeScript clean (0 error)
- ✅ Database: SQLite siap testing, PostgreSQL via migration
- ⚠️ Migration belum dijalankan ke Supabase — perlu `npx prisma migrate deploy` saat DB reachable
- ⚠️ Seed data belum punya variants (data masih dari seed lama)
- ⚠️ Database switch antara SQLite & PostgreSQL perlu manual .env + schema.provider

---

### [2026-06-17] — Perbaikan Hero, Flicker Produk, WA Link, Optimasi Admin

#### Yang dilakukan:

**Hero 1 — Animasi Mewah:**
1. **Word-by-word title** — setiap kata muncul bergantian dengan scale effect
2. **Decorative divider** — garis gradient oranye melebar dari tengah
3. **Staggered CTA** — "Lihat Koleksi" dulu, "Tentang Kami" 0.2s kemudian
4. Semua animasi pakai ease custom `[0.25, 0.46, 0.45, 0.94]`
5. Reduced motion tetap dihormati

**Hero 2 — Fix Cropping HP & Kembali Full Screen:**
1. Balik ke `h-screen` full
2. `object-position: 65% 50%` — gambar tidak terpotong kanan

**Product Flicker Fix (Final — v2):**
1. **No opacity in animation** — `motion.div` hanya `y: 40→0` + `scale: 0.88→1` (tanpa opacity = tanpa flash)
2. **GPU compositing** — class `gpu-layer` (`backface-visibility: hidden`) cegah flicker compositor di mobile
3. **`transition-all` dihapus** — diganti `transition-shadow` agar tidak berebut transform dgn framer-motion
4. **Trigger lebih awal** — viewport margin `-50px` biar animasi mulai sebelum kard masuk layar
5. **Perbesar efek** — `y: 40` + `scale: 0.88` biar terasa elegan saat scroll
6. **Stagger ringan** — `delayMs` max 200ms per kard
7. 6 produk pertama `priority={true}` (tidak lazy-load)
8. Reduced motion: skip semua animasi via `useReducedMotion()`

**WA Link Refactor:**
1. Utility baru `src/lib/wa.ts` — `buildWaLink()` + `normalizeWaNumber()` (auto 08xx → 628xx)
2. Semua WA komponen pakai utility terpusat
3. WA per produk kirim `\n\nProduk: {nama}` — admin tahu produk ditanyakan
4. Admin settings: deskripsi field Pesan Default WA

**Auto Reorder Produk:**
1. `POST /api/products/renumber` — beri nomor 1,2,3... ke semua produk
2. `PUT /api/products/[id]` — renumber transaksional saat sortOrder berubah
3. Admin tabel: kolom "Urutan"
4. Form tambah: auto-fill `maxSort + 1`
5. Form edit: **sortOrder dari posisi tabel** (bukan dari DB)

**Edit Kategori — Daftar Produk:**
1. Endpoint baru `GET /api/products/by-category` — ringan
2. Dialog edit kategori tampilkan daftar produk + nomor urut

**Optimasi Loading Admin:**
1. Dashboard: `force-dynamic` → `revalidate = 60`
2. Endpoint `by-category` tanpa count/JSON.parse/auth berulang

#### File Baru:
- `src/lib/wa.ts`
- `src/app/api/products/renumber/route.ts`
- `src/app/api/products/by-category/route.ts`

#### Status:
- ✅ Build berhasil (0 error)
- ✅ Push: `be90816`..`87dcceb` (11 commits)
- ✅ WA link konsisten & auto-format nomor
- ✅ Produk tidak flicker saat scroll
- ✅ Hero full screen + animasi mewah
- ✅ Admin loading lebih cepat
- ✅ Nomor urut produk di tabel & form edit

---

### [2026-06-17] — Final Fix: Sinkronisasi Sort Order (Produk & Kategori)

#### Yang dilakukan:

**Masalah:** SortOrder tidak sinkron di 3 tempat (admin produk, admin kategori, landing page). Seed semua 0, openEdit pakai posisi filter (salah), kategori tidak punya renumber logic.

**Perbaikan (8 file):**

1. **`prisma/seed.ts`** — Produk seed diberi `sortOrder: i + 1` (1–16), sebelumnya semua 0.

2. **`src/app/api/products/route.ts`** — POST auto-fill: jika sortOrder 0 atau tidak dikirim, backend hitung `max + 1`. Produk baru otomatis di akhir.

3. **`src/app/admin/dashboard/products/page.tsx`** — Fix 2 bug:
   - `openEdit`: pakai `product.sortOrder` **asli dari database** (sebelumnya pakai `filteredProducts.findIndex()` yang salah saat ada search filter)
   - `openCreate`: kirim `sortOrder: 0` → backend auto-fill (sebelumnya hitung max dari page saat ini, rawan duplikat)

4. **`src/app/api/categories/route.ts`** — POST auto-fill: jika 0, hitung `max + 1` (sama seperti produk).

5. **`src/app/api/categories/route.ts`** — PUT renumber logic BARU: saat sortOrder kategori berubah, kategori lain di antaranya otomatis bergeser naik/turun dalam `$transaction` — logika identik dengan produk.

6. **`src/app/api/categories/renumber/route.ts`** — Endpoint BARU: `POST /api/categories/renumber` — beri nomor urut 1,2,3... ke semua kategori.

7. **`src/app/admin/dashboard/categories/page.tsx`** — Tambah tombol "Urutkan Ulang" + helper text pada field urutan.

8. **Landing page** — Tidak perlu diubah. Sudah benar `orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]` + `revalidate: 60`, perubahan admin otomatis tampil.

#### Status:
- ✅ Build berhasil (0 error, 0 warning)
- ✅ Seed produk urut 1–16 (bukan 0 semua)
- ✅ POST produk/kategori auto-fill jika 0
- ✅ Edit produk → renumber otomatis (geser naik/turun)
- ✅ Edit kategori → renumber otomatis (geser naik/turun) — **BARU**
- ✅ Renumber endpoint untuk kategori — **BARU**
- ✅ UI kategori: tombol "Urutkan Ulang" — **BARU**
- ✅ Admin produk: openEdit pakai nilai asli DB, bukan posisi filter
- ✅ Landing page: tetap sinkron via ISR
- ⚠️ Untuk produk yang sudah ada (sortOrder masih 0), jalankan "Urutkan Ulang" di admin

---

### [2026-06-17] — Image Uploader Redesign + Auto-Delete Foto Lama

#### Yang dilakukan:

**UX Form — Admin Produk & Settings:**
1. **`ImageUploader.tsx` (BARU)** — komponen preview visual besar (aspect 4:3):
   - Empty state: dashed border + icon + "Klik untuk upload gambar"
   - Ada gambar: preview penuh, hover overlay "Ganti Foto"
   - Loading upload: spinner overlay
   - Drag-drop area (visual feedback saat dragging)
   - Input URL dan tombol upload kecil **dihapus total**
2. **`products/page.tsx`** — ganti input URL + tombol kecil → `<ImageUploader>`
3. **`settings/page.tsx`** — ganti di 3 tempat (logo, hero, tentang) → `<ImageUploader>`

**Auto-Delete Foto Lama — Hemat Storage:**
4. **`src/lib/upload.ts`** — fungsi `deleteFromSupabase(url)` BARU — hapus file dari Supabase Storage via REST API
5. **`PUT /api/products/[id]`** — setelah update DB sukses, hapus foto lama jika image berubah (kedua code path: renumber & biasa)
6. **`DELETE /api/products/[id]`** — sebelum hapus record, hapus `image` + semua `images[]` dari Supabase
7. **`PUT /api/settings`** — hapus foto lama untuk `site_logo`, `hero_image`, `about_image` jika berubah

**Fix Kategori Select:**
8. **`products/page.tsx`** — `<SelectValue>` nampilkan raw UUID → diperbaiki nampilkan **nama kategori** yang dipilih (via `categories.find()`)

**File Baru:**
- `src/components/admin/ImageUploader.tsx` — komponen upload + preview visual

#### Status:
- ✅ Build berhasil (0 error)
- ✅ Preview visual besar di admin produk & settings
- ✅ Input URL & tombol kecil dihapus dari admin
- ✅ Foto lama auto-terhapus saat diganti (produk & settings)
- ✅ Foto lama auto-terhapus saat produk dihapus
- ✅ Select kategori nampilkan nama, bukan UUID

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
- Database: `prisma/dev.db` (SQLite) atau PostgreSQL (Supabase)
- Prisma Studio: `npx prisma studio`
- Build: `npm run build`
- Seed ulang: `npx tsx prisma/seed.ts`
- Git branch fitur: `feature/variant-selector`
- Migration file: `prisma/migrations/20260617120024_add_variants/migration.sql`
- Database switching: `.env` ganti DATABASE_URL + schema.prisma ganti provider (sqlite ↔ postgresql)
