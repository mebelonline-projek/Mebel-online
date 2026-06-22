/**
 * Utility untuk WhatsApp links
 *
 * - Normalisasi nomor: auto-konversi format lokal Indonesia (08xx) ke internasional (628xx)
 * - Format URL yang konsisten di semua komponen
 */

/**
 * Normalisasi nomor WhatsApp ke format internasional tanpa "+"
 * - "0812-3456-7890" → "6281234567890"
 * - "+6281234567890" → "6281234567890"
 * - "6281234567890" → "6281234567890"
 */
export function normalizeWaNumber(phone: string): string {
  // Hanya ambil digit
  let cleaned = phone.replace(/[^0-9]/g, "");

  // Jika diawali "0", ganti dengan "62" (Indonesia)
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Bangun URL WhatsApp yang valid
 * @param phone Nomor WhatsApp (bisa dalam format apa saja, akan dinormalisasi)
 * @param message Pesan yang akan di-prepopulate (optional)
 */
export function buildWaLink(phone: string, message?: string): string {
  const normalized = normalizeWaNumber(phone);

  if (!normalized) return "#";

  const base = `https://wa.me/${normalized}`;

  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }

  return base;
}
