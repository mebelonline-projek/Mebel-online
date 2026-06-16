# SECURITY-CHECKLIST.md

> Checklist ini dijalankan AI sebelum proyek dianggap "siap produksi" atau
> sebelum milestone besar (misal: sebelum demo ke investor/klien, sebelum
> go-live). Minta AI: "cek proyek ini terhadap SECURITY-CHECKLIST.md".

---

## A. Data & Database
- [ ] Tidak ada query SQL hasil string concatenation (cek dengan grep
      `+ req.` atau template literal di dalam query).
- [ ] Semua tabel dengan foreign key punya index.
- [ ] Kolom yang sering dipakai untuk WHERE/ORDER BY/JOIN punya index.
- [ ] Tidak ada endpoint list/search tanpa pagination atau limit.
- [ ] Backup strategy untuk database sudah didiskusikan (meski belum
      diimplementasi penuh, minimal tahu rencananya).

## B. Autentikasi & Otorisasi
- [ ] Password di-hash (bcrypt/argon2), tidak ada plaintext di log/DB.
- [ ] JWT secret kuat & di env var, tidak ada di kode/commit history.
- [ ] Access token expiry pendek + refresh token flow ada.
- [ ] Setiap endpoint protected ada middleware auth.
      ✓ API mutation endpoints (POST/PUT/DELETE) sudah pakai `requireAdmin()`
        dari `src/lib/api-auth.ts` — lihat file untuk daftar route terproteksi.
- [ ] Ownership check ada di setiap endpoint yang akses data milik user
      tertentu (no IDOR).
- [ ] Role-based access (jika ada admin/user roles) dicek di server, bukan
      cuma disembunyikan di UI.

## C. Input & Output
- [ ] Semua input divalidasi (Zod/Yup/Joi) di server.
- [ ] Output HTML/JSON tidak membocorkan field sensitif (password hash,
      token, internal ID yang tidak perlu).
- [ ] File upload divalidasi tipe + ukuran, disimpan aman.
- [ ] XSS protection: input user yang ditampilkan di UI di-escape
      (React sudah default escape, tapi cek `dangerouslySetInnerHTML`).

## D. Secrets & Config
- [ ] `.env` ada di `.gitignore`, tidak pernah ke-commit.
- [ ] Tidak ada API key/secret hardcoded di source code (grep
      "sk-", "API_KEY", "SECRET" untuk cek).
- [ ] Environment terpisah jelas: development vs production config.

## E. Network & Infra
- [ ] HTTPS dipakai di production.
- [ ] CORS whitelist origin spesifik di production (bukan `*`).
- [ ] Rate limiting di endpoint sensitif (auth, search, payment).
      ✓ Forgot password: 3 request per 15 menit per IP
      ✓ Reset password: 5 request per 15 menit per IP
      (via `src/lib/rate-limit.ts`)
- [ ] Error response ke client tidak berisi stack trace/detail internal
      saat production mode.
- [ ] CSRF: NextAuth session cookie menggunakan SameSite=Lax, dan semua
      API mutation sudah diverifikasi via `requireAdmin()`. Jika admin
      dipisah ke subdomain di masa depan, CSRF token wajib ditambahkan.

## F. Dependency
- [ ] `npm audit` dijalankan, vulnerability "high"/"critical" sudah
      ditangani atau dicatat sebagai risiko diketahui.
- [ ] Tidak ada dependency yang tidak terpakai (`depcheck` jika perlu).

## G. Performance & Scalability (dasar)
- [ ] Query N+1 dicek pada list dengan relasi (misal: list order +
      data user-nya — pakai join/include, bukan query di loop).
- [ ] Asset besar (gambar, model 3D, video) di-lazy-load atau di-compress.
- [ ] Tidak ada operasi berat (loop besar, kalkulasi kompleks) yang
      dijalankan di main thread/render path UI.

---

## Cara Pakai
Jalankan checklist ini secara bertahap, jangan tunggu sampai akhir proyek.
Disarankan: cek bagian A & B setiap kali ada modul baru yang menyentuh data
sensitif/auth, cek seluruh checklist sebelum milestone besar.
