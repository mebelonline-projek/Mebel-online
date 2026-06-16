# ARCHITECTURE.md

> Dokumen ini adalah "peta" proyek. WAJIB diupdate setiap kali ada perubahan
> struktural besar (modul baru, perubahan flow data, library inti baru).
> Tujuannya: AI (dan manusia) baru yang masuk ke proyek bisa paham konteks
> tanpa membaca ribuan baris kode dulu.

---

## 1. Tech Stack

| Layer        | Teknologi | Alasan dipilih |
|--------------|-----------|----------------|
| Runtime      | Node.js 20+ | LTS, stabil |
| Framework    | Next.js 15.2.4 (App Router) | React server components, ISR, routing terstruktur |
| Database     | SQLite (dev) / PostgreSQL (prod via Supabase) | SQLite: zero-config untuk dev. PostgreSQL: production-grade |
| ORM/Query    | Prisma 6 | Type-safe, migration mudah, relasi jelas |
| UI Framework | Tailwind CSS v4 + shadcn/ui | Utility-first CSS, komponen reusable, kustomisasi brand |
| Auth         | NextAuth v5 beta (Credentials, JWT) | Integrasi seamless dengan Next.js, middleware support |
| Email        | Resend | API sederhana, deliverability tinggi |
| Animasi      | Framer Motion 12 + Lucide React | Performa baik, API deklaratif, aksesibilitas via useReducedMotion |
| Validation   | Zod 4 | TypeScript-first, inferensi tipe otomatis |
| Deployment   | (TBD) | Belum ditentukan |

---

## 2. Diagram Alur Data (High Level)

```
[Client/Browser]
      │
      ├── Landing Page (/)
      │     └── Server Component → Prisma → SQLite
      │         └── ISR (revalidate: 60 detik)
      │
      ├── Admin Dashboard (/admin/dashboard/*)
      │     ├── NextAuth Middleware → proteksi session
      │     ├── Client Component → fetch API → Route Handler
      │     └── API Route → requireAdmin() → Prisma → SQLite
      │
      ├── Admin Auth (/admin/login, /admin/forgot-password, ...)
      │     └── NextAuth Credentials → bcrypt → Prisma/Admin
      │
      └── API (/api/*)
            ├── Public: GET /api/products (active only), GET /api/settings, GET /api/categories
            └── Protected (requireAdmin):
                  ├── POST/PUT/DELETE /api/products, /api/categories, /api/settings
                  ├── POST /api/upload → Supabase Storage
                  └── POST /api/auth/change-password
```

---

## 3. Modul/Domain yang Ada

| Modul       | Tanggung Jawab | File Utama | Status |
|-------------|----------------|------------|--------|
| landing     | Landing page publik (hero, produk, tentang, kontak, footer) | `src/app/page.tsx`, `src/components/landing/*` | ✅ |
| admin       | Admin dashboard, sidebar, header | `src/app/admin/dashboard/*`, `src/components/admin/*` | ✅ |
| auth        | Login, logout, session, JWT, ganti/reset password | `src/lib/auth.ts`, `src/lib/auth.config.ts`, `src/app/api/auth/*` | ✅ |
| products    | CRUD produk, public listing dengan filter | `src/app/api/products/*`, halaman produk di dashboard | ✅ |
| categories  | CRUD kategori, public filter | `src/app/api/categories/route.ts`, halaman kategori | ✅ |
| settings    | Site settings key-value CRUD (brand, konten, WA, sosial media) | `src/app/api/settings/route.ts`, `src/lib/site-config.ts` | ✅ |
| upload      | File upload ke Supabase Storage | `src/app/api/upload/route.ts`, `src/lib/upload.ts` | ✅ |

---

## 4. Keputusan Arsitektur Penting (ADR ringkas)

**[2026-06-16] — Pilih Prisma v6 daripada v7**
- Alasan: v7 mengubah format konfigurasi secara drastis (prisma.config.ts, adapter-based). v6 lebih stabil dan well-documented.
- Trade-off: perlu migrasi ke v7 di masa depan jika v6 deprecate.

**[2026-06-16] — SQLite untuk dev, PostgreSQL via Supabase untuk prod**
- Alasan: SQLite file-based, zero config untuk development cepat.
- Trade-off: ada perbedaan fitur (misal: JSON support, array type) yang perlu diperhatikan saat migrasi.

**[2026-06-16] — Credentials-only auth (tanpa OAuth)**
- Alasan: single admin user, tidak perlu social login. Sederhana dan aman.
- Trade-off: tidak ada opsi "login with Google", registrasi publik tidak ada.

**[2026-06-16] — JWT session strategy (30 menit expiry)**
- Alasan: stateless, cocok untuk single-server, tidak perlu database session.
- Trade-off: tidak bisa revoke session secara individual (tanpa blacklist).

**[2026-06-16] — Tailwind v4 (CSS-first config)**
- Alasan: performa lebih baik dari v3, native CSS nesting, @theme directive lebih bersih.
- Trade-off: beberapa plugin v3 belum kompatibel, perlu migrasi CSS.

**[2026-06-16] — API route authentication via requireAdmin() helper**
- Alasan: NextAuth middleware hanya proteksi halaman, bukan API. Helper reusable mencegah duplikasi auth check.
- Trade-off: setiap route handler perlu manual call requireAdmin(). Alternatif: middleware pattern untuk semua /api/.

**[2026-06-16] — In-memory rate limiter (Map-based)**
- Alasan: cukup untuk single-server deployment. Tidak perlu Redis untuk dev.
- Trade-off: state hilang saat restart server. Untuk production multi-instance, ganti dengan Redis.

---

## 5. Konvensi Penamaan

- File: `kebab-case.ts` untuk utilities, `PascalCase.tsx` untuk komponen React.
- Komponen React: `PascalCase.tsx`.
- Database table: `PascalCase` (mengikuti Prisma convention).
- Environment variable: `UPPER_SNAKE_CASE`.
- Route: `kebab-case` (App Router).

---

## 6. Hal yang SENGAJA Belum Dibuat (Scope Boundary)

- **Tidak ada halaman detail produk** — model bisnis: WA-based ordering, semua interaksi via WhatsApp. Produk ditampilkan di grid landing page.
- **Tidak ada shopping cart / checkout** — pemesanan via WhatsApp manual.
- **Tidak ada multi-language** — fokus Indonesia dulu.
- **Tidak ada OAuth / social login** — single admin, credentials cukup.
- **Tidak ada public registration** — hanya satu admin.
- **Tidak ada payment gateway** — pembayaran via transfer/COD di luar sistem.
- **Tidak ada manajemen order** — order tracking via WhatsApp.
- **Tidak ada test (unit/integration)** — belum diterapkan. Prioritas: setelah fitur stabil.
- **Tidak ada dark mode toggle** — CSS dark theme didefinisikan tapi belum ada UI toggle-nya.
