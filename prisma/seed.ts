import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Admin
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.admin.upsert({
    where: { email: "admin@tokofurnitur.com" },
    update: {},
    create: {
      email: "admin@tokofurnitur.com",
      name: "Admin Toko",
      password: hashedPassword,
    },
  });
  console.log("✅ Admin: admin@tokofurnitur.com / admin123");

  // 2. Site Config
  const configs: { key: string; value: string }[] = [
    { key: "site_logo", value: "" },
    { key: "site_name", value: "Muara Teweh" },
    { key: "hero_title", value: "Furnitur Impian untuk Rumah Anda" },
    {
      key: "hero_subtitle",
      value:
        "Temukan koleksi furnitur berkualitas dengan desain modern dan klasik untuk setiap sudut rumah Anda.",
    },
    {
      key: "hero_image",
      value:
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80",
    },
    { key: "about_title", value: "Tentang Kami" },
    {
      key: "about_content",
      value:
        "Kami adalah toko furnitur terpercaya Muara Teweh yang menyediakan berbagai pilihan perabot rumah tangga berkualitas.\n\nDengan pengalaman bertahun-tahun, kami berkomitmen untuk memberikan produk terbaik dengan pelayanan yang ramah dan profesional untuk setiap pelanggan. Kami percaya setiap rumah berhak memiliki furnitur yang nyaman, indah, dan tahan lama.",
    },
    {
      key: "about_image",
      value:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    },
    { key: "wa_number", value: "6281234567890" },
    { key: "wa_message", value: "Halo, saya tertarik dengan produk furnitur Anda." },
    { key: "contact_phone", value: "(0511) 1234-5678" },
    { key: "contact_email", value: "muarateweh@tokofurnitur.com" },
    { key: "contact_address", value: "Jl. Jenderal Sudirman No. 123, Muara Teweh, Kalimantan Tengah" },
    {
      key: "social_media",
      value: JSON.stringify([
        { platform: "Instagram", url: "https://instagram.com/muarateweh", icon: "instagram" },
        { platform: "Facebook", url: "https://facebook.com/muarateweh", icon: "facebook" },
      ]),
    },
    { key: "footer_description", value: "Toko furnitur terpercaya untuk rumah impian Anda." },
  ];

  for (const c of configs) {
    await prisma.siteConfig.upsert({ where: { key: c.key }, update: {}, create: c });
  }
  console.log("✅ Site config created");

  // 3. Categories
  const catData = [
    { name: "Kursi", slug: "kursi", description: "Koleksi kursi berbagai model", sortOrder: 1 },
    { name: "Meja", slug: "meja", description: "Meja tamu, meja makan, dan lainnya", sortOrder: 2 },
    { name: "Lemari", slug: "lemari", description: "Lemari pakaian, lemari pajang", sortOrder: 3 },
    { name: "Sofa", slug: "sofa", description: "Sofa minimalis dan klasik", sortOrder: 4 },
    { name: "Tempat Tidur", slug: "tempat-tidur", description: "Ranjang dan perlengkapannya", sortOrder: 5 },
  ];

  const categories: { id: string; name: string; slug: string }[] = [];
  for (const cat of catData) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      categories.push(existing);
    } else {
      const created = await prisma.category.create({ data: cat });
      categories.push(created);
      console.log(`  📦 Category: ${cat.name}`);
    }
  }
  console.log("✅ Categories created");

  // 4. Sample Products
  const productData = [
    { name: "Kursi Tamu Minimalis Modern", desc: "Kursi tamu dengan rangka kayu jati dan busa berkualitas tinggi. Nyaman untuk bersantai.", cat: "kursi", img: "https://images.unsplash.com/photo-1503602642458-232111445657?w=600&q=80" },
    { name: "Kursi Makan Kayu Jati", desc: "Set kursi makan kayu jati ukiran klasik, cocok untuk ruang makan keluarga.", cat: "kursi", img: "https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=600&q=80" },
    { name: "Kursi Santai Rotan", desc: "Kursi santai rotan sintetis, cocok untuk teras atau taman rumah.", cat: "kursi", img: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80" },
    { name: "Kursi Kantor Ergonomis", desc: "Kursi kantor dengan sandaran tinggi dan bantal lumbar.", cat: "kursi", img: "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=600&q=80" },
    { name: "Meja Tamu Kaca", desc: "Meja tamu minimalis dengan permukaan kaca tempered.", cat: "meja", img: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&q=80" },
    { name: "Meja Makan Kayu Mahoni", desc: "Meja makan besar kayu mahoni, muat 6-8 kursi.", cat: "meja", img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80" },
    { name: "Meja Rias Elegan", desc: "Meja rias dengan cermin dan laci penyimpanan.", cat: "meja", img: "https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=600&q=80" },
    { name: "Meja Kerja Minimalis", desc: "Meja kerja kayu dengan laci, cocok untuk home office.", cat: "meja", img: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80" },
    { name: "Lemari Pakaian 3 Pintu", desc: "Lemari pakaian dengan cermin, 3 pintu, banyak ruang gantung.", cat: "lemari", img: "https://images.unsplash.com/photo-1597006335770-25b6a72c8838?w=600&q=80" },
    { name: "Lemari Pajang Kaca", desc: "Lemari pajang kaca untuk koleksi dan barang hias.", cat: "lemari", img: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80" },
    { name: "Rak Buku Minimalis", desc: "Rak buku kayu dengan desain minimalis modern.", cat: "lemari", img: "https://images.unsplash.com/photo-1588703975212-1a8f0b9f0b8a?w=600&q=80" },
    { name: "Sofa 3 Seater Premium", desc: "Sofa ruang tamu 3 kursi dengan bahan kulit sintetis premium.", cat: "sofa", img: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600&q=80" },
    { name: "Sofa Santai L-Shape", desc: "Sofa L-shape nyaman untuk keluarga, dilengkapi ottoman.", cat: "sofa", img: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80" },
    { name: "Sofa Bed Minimalis", desc: "2-in-1 sofa yang bisa dijadikan tempat tidur tamu.", cat: "sofa", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80" },
    { name: "Tempat Tidur Ukiran", desc: "Ranjang kayu jati ukiran untuk kamar tidur utama.", cat: "tempat-tidur", img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80" },
    { name: "Kasur Busa Inoac", desc: "Kasur busa Inoac 20 cm, nyaman dan awet.", cat: "tempat-tidur", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80" },
  ];

  for (const p of productData) {
    const cat = categories.find((c) => c.slug === p.cat);
    if (!cat) continue;

    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: p.name,
          slug,
          description: p.desc,
          image: p.img,
          images: "[]",
          categoryId: cat.id,
          isActive: true,
          sortOrder: 0,
        },
      });
      console.log(`  🪑 Product: ${p.name}`);
    }
  }
  console.log("✅ Products created");

  console.log("");
  console.log("🎉 Seed complete!");
  console.log("📧 Admin: admin@tokofurnitur.com / admin123");
  console.log("🌐 Landing page: http://localhost:3000");
  console.log("🔐 Admin panel: http://localhost:3000/admin/login");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
