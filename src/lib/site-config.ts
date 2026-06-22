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
  wa_message: "Halo, saya tertarik dengan produk furnitur Anda.",
  contact_phone: "",
  contact_email: "",
  contact_address: "",
  social_media: [],
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
        if (key === "social_media" && raw) {
          try {
            return [key, JSON.parse(raw)];
          } catch {
            return [key, []];
          }
        }
        return [key, raw ?? DEFAULT_SETTINGS[key as keyof SiteSettings]];
      })
    ),
  };

  return settings;
}

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
    { key, value },
    { onConflict: "key" }
  );

  if (error) {
    console.error("Error updating setting:", error);
    throw error;
  }
}

export async function updateSettings(
  settings: Partial<SiteSettings>
): Promise<void> {
  const entries = Object.entries(settings);
  const upserts = entries.map(([key, value]) => {
    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);
    return { key, value: stringValue };
  });

  const { error } = await getSupabase().from("SiteConfig").upsert(upserts, {
    onConflict: "key",
  });

  if (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
}