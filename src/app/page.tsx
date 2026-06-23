import type { Metadata } from "next";
import { Suspense } from "react";
import { getSupabase } from "@/lib/supabase";
import { getAllSettings } from "@/lib/site-config";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import BentoCatalog from "@/components/landing/BentoCatalog";
import AboutSection from "@/components/landing/AboutSection";
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import CatalogSkeleton from "@/components/landing/CatalogSkeleton";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAllSettings();

  return {
    title: `${settings.site_name} — Mebel Online | Toko Furnitur`,
    description:
      settings.hero_subtitle ||
      "Toko furnitur terpercaya. Koleksi mebel berkualitas untuk rumah impian Anda.",
    openGraph: {
      title: `${settings.site_name} — Mebel Online`,
      description:
        settings.hero_subtitle ||
        "Toko furnitur terpercaya. Koleksi mebel berkualitas untuk rumah impian Anda.",
      type: "website",
      locale: "id_ID",
      images: settings.hero_image
        ? [{ url: settings.hero_image, width: 1200, height: 630 }]
        : [],
    },
    keywords: [
      "furnitur",
      "mebel",
      "Muara Teweh",
      "toko furnitur",
      "kursi",
      "meja",
      "lemari",
      "perabot rumah",
    ],
    alternates: {
      canonical: process.env.AUTH_URL || "https://tokofurnitur.com",
    },
  };
}

const INITIAL_PRODUCT_LIMIT = 20;

export default async function HomePage() {
  const supabase = getSupabase();
  const [settings, categoriesResult, productsResult, countResult] = await Promise.all([
    getAllSettings(),
    supabase
      .from("Category")
      .select("*, products:Product(count)")
      .order("sortOrder", { ascending: true }),
    supabase
      .from("Product")
      .select("*, category:Category(name, slug)")
      .eq("isActive", true)
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: false })
      .limit(INITIAL_PRODUCT_LIMIT),
    supabase
      .from("Product")
      .select("id", { count: "exact", head: true })
      .eq("isActive", true),
  ]);

  const categories = categoriesResult.data?.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    _count: { products: c.products?.[0]?.count ?? 0 },
  })) ?? [];

  const products = (productsResult.data ?? []).map((p) => ({
    ...p,
    images: p.images ? (() => { try { const parsed = JSON.parse(p.images); return Array.isArray(parsed) ? parsed.filter(i => typeof i === "string") : []; } catch { return []; } })() : [],
    variants: p.variants ? (() => { try { const parsed = JSON.parse(p.variants); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })() : [],
  }));

  const totalProducts = countResult.count ?? 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.site_name || "Muara Teweh",
    description: settings.hero_subtitle || "Toko furnitur terpercaya.",
    image: settings.hero_image || undefined,
    url: process.env.AUTH_URL || "https://tokofurnitur.com",
    telephone: settings.contact_phone || undefined,
    email: settings.contact_email || undefined,
    address: settings.contact_address
      ? {
          "@type": "PostalAddress",
          streetAddress: settings.contact_address,
        }
      : undefined,
    ...(settings.social_media?.length
      ? {
          sameAs: settings.social_media
            .filter((s: { url: string }) => s.url)
            .map((s: { url: string }) => s.url),
        }
      : {}),
  };

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar
        siteName={settings.site_name}
        logoUrl={settings.site_logo}
      />

      <Hero
        title={settings.hero_title}
        subtitle={settings.hero_subtitle}
        imageUrl={settings.hero_image}
      />

      {/* Main Catalog — Bento Grid dengan filter kategori via API */}
      <Suspense fallback={<CatalogSkeleton />}>
        <BentoCatalog
          products={products}
          categories={categories}
          waNumber={settings.wa_number}
          waMessage={settings.wa_message}
          totalProducts={totalProducts}
          initialLimit={INITIAL_PRODUCT_LIMIT}
        />
      </Suspense>

      <AboutSection
        title={settings.about_title}
        content={settings.about_content}
        imageUrl={settings.about_image}
      />

      <ContactSection
        phone={settings.contact_phone}
        email={settings.contact_email}
        address={settings.contact_address}
        waNumber={settings.wa_number}
        waNumber2={settings.wa_number_2}
        waNumber1Label={settings.wa_number_1_label}
        waNumber2Label={settings.wa_number_2_label}
        waMessage={settings.wa_message}
        operatingHours={settings.operating_hours}
        socialMedia={settings.social_media}
      />

      <Footer
        siteName={settings.site_name}
        description={settings.footer_description}
        phone={settings.contact_phone}
        email={settings.contact_email}
        address={settings.contact_address}
        socialMedia={settings.social_media}
        operatingHours={settings.operating_hours}
        logoUrl={settings.site_logo}
      />

      <WhatsAppButton
        waNumber={settings.wa_number}
        waMessage={settings.wa_message}
      />
    </main>
  );
}