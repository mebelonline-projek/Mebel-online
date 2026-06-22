import type { ProductVariant } from "@/types";

/** Urutan tetap varian: Warna > Ukuran > Bahan > Opsional */
export const VARIANT_ORDER: ReadonlyArray<ProductVariant["type"]> = [
  "color",
  "size",
  "material",
  "text",
] as const;

/** Label kanonis untuk setiap tipe varian */
export const VARIANT_LABELS: Record<ProductVariant["type"], string> = {
  color: "Warna",
  size: "Ukuran",
  material: "Bahan",
  text: "Tambahan",
};

const TYPE_INDEX = Object.fromEntries(
  VARIANT_ORDER.map((t, i) => [t, i])
) as Record<string, number>;

/**
 * Sortir varian ke urutan tetap: color → size → material → text.
 * - Grup dengan tipe sama di-merge (options digabung).
 * - Tipe yang tidak dikenal ditaruh di akhir.
 * - Urutan options dalam satu tipe dipertahankan.
 */
export function sortVariants(variants: ProductVariant[]): ProductVariant[] {
  if (!variants || variants.length === 0) return [];

  const merged = new Map<string, ProductVariant>();

  for (const group of variants) {
    const existing = merged.get(group.type);
    if (existing) {
      // Merge options — gabung, jaga urutan, hindari duplikat value
      const existingValues = new Set(existing.options.map((o) => o.value));
      const fresh = group.options.filter((o) => !existingValues.has(o.value));
      existing.options.push(...fresh);
    } else {
      merged.set(group.type, { ...group, options: [...group.options] });
    }
  }

  return Array.from(merged.values()).sort((a, b) => {
    const ai = TYPE_INDEX[a.type] ?? Infinity;
    const bi = TYPE_INDEX[b.type] ?? Infinity;
    return ai - bi;
  });
}
