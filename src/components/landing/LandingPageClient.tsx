"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import BentoCatalog from "@/components/landing/BentoCatalog";
import CatalogSkeleton from "@/components/landing/CatalogSkeleton";
import { Button } from "@/components/ui/button";
import type { LandingPayload } from "@/lib/landing-data";
import { buildLandingJsonLd } from "@/lib/landing-data";

const AboutSection = dynamic(() => import("@/components/landing/AboutSection"), {
  ssr: false,
});
const ContactSection = dynamic(() => import("@/components/landing/ContactSection"), {
  ssr: false,
});
const Footer = dynamic(() => import("@/components/landing/Footer"), { ssr: false });
const WhatsAppButton = dynamic(() => import("@/components/landing/WhatsAppButton"), {
  ssr: false,
});

const DEFAULT_SITE_NAME = "Muara Teweh";

export default function LandingPageClient() {
  const [payload, setPayload] = useState<LandingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [settingsRes, categoriesRes, productsRes] = await Promise.all([
        fetch("/api/settings/public", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/products?limit=20&page=1", { cache: "no-store" }),
      ]);

      const [settingsJson, categoriesJson, productsJson] = await Promise.all([
        settingsRes.json(),
        categoriesRes.json(),
        productsRes.json(),
      ]);

      if (
        !settingsRes.ok ||
        !categoriesRes.ok ||
        !productsRes.ok ||
        !settingsJson.success ||
        !categoriesJson.success ||
        !productsJson.success
      ) {
        setError("Gagal memuat halaman.");
        return;
      }

      setPayload({
        settings: settingsJson.data,
        categories: categoriesJson.data ?? [],
        products: productsJson.data?.products ?? [],
        totalProducts: productsJson.data?.pagination?.total ?? 0,
        initialLimit: 20,
      });
    } catch {
      setError("Gagal memuat halaman. Periksa koneksi Anda.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const settings = payload?.settings;
  const siteName = settings?.site_name || DEFAULT_SITE_NAME;

  if (error && !payload) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-gray-50">
        <p className="text-gray-600 text-center">{error}</p>
        <Button onClick={() => void load()} variant="outline">
          Coba Lagi
        </Button>
      </main>
    );
  }

  const jsonLd = settings ? buildLandingJsonLd(settings) : null;

  return (
    <main className="min-h-screen overflow-x-hidden">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      <Navbar siteName={siteName} logoUrl={settings?.site_logo} />

      <Hero
        title={settings?.hero_title}
        subtitle={settings?.hero_subtitle}
        imageUrl={settings?.hero_image}
      />

      {isLoading || !payload ? (
        <CatalogSkeleton />
      ) : (
        <BentoCatalog
          products={payload.products}
          categories={payload.categories}
          waNumber={payload.settings.wa_number}
          waMessage={payload.settings.wa_message}
          totalProducts={payload.totalProducts}
          initialLimit={payload.initialLimit}
        />
      )}

      {settings ? (
        <>
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
        </>
      ) : (
        <div className="py-20 bg-white">
          <CatalogSkeleton />
        </div>
      )}
    </main>
  );
}
