"use client";

import { useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import {
  Loader2,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  Tag,
  Eye,
} from "lucide-react";
import { BentoGrid, BentoCard, BentoContent } from "./BentoGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductDetailSheet from "./ProductDetailSheet";
import { cn } from "@/lib/utils";
import type { ProductWithCategory, CategoryWithProductCount } from "@/types";

interface BentoCatalogProps {
  products: ProductWithCategory[];
  categories: CategoryWithProductCount[];
  waNumber?: string;
  waMessage?: string;
  totalProducts: number;
  initialLimit: number;
}

export default function BentoCatalog({
  products: initialProducts,
  categories,
  waNumber,
  waMessage,
  totalProducts,
  initialLimit,
}: BentoCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<string>("semua");
  const [products, setProducts] = useState<ProductWithCategory[]>(initialProducts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalProducts);
  const [detailProduct, setDetailProduct] = useState<ProductWithCategory | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  const filteredProducts =
    activeCategory === "semua"
      ? products
      : products.filter((p) => p.category.slug === activeCategory);

  const loadMore = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    const nextPage = Math.ceil(products.length / initialLimit) + 1;
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: String(initialLimit),
    });

    try {
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();

      if (data.success) {
        const newProducts: ProductWithCategory[] = data.data.products;
        setProducts((prev) => [...prev, ...newProducts]);
        setHasMore(newProducts.length >= initialLimit);
      }
    } catch {
      // silent fail
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, products.length, initialLimit]);

  // ── Open detail sheet ──
  const openDetail = useCallback((product: ProductWithCategory) => {
    setDetailProduct(product);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
  }, []);

  const visibleCount = filteredProducts.length;
  const showLoadMore = hasMore && activeCategory === "semua";

  return (
    <section id="katalog" className="py-20 sm:py-28 bg-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 20 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-maroon uppercase tracking-widest mb-3">
            <Sparkles className="h-4 w-4" />
            Katalog Produk
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Koleksi Furnitur Kami
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg">
            Temukan berbagai pilihan furnitur berkualitas dengan desain modern
            dan klasik untuk melengkapi rumah impian Anda
          </p>
        </motion.div>

        {/* ── Category Filter Pills ── */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          <button
            onClick={() => setActiveCategory("semua")}
            aria-pressed={activeCategory === "semua"}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
              activeCategory === "semua"
                ? "bg-brand-maroon text-white shadow-md shadow-brand-maroon/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              aria-pressed={activeCategory === cat.slug}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                activeCategory === cat.slug
                  ? "bg-brand-maroon text-white shadow-md shadow-brand-maroon/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {cat.name}
              <span className="ml-1.5 text-xs opacity-70">
                ({cat._count.products})
              </span>
            </button>
          ))}
        </motion.div>

        {/* ── Bento Grid ── */}
        <BentoGrid>
          {filteredProducts.map((product, index) => {
            return renderProductBentoCard(
              product,
              index,
              prefersReduced ?? false,
              openDetail,
              index < 6
            );
          })}
        </BentoGrid>

        {/* ── Empty State ── */}
        {visibleCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum Ada Produk
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {activeCategory === "semua"
                ? "Belum ada produk yang ditampilkan."
                : "Belum ada produk di kategori ini. Silakan lihat kategori lainnya."}
            </p>
          </motion.div>
        )}

        {/* ── Load More ── */}
        {showLoadMore && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 10 }}
            whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mt-12"
          >
            <Button
              onClick={loadMore}
              disabled={isLoadingMore}
              size="lg"
              variant="outline"
              className="rounded-full px-10 h-12 border-gray-300 text-gray-700 hover:bg-brand-maroon hover:text-white hover:border-brand-maroon transition-all duration-300"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  Muat Lainnya
                  <ChevronDown className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* ── Count Info ── */}
        {visibleCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-6 text-sm text-gray-400"
          >
            Menampilkan {visibleCount} produk
            {activeCategory !== "semua" && " di kategori ini"}
            {activeCategory === "semua" && (
              <>
                {" — "}
                {hasMore
                  ? `${Math.min(products.length, totalProducts)} dari ${totalProducts} produk`
                  : `${totalProducts} produk`}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Product Detail Sheet ── */}
      <ProductDetailSheet
        product={detailProduct}
        waNumber={waNumber}
        waMessage={waMessage}
        open={isDetailOpen}
        onClose={closeDetail}
      />
    </section>
  );
}

// ── Render helpers ──

function renderProductBentoCard(
  product: ProductWithCategory,
  index: number,
  prefersReduced?: boolean,
  onDetail?: (product: ProductWithCategory) => void,
  priority?: boolean
) {
  // All cards use standard uniform size for a consistent grid layout

  const images: string[] = [];
  if (product.image) images.push(product.image);
  if (product.images?.length) {
    product.images.forEach((img) => {
      if (!images.includes(img)) images.push(img);
    });
  }
  const coverImage = images[0] || "";
  const hasMultipleImages = images.length > 1;

  return (
    <BentoCard
      key={product.id}
      delay={Math.min(index * 0.03, 0.25)}
      prefersReduced={prefersReduced}
      onClick={() => onDetail?.(product)}
      className={cn(
        "cursor-pointer",
        "bg-white",
        "sm:aspect-[4/3]"
      )}
    >
      {/* Image with overlay */}
      <div className="absolute inset-0 overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-all duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <ShoppingBag className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {/* Gradient overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-500"
          )}
        />
      </div>

      {/* Multi-image indicator dots */}
      {hasMultipleImages && (
        <div className="absolute top-3 right-3 z-20 flex gap-1">
          {images.slice(0, 3).map((_, i) => (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full bg-white/80"
            />
          ))}
        </div>
      )}

      {/* Category badge */}
      {product.category?.name && (
        <div className="absolute top-3 left-3 z-20">
          <Badge
            variant="secondary"
            className="bg-white/90 backdrop-blur-sm text-brand-maroon border-0 text-xs font-medium shadow-sm"
          >
            <Tag className="h-3 w-3 mr-1" />
            {product.category.name}
          </Badge>
        </div>
      )}

      {/* Content overlay */}
      <BentoContent>
        <div className="flex items-end justify-between gap-2">
          {/* Product Name */}
          <h3 className="font-bold text-white drop-shadow-lg text-base sm:text-lg leading-tight flex-1 min-w-0">
            {product.name}
          </h3>

          {/* Detail button - always visible on all screen sizes */}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDetail?.(product);
            }}
            className="shrink-0 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full text-xs gap-1.5 border-0 shadow-lg"
          >
            <Eye className="h-3.5 w-3.5 shrink-0" />
            Lihat Detail
          </Button>
        </div>
      </BentoContent>
    </BentoCard>
  );
}