import { prisma } from "./prisma";
import type { SiteSettings } from "@/types";

const DEFAULT_SETTINGS: SiteSettings = {
  site_logo: "",
  site_name: "Toko Furnitur",
  hero_title: "Furnitur Impian untuk Rumah Anda",
  hero_subtitle:
    "Temukan koleksi furnitur berkualitas dengan desain modern dan klasik untuk setiap sudut rumah Anda.",
  hero_image: "",
  about_title: "Tentang Kami",
  about_content:
    "Kami adalah toko furnitur terpercaya yang menyediakan berbagai pilihan perabot rumah tangga berkualitas. Dengan pengalaman bertahun-tahun, kami berkomitmen untuk memberikan produk terbaik dengan pelayanan yang ramah dan profesional.",
  about_image: "",
  wa_number: "",
  wa_number_2: "",
  wa_number_1_label: "Chat & Tlp",
  wa_number_2_label: "Chat Only",
  wa_message: "Halo, saya tertarik dengan produk furnitur Anda.",
  contact_phone: "",
  contact_email: "",
  contact_address: "",
  social_media: [],
  operating_hours: [
    { days: "Senin - Jumat", hours: "08:00 - 17:00" },
    { days: "Sabtu", hours: "08:00 - 16:00" },
    { days: "Minggu", hours: "Libur" },
  ],
  footer_description:
    "Toko furnitur terpercaya untuk rumah impian Anda.",
};

const SETTING_KEYS = Array.from(
  new Set([
    ...Object.keys(DEFAULT_SETTINGS),
    "social_media",
  ])
);

export async function getAllSettings(): Promise<SiteSettings> {
  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: SETTING_KEYS } },
  });

  const map = new Map(rows.map((r) => [r.key, r.value]));

  const settings: SiteSettings = {
    ...DEFAULT_SETTINGS,
    ...Object.fromEntries(
      SETTING_KEYS.map((key) => {
        const raw = map.get(key);
        if ((key === "social_media" || key === "operating_hours") && raw) {
          try {
            return [key, JSON.parse(raw)];
          } catch {
            return [key, key === "social_media" ? [] : DEFAULT_SETTINGS.operating_hours];
          }
        }
        return [key, raw ?? DEFAULT_SETTINGS[key as keyof SiteSettings]];
      })
    ),
  };

  return settings;
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.siteConfig.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function updateSetting(
  key: string,
  value: string
): Promise<void> {
  await prisma.siteConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function updateSettings(
  settings: Partial<SiteSettings>
): Promise<void> {
  const upserts = Object.entries(settings).map(([key, value]) => {
    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);
    return prisma.siteConfig.upsert({
      where: { key },
      update: { value: stringValue },
      create: { key, value: stringValue },
    });
  });

  await prisma.$transaction(upserts);
}
