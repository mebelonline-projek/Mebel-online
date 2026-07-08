# ARCHITECTURE.md

> Dokumen ini adalah "peta" proyek. WAJIB diupdate setiap kali ada perubahan
> struktural besar (modul baru, perubahan flow data, library inti baru).
> Tujuannya: AI (dan manusia) baru yang masuk ke proyek bisa paham konteks
> tanpa membaca ribuan baris kode dulu.

---

## 1. Tech Stack

| Layer        | Teknologi | Alasan dipilih |
|--------------|-----------|----------------|
| Runtime      | Cloudflare Workers (nodejs_compat) via OpenNext | Deploy edge; target produksi saat ini |
| Framework    | Next.js 15 (App Router) + `@opennextjs/cloudflare` | App Router; build ke Worker |
| Database     | PostgreSQL via Supabase | Auth RPC + storage + data |
| Query client | `@supabase/supabase-js` (service_role di server) | Tanpa Prisma binary di Workers |
| UI Framework | Tailwind CSS v4 + shadcn/ui | Utility-first, komponen reusable |
| Auth         | NextAuth v5 beta (Credentials, JWT) + Supabase RPC `extensions.crypt` | bcrypt tidak dijalankan di Worker (CPU 50ms Free) |
| Email        | Resend | Reset password |
| Animasi      | Framer Motion 12 di landing (client); admin pakai CSS | Hindari framer-motion di tree dashboard Workers |
| Validation   | Zod | Server-side input validation |
| Deployment   | Cloudflare Workers Free (CPU 50ms/request) | Batasan keras — lihat ADR di bawah |

---

## 2. Diagram Alur Data (High Level)

```
[Client/Browser]
      │
      ├── Landing Page (/)
      │     └── Server Component → Supabase JS → PostgreSQL
      │         └── ISR / static shell sesuai page
      │
      ├── Admin Dashboard (/admin/dashboard/*)
      │     ├── NextAuth Middleware → proteksi page
      │     ├── Client Component → fetch API → Route Handler
      │     └── API → requireAdmin() → Supabase (service_role)
      │
      ├── Admin Auth (/admin/login, forgot/reset)
      │     └── NextAuth Credentials → RPC verify_admin_password
      │         (extensions.crypt di Postgres — BUKAN bcryptjs di Worker)
      │
      └── API (/api/*)
            ├── Public: GET products/categories (aktif), logo settings
            └── Protected (requireAdmin):
                  ├── CRUD products/categories/settings
                  ├── upload / cleanup storage
                  └── change-password → RPC change_admin_password
                      reset-password → RPC reset_admin_password
```

Auth SQL canonical: `scripts/migrations/001_auth_canonical.sql`  
Archived conflicting scripts: `scripts/archive/` (DO NOT RUN)

---

## 3. Modul/Domain yang Ada

| Modul       | Tanggung Jawab | File Utama | Status |
|-------------|----------------|------------|--------|
| landing     | Landing page publik | `src/app/page.tsx`, `src/components/landing/*` | ✅ |
| admin       | Admin dashboard | `src/app/admin/dashboard/*`, `src/components/admin/*` | ✅ |
| auth        | Login, logout, JWT, ganti/reset password via RPC | `src/lib/auth.ts`, `src/app/api/auth/*` | ✅ |
| products    | CRUD + listing | `src/app/api/products/*` | ✅ |
| categories  | CRUD + `_count.products` via JOIN | `src/app/api/categories/route.ts` | ✅ |
| settings    | Site config key-value | `src/app/api/settings/*`, `src/lib/site-config.ts` | ✅ |
| upload      | Supabase Storage | `src/app/api/upload/*`, `src/lib/upload.ts` | ✅ |

---

## 4. Keputusan Arsitektur Penting (ADR ringkas)

**[2026-07-02] — Deploy: Vercel → Cloudflare Workers (OpenNext)**
- Alasan: target hosting klien / Workers.
- Trade-off: CPU Free 50ms; bcrypt multi-query / N+1 di Worker = Error 1102.

**[2026-07-03+] — Auth hash HANYA di Postgres (`extensions.crypt`)**
- Alasan: bcryptjs di Worker melebihi budget CPU; dual `$2b$`/`$2a$` mengunci admin.
- Trade-off: state auth bergantung SQL functions; **satu file kanonis** wajib, script lama di-archive.
- Source of truth: `scripts/migrations/001_auth_canonical.sql`

**[2026-07-08] — Categories KEEP `Product(count)` + `_count` transform**
- Alasan: menghapus JOIN demi CPU merusak admin UI (0 produk / crash).
- Trade-off: ~5–10ms CPU. Jangan yo-yo hapus JOIN tanpa ukur. UI wajib `_count?.products ?? 0`.

**[2026-06-16] — Credentials-only auth (tanpa OAuth)**
- Alasan: single admin. Trade-off: tidak ada social login.

**[2026-06-16] — JWT session strategy**
- Alasan: stateless. Trade-off: tidak bisa revoke individual tanpa blacklist.

**[2026-06-16] — API auth via `requireAdmin()`**
- Alasan: middleware NextAuth proteksi page, bukan semua API.

**HISTORIS (sudah diganti):** Prisma + SQLite/Vercel, rate-limiter DB, bcrypt di Worker — jangan dihidupkan lagi di jalur production Workers Free.

---

## 5. Konvensi Penamaan

- File: `kebab-case.ts` utilities, `PascalCase.tsx` komponen.
- Tabel DB: `PascalCase` (legacy Prisma naming di Postgres).
- Env: `UPPER_SNAKE_CASE`.
- Auth SQL: hanya `scripts/migrations/001_*.sql` — bukan `scripts/archive/*`.

---

## 6. Hal yang SENGAJA Belum Dibuat (Scope Boundary)

- Tidak ada halaman detail produk / cart / payment / order management (WA-based).
- Tidak ada OAuth / public registration.
- Tidak ada Workers Paid (sengaja tetap Free — disiplin CPU ketat).
- Tidak ada rate-limiter database (dihapus demi CPU; single admin).
- Tidak ada auto-renumber N+1 di Worker (renumber manual via endpoint batch).
