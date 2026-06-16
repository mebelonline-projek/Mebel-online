# DEPENDENCIES.md

> Catatan setiap dependency pihak ketiga yang dipakai proyek: apa fungsinya,
> kenapa dipilih, dan apakah ada alternatif yang dipertimbangkan.
> AI WAJIB menambah entri baru di sini setiap kali mengusulkan/menginstall
> package baru.

---

## next
- Versi: 15.2.4
- Fungsi: React framework dengan App Router, SSR, ISR, Server Components.
- Kenapa dipilih: Standar industri React, performa baik, ekosistem besar.
- Dipakai di: Semua halaman dan API routes.
- Tanggal ditambahkan: 2026-06-16

## react / react-dom
- Versi: 19
- Fungsi: Library UI untuk komponen interaktif.
- Kenapa dipilih: Standar de facto, ecosystem luas.
- Dipakai di: Semua komponen.
- Tanggal ditambahkan: 2026-06-16

## @prisma/client / prisma
- Versi: 6.19.3
- Fungsi: Type-safe ORM / query builder untuk database.
- Kenapa dipilih: Type safety, migration mudah, relasi jelas.
- Dipakai di: Semua data access (auth, produk, kategori, settings).
- Tanggal ditambahkan: 2026-06-16

## next-auth / @auth/prisma-adapter
- Versi: 5.0.0-beta.31
- Fungsi: Autentikasi dengan Credentials provider, JWT session.
- Kenapa dipilih: Integrasi langsung dengan Next.js, middleware support.
- Dipakai di: Auth flow (login, session, middleware).
- Tanggal ditambahkan: 2026-06-16

## framer-motion
- Versi: 12.40.0
- Fungsi: Library animasi React dengan API deklaratif.
- Kenapa dipilih: Performa baik, dukungan gesture, useReducedMotion built-in.
- Dipakai di: Hero, ProductCard, ProductGrid, AboutSection, ContactSection, Footer, WhatsAppButton.
- Tanggal ditambahkan: 2026-06-16

## tailwindcss
- Versi: 4
- Fungsi: Utility-first CSS framework.
- Kenapa dipilih: Development cepat, bundle kecil, kustomisasi mudah.
- Dipakai di: Semua styling.
- Tanggal ditambahkan: 2026-06-16

## zod
- Versi: 4.4.3
- Fungsi: Validasi schema dengan TypeScript inference.
- Kenapa dipilih: TypeScript-first, komposisi schema, error messages jelas.
- Dipakai di: Validasi kategori (src/app/api/categories/route.ts).
- Tanggal ditambahkan: 2026-06-16

## lucide-react
- Versi: latest
- Fungsi: Icon library berbasis SVG.
- Kenapa dipilih: Ringan, tree-shakeable, konsisten design.
- Dipakai di: Semua icon di UI (navbar, hero, about, contact, admin).
- Tanggal ditambahkan: 2026-06-16

## resend
- Versi: latest
- Fungsi: Email API untuk mengirim email transaksional (reset password).
- Kenapa dipilih: API sederhana, deliverability tinggi, tidak perlu SMTP server.
- Dipakai di: src/lib/email.ts.
- Tanggal ditambahkan: 2026-06-16

## sonner
- Versi: latest
- Fungsi: Toast notification library.
- Kenapa dipilih: Ringan, accessible, kustomisasi mudah.
- Dipakai di: Root layout, admin dashboard (CRUD notifications).
- Tanggal ditambahkan: 2026-06-16

## bcryptjs
- Versi: latest
- Fungsi: Hashing password (bcrypt).
- Kenapa dipilih: Pure JS, tidak perlu native dependencies, kompatibel Windows.
- Dipakai di: src/lib/auth.ts (hashPassword, verifyPassword).
- Tanggal ditambahkan: 2026-06-16

## react-hook-form / @hookform/resolvers
- Versi: 7.79.0
- Fungsi: Form management dengan performa tinggi.
- Kenapa dipilih: Minim re-render, integrasi Zod mudah.
- Dipakai di: Admin forms (produk, kategori, settings).
- Tanggal ditambahkan: 2026-06-16

## class-variance-authority / clsx / tailwind-merge
- Versi: latest
- Fungsi: Utility untuk className management (CVA, clsx, cn() helper).
- Kenapa dipilih: Standar shadcn/ui, type-safe variants.
- Dipakai di: Semua UI components (via cn()).
- Tanggal ditambahkan: 2026-06-16

## @base-ui/react
- Versi: latest
- Fungsi: Headless UI primitives (dialog, sheet, select, dll).
- Kenapa dipilih: Digunakan shadcn/ui untuk komponen interaktif.
- Dipakai di: Komponen shadcn/ui (Sheet, Dialog, Select, dll).
- Tanggal ditambahkan: 2026-06-16

## next-themes
- Versi: 0.4.6
- Fungsi: Theme management (dark/light mode).
- Kenapa dipilih: Sederhana, integration dengan Tailwind.
- Dipakai di: Belum dipakai aktif — dark theme CSS sudah ada tapi belum ada toggle.
- Tanggal ditambahkan: 2026-06-16

## tw-animate-css
- Versi: latest
- Fungsi: Animasi CSS utility classes (animate-ping, animate-pulse, dll).
- Kenapa dipilih: Integrasi dengan Tailwind v4 CSS-first config.
- Dipakai di: globals.css (import), WhatsAppButton (animate-ping).
- Tanggal ditambahkan: 2026-06-16

## tsx
- Versi: latest
- Fungsi: TypeScript executor untuk Node.js (tanpa build).
- Kenapa dipilih: Menjalankan seed script langsung.
- Dipakai di: prisma/seed.ts (via npm run db:seed).
- Tanggal ditambahkan: 2026-06-16

## shadcn/ui components
- Versi: latest (via npx shadcn)
- Fungsi: Koleksi komponen UI reusable (button, input, card, dialog, dll).
- Kenapa dipilih: Aksesible, kustomisasi via Tailwind, tidak menambah bundle size.
- Dipakai di: 18 komponen UI di src/components/ui/.
- Tanggal ditambahkan: 2026-06-16
