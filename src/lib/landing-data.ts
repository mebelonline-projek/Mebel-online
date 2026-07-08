import type {
  CategoryWithProductCount,
  ProductWithCategory,
  SiteSettings,
} from "@/types";

export const INITIAL_PRODUCT_LIMIT = 20;

export type LandingPayload = {
  settings: SiteSettings;
  categories: CategoryWithProductCount[];
  products: ProductWithCategory[];
  totalProducts: number;
  initialLimit: number;
};

export function buildLandingJsonLd(settings: SiteSettings): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.site_name || "Muara Teweh",
    description: settings.hero_subtitle || "Toko furnitur terpercaya.",
    image: settings.hero_image || undefined,
    url: process.env.AUTH_URL || "https://mebelonline.id",
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
            .filter((s) => s.url)
            .map((s) => s.url),
        }
      : {}),
  };
}
