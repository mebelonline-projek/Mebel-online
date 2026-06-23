import type { MetadataRoute } from "next";
import { getSupabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.AUTH_URL || "https://tokofurnitur.com";

  // Static routes
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  // Fetch all active products for sitemap
  try {
    const supabase = getSupabase();
    const { data: products } = await supabase
      .from("Product")
      .select("slug, updatedAt")
      .eq("isActive", true)
      .order("sortOrder", { ascending: true });

    if (products && products.length > 0) {
      const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
        url: `${baseUrl}/produk/${product.slug}`,
        lastModified: new Date(product.updatedAt || Date.now()),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

      return [...staticEntries, ...productEntries];
    }
  } catch (error) {
    console.error("Error generating sitemap products:", error);
  }

  return staticEntries;
}