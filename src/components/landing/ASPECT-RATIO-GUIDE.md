# Panduan CSS: Tampilan Gambar 4:3 dengan Aspect-Ratio

> Dokumen ini menjelaskan cara memastikan gambar tetap proporsional (tidak gepeng)
> meskipun user mengupload dengan rasio selain 4:3.

---

## 1. CSS `aspect-ratio: 4/3` + `object-fit: cover`

**Cara kerja:**
- `aspect-ratio: 4/3` → memaksa container memiliki rasio lebar:tinggi = 4:3
- `object-fit: cover` → gambar memenuhi container, bagian yang kepanjangan akan terpotong (tidak gepeng)

### Contoh JSX (Next.js Image):

```tsx
<div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
  <Image
    src={imageUrl}
    alt={title}
    fill
    className="object-cover"  // Penting! Mencegah gambar gepeng
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  />
</div>
```

### Contoh kode yang sudah ada di proyek ini:

| Komponen | Lokasi | Sudah pakai aspect-ratio? |
|---|---|---|
| `AboutSection.tsx` | `aspect-[4/3]` + `object-cover` ✅ | Ya |
| `ProductCard.tsx` | `aspect-[4/3]` + `object-contain` ⚠️ | object-contain (tidak terpotong) |
| `ImageUploader.tsx` | `aspect-[4/3]` | Hanya container, image sudah `object-cover` |
| `BentoGrid.tsx` | Tanpa aspect-ratio tetap | Menggunakan `object-cover` saja |
| `ProductDetailSheet.tsx` | `aspect-square` | Persegi, bukan 4:3 |

### Jika ingin merubah ProductCard ke object-fit: cover (potong pinggir):

```tsx
<Image
  src={coverImage}
  alt={product.name}
  fill
  className="object-cover bg-gray-100 group-hover:scale-105 transition-transform duration-700"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

---

## 2. Lazy Loading dengan `loading="lazy"`

**Next.js Image secara default sudah menggunakan lazy loading modern** (native browser lazy).
Tidak perlu explicitly menambahkan `loading="lazy"`.

Namun untuk gambar di **AboutSection** dan **Footer** yang berada di bagian bawah halaman,
berikut contoh jika menggunakan tag `<img>` biasa:

```html
<!-- Untuk gambar di bawah fold (tentang-kami, footer) -->
<img
  src="https://supabase.co/storage/.../tentang-kami/image.webp"
  alt="Tentang Kami"
  loading="lazy"
  width="1024"
  height="768"
  style="aspect-ratio: 4 / 3; object-fit: cover;"
/>
```

### Di Next.js (sudah otomatis):

```tsx
// components/landing/AboutSection.tsx
<Image
  src={imageUrl}
  alt={title}
  fill
  className="object-cover" // mencegah gepeng
  // loading="lazy" → DEFAULT di Next.js Image
  // priority → kebalikan lazy, untuk hero/LCP
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

## 3. Rekomendasi Priority (Optimasi LCP)

Untuk gambar **Hero**, gunakan `priority` agar langsung dimuat (tidak lazy):

```tsx
// components/landing/Hero.tsx
<Image
  src={imageUrl}
  alt={title}
  fill
  priority  // menonaktifkan lazy loading — penting untuk Largest Contentful Paint
  className="object-cover"
/>
```

---

## 4. Ringkasan

| Tipe Foto | Aspect Ratio | object-fit | loading |
|-----------|-------------|------------|---------|
| Hero | 4:3 atau 16:9 | cover | priority (jangan lazy!) |
| Produk (Card) | 4:3 | cover atau contain | lazy (default) |
| Produk (Detail) | Beragam | contain | lazy (default) |
| Tentang Kami | 4:3 | cover | lazy (default) |
| Galeri | Bervariasi | cover | lazy (default) |