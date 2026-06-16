"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import ProductCard from "./ProductCard";
import type { ProductWithCategory, CategoryWithProductCount } from "@/types";

interface ProductGridProps {
  products: ProductWithCategory[];
  categories: CategoryWithProductCount[];
  waNumber?: string;
  waMessage?: string;
}

export default function ProductGrid({
  products,
  categories,
  waNumber,
  waMessage,
}: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>("semua");
  const prefersReduced = useReducedMotion();

  const filteredProducts =
    activeCategory === "semua"
      ? products
      : products.filter((p) => p.category.slug === activeCategory);

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
        {filteredProducts.length === 0 && (
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
              Belum ada produk di kategori ini. Silakan lihat kategori lainnya
              atau kembali lagi nanti.
            </p>
          </motion.div>
        )}

        {/* Product count info */}
        {filteredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12 text-sm text-gray-400"
          >
            Menampilkan {filteredProducts.length} produk
            {activeCategory !== "semua" &&
              ` di kategori ini`}
          </motion.div>
        )}
      </div>
    </section>
  );
}
