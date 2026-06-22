const fs = require("fs");
const p = "src/app/admin/dashboard/settings/page.tsx";
let c = fs.readFileSync(p, "utf8");
c = c.split('Klik "Tambah"').join('Klik "Tambah"');
c = c.split('Gunakan "Libur"').join('Gunakan "Libur"');
c = c.split("& footer.").join("& footer.");
c = c.split('Klik "Tambah"').join('Klik "Tambah"');
fs.writeFileSync(p, c);
console.log("Fixed");
</｜｜DSML｜｜parameter>
</task_call>