# Cara Pakai Set File Ini

Letakkan keempat file ini di **root folder proyek** Anda:

```
proyek-anda/
├── CLAUDE.md              ← aturan utama, dibaca otomatis tiap sesi
├── ARCHITECTURE.md         ← peta proyek, AI update saat ada perubahan struktur
├── SECURITY-CHECKLIST.md   ← jalankan sebelum milestone besar/deploy
├── DEPENDENCIES.md         ← log setiap library baru yang ditambahkan
└── ... (kode proyek Anda)
```

## Langkah Awal Setup Proyek Baru
1. Mulai sesi baru, minta Claude: *"Baca CLAUDE.md dan ARCHITECTURE.md, lalu
   isi bagian Tech Stack di ARCHITECTURE.md sesuai stack yang akan kita pakai
   untuk proyek [nama proyek + deskripsi singkat]."*
2. Setiap kali mulai fitur besar baru, minta AI cek dulu ARCHITECTURE.md
   supaya tidak bertentangan dengan struktur yang sudah ada.
3. Sebelum demo/launch, minta: *"Cek proyek terhadap SECURITY-CHECKLIST.md
   dan laporkan apa yang belum terpenuhi."*

## Kebiasaan yang Disarankan (di luar file)
- **Sesi per fitur, bukan satu sesi maraton tanpa akhir.** Kalau konteks
  obrolan sudah sangat panjang, AI mulai "lupa" detail awal — mulai sesi baru
  dan minta AI baca ulang ARCHITECTURE.md untuk re-orientasi.
- **Review kode tetap perlu**, terutama untuk bagian auth, payment, dan akses
  data. Set file ini mengurangi risiko, bukan menghilangkan kebutuhan review.
- **Commit sering, commit kecil.** Memudahkan rollback jika ada perubahan AI
  yang ternyata merusak sesuatu (mitigasi "rumah kartu").
- **Gunakan branch** untuk eksperimen fitur besar, jangan langsung di
  main/production branch.
- Setelah Magic MCP generate komponen UI, minta AI cross-check komponen itu
  terhadap section 4 di CLAUDE.md (state, responsive, accessibility) sebelum
  dianggap selesai — Magic MCP bagus untuk visual, tapi tidak otomatis tahu
  konteks data/logic proyek Anda.

## Update Berkala
File-file ini bukan "tulis sekali selesai". `ARCHITECTURE.md` dan
`DEPENDENCIES.md` khususnya akan terus berkembang. Sesekali minta AI:
*"Review ARCHITECTURE.md, apakah masih sesuai dengan kode saat ini? Update
bagian yang sudah tidak akurat."*
