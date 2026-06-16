"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Loader2, ChevronDown } from "lucide-react";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import type { ProductWithCategory, CategoryWithProductCount } from "@/types";

interface ProductGridProps {
  products: ProductWithCategory[];
  categories: CategoryWithProductCount[];
  waNumber?: string;
  waMessage?: string;
  totalProducts: number;
  initialLimit: number;
}

export default function ProductGrid({
  products: initialProducts,
  categories,
  waNumber,
  waMessage,
  totalProducts,
  initialLimit,
}: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>("semua");
  const [products, setProducts] = useState<ProductWithCategory[]>(initialProducts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalProducts);
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
      // silent fail — user can retry
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, products.length, initialLimit]);

  const visibleCount = filteredProducts.length;
  const showLoadMore = hasMore && activeCategory === "semua";

  return (
    <section id="katalog" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReduced ? 0 : 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-sm font-medium text-brand-maroon uppercase tracking-widest mb-3">
            Katalog Produk
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Koleksi Furnitur Kami
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg">
            Temukan berbagai pilihan furnitur berkualitas untuk melengkapi
            rumah impian Anda
          </p>
        </motion.div>

        {/* Category Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReduced ? 0 : 0.5, delay: prefersReduced ? 0 : 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          <button
            onClick={() => setActiveCategory("semua")}
            aria-pressed={activeCategory === "semua"}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === "semua"
                ? "bg-brand-maroon text-white shadow-md shadow-brand-maroon/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              aria-pressed={activeCategory === cat.slug}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.slug
                  ? "bg-brand-maroon text-white shadow-md shadow-brand-maroon/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.name}
              <span className="ml-1.5 text-xs opacity-70">
                ({cat._count.products})
              </span>
            </button>
          ))}
        </motion.div>

        {/* Product Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : -20 }}
            transition={{ duration: prefersReduced ? 0 : 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                waNumber={waNumber}
                waMessage={waMessage}
                index={index}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {visibleCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="h-10 w-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum Ada Produk
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {activeCategory === "semua"
                ? "Belum ada produk yang ditampilkan."
                : "Belum ada produk di kategori ini. Silakan lihat kategori lainnya atau kembali lagi nanti."}
            </p>
          </motion.div>
        )}

        {/* Load More Button — only visible in "Semua" view */}
        {showLoadMore && (
          <motion.div
            initial={{ opacity: 0, y: prefersReduced ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReduced ? 0 : 0.4 }}
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

        {/* Product count info */}
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
    </section>
  );
}
