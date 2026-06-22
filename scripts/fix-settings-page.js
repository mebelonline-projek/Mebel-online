const fs = require("fs");
const path = "src/app/admin/dashboard/settings/page.tsx";
let c = fs.readFileSync(path, "utf8");

// 1. Update import
c = c.replace(
  'import type { SiteSettings, SocialMediaItem } from "@/types";',
  'import type { SiteSettings, SocialMediaItem, OperatingHourEntry } from "@/types";'
);

// 2. Update defaults
c = c.replace(
  "  wa_number: \"\",\n  wa_message:",
  '  wa_number: "",\n  wa_number_2: "",\n  wa_number_1_label: "Chat & Tlp",\n  wa_number_2_label: "Chat Only",\n  wa_message:'
);

c = c.replace(
  "  social_media: [],\n  footer_description:",
  '  social_media: [],\n  operating_hours: [\n    { days: "Senin - Jumat", hours: "08:00 - 17:00" },\n    { days: "Sabtu", hours: "08:00 - 16:00" },\n    { days: "Minggu", hours: "Libur" },\n  ],\n  footer_description:'
);

// 3. Add operating hours functions after removeSocialMedia
c = c.replace(
  "  const removeSocialMedia = (index: number) => {\n    setSettings((prev) => ({\n      ...prev,\n      social_media: prev.social_media.filter((_, i) => i !== index),\n    }));\n  };",
  `  const removeSocialMedia = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      social_media: prev.social_media.filter((_, i) => i !== index),
    }));
  };

  const addOperatingHour = () => {
    setSettings((prev) => ({
      ...prev,
      operating_hours: [
        ...prev.operating_hours,
        { days: "", hours: "" },
      ],
    }));
  };

  const updateOperatingHour = (index: number, field: keyof OperatingHourEntry, value: string) => {
    setSettings((prev) => {
      const updated = [...prev.operating_hours];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, operating_hours: updated };
    });
  };

  const removeOperatingHour = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      operating_hours: prev.operating_hours.filter((_, i) => i !== index),
    }));
  };`
);

// 4. Replace Contact section with WA 1 & WA 2 inputs
c = c.replace(
  `          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Nomor WhatsApp</Label>
              <Input
                value={settings.wa_number}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_number: e.target.value }))
                }
                placeholder="6281234567890"
              />
              <p className="text-xs text-gray-400">
                Format: 62xxxx (tanpa + dan spasi)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Pesan Default WA</Label>
              <Input
                value={settings.wa_message}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_message: e.target.value }))
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                Pesan ini akan terkirim otomatis saat pengunjung klik tombol WA umum.
                Untuk tombol WA di tiap produk, nama produk akan ditambahkan otomatis.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Nomor Telepon</Label>
              <Input
                value={settings.contact_phone}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, contact_phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email Kontak</Label>
              <Input
                value={settings.contact_email}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, contact_email: e.target.value }))
                }
                type="email"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Alamat</Label>
              <Textarea
                value={settings.contact_address}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, contact_address: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
        </section>`,
  `          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* WA 1 */}
            <div className="space-y-2">
              <Label>Label WA 1</Label>
              <Input
                value={settings.wa_number_1_label}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_number_1_label: e.target.value }))
                }
                placeholder="Chat & Tlp"
              />
            </div>
            <div className="space-y-2">
              <Label>Nomor WhatsApp 1</Label>
              <Input
                value={settings.wa_number}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_number: e.target.value }))
                }
                placeholder="6281234567890"
              />
              <p className="text-xs text-gray-400">
                Format: 62xxxx (tanpa + dan spasi)
              </p>
            </div>
            {/* WA 2 */}
            <div className="space-y-2">
              <Label>Label WA 2</Label>
              <Input
                value={settings.wa_number_2_label}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_number_2_label: e.target.value }))
                }
                placeholder="Chat Only"
              />
            </div>
            <div className="space-y-2">
              <Label>Nomor WhatsApp 2</Label>
              <Input
                value={settings.wa_number_2}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_number_2: e.target.value }))
                }
                placeholder="6281234567890"
              />
              <p className="text-xs text-gray-400">
                Format: 62xxxx (tanpa + dan spasi)
              </p>
            </div>
            {/* WA Message */}
            <div className="md:col-span-2 space-y-2">
              <Label>Pesan Default WA</Label>
              <Input
                value={settings.wa_message}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_message: e.target.value }))
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                Pesan ini akan terkirim otomatis saat pengunjung klik tombol WA umum.
                Untuk tombol WA di tiap produk, nama produk akan ditambahkan otomatis.
              </p>
            </div>
            {/* Phone, Email, Address */}
            <div className="space-y-2">
              <Label>Nomor Telepon</Label>
              <Input
                value={settings.contact_phone}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, contact_phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email Kontak</Label>
              <Input
                value={settings.contact_email}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, contact_email: e.target.value }))
                }
                type="email"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Alamat</Label>
              <Textarea
                value={settings.contact_address}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, contact_address: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
        </section>

        {/* Operating Hours */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Jam Operasional</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOperatingHour}
              className="rounded-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah
            </Button>
          </div>

          {settings.operating_hours.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Belum ada jam operasional. Klik "Tambah" untuk menambahkan.
            </p>
          ) : (
            <div className="space-y-3">
              {settings.operating_hours.map((oh, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Input
                    placeholder="Hari (contoh: Senin - Jumat)"
                    value={oh.days}
                    onChange={(e) => updateOperatingHour(i, "days", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Jam (contoh: 08:00 - 17:00 atau Libur)"
                    value={oh.hours}
                    onChange={(e) => updateOperatingHour(i, "hours", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOperatingHour(i)}
                    className="h-9 w-9 text-gray-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Tampil di bagian kontak (landing page) & footer. Gunakan "Libur" untuk hari libur.
          </p>
        </section>`
);

// 5. Fix social media text with unescaped quotes
c = c.replace(
  'Belum ada media sosial. Klik "Tambah" untuk menambahkan.',
  'Belum ada media sosial. Klik "Tambah" untuk menambahkan.'
);

fs.writeFileSync(path, c);
console.log("Fix applied successfully!");
</｜｜DSML｜｜parameter>
</task_call>