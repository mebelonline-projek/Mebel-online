import { cache } from "react";
import { getSupabase } from "./supabase";
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
    "operating_hours",
  ])
);

// Cache getAllSettings agar hanya 1 query Supabase per request
// (generateMetadata + HomePage keduanya memanggil fungsi ini)
export const getAllSettings = cache(async (): Promise<SiteSettings> => {
  const { data: rows, error } = await getSupabase()
    .from("SiteConfig")
    .select("*")
    .in("key", SETTING_KEYS);

  if (error || !rows) {
    console.error("Error fetching settings:", error);
    return DEFAULT_SETTINGS;
  }

  const map = new Map(rows.map((r) => [r.key, r.value]));

  const settings: SiteSettings = {
    ...DEFAULT_SETTINGS,
    ...Object.fromEntries(
      SETTING_KEYS.map((key) => {
        const raw = map.get(key);
        if (
          (key === "social_media" || key === "operating_hours") &&
          raw
        ) {
          try {
            return [key, JSON.parse(raw)];
          } catch {
            return [
              key,
              key === "social_media"
                ? []
                : DEFAULT_SETTINGS.operating_hours,
            ];
          }
        }
        return [key, raw ?? DEFAULT_SETTINGS[key as keyof SiteSettings]];
      })
    ),
  };

  return settings;
});

export async function getSetting(key: string): Promise<string | null> {
  const { data: row, error } = await getSupabase()
    .from("SiteConfig")
    .select("*")
    .eq("key", key)
    .single();

  if (error || !row) return null;
  return row.value ?? null;
}

export async function updateSetting(
  key: string,
  value: string
): Promise<void> {
  const { error } = await getSupabase().from("SiteConfig").upsert(
    { id: crypto.randomUUID(), key, value },
    { onConflict: "key" }
  );

  if (error) {
    console.error("Error updating setting:", error);
    throw new Error(error.message || "Gagal menyimpan pengaturan");
  }
}

export async function updateSettings(
  settings: Partial<SiteSettings>
): Promise<void> {
  const entries = Object.entries(settings);
  const upserts = entries.map(([key, value]) => {
    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);
    return { id: crypto.randomUUID(), key, value: stringValue };
  });

  const { error } = await getSupabase().from("SiteConfig").upsert(upserts, {
    onConflict: "key",
  });

  if (error) {
    console.error("Error updating settings:", error);
    const message = error.message || "";
    if (message.includes("duplicate key") || message.includes("unique constraint") || message.includes("violates")) {
      throw new Error("Gagal menyimpan: pastikan kolom id di SiteConfig punya default gen_random_uuid().");
    }
    throw new Error(error.message || "Gagal menyimpan pengaturan");
  }
}