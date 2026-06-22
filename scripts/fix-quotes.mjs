import { readFileSync, writeFileSync } from "fs";
const path = "src/app/admin/dashboard/settings/page.tsx";
let c = readFileSync(path, "utf8");

// Replace unescaped quotes with HTML entities
c = c.replace(
  'Klik "Tambah" untuk menambahkan.',
  'Klik \u0026quot;Tambah\u0026quot; untuk menambahkan.'
);
c = c.replace(
  'Tampil di bagian kontak (landing page) & footer. Gunakan "Libur" untuk hari libur.',
  'Tampil di bagian kontak (landing page) \u0026amp; footer. Gunakan \u0026quot;Libur\u0026quot; untuk hari libur.'
);

writeFileSync(path, c, "utf8");
console.log("Fixed!");
</｜｜DSML｜｜parameter>
</write_to_file>