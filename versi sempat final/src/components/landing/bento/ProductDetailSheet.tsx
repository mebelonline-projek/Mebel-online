"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildWaLink } from "@/lib/wa";
import ProductVariantPicker from "@/components/landing/ProductVariantPicker";
import type { ProductWithCategory } from "@/types";

interface ProductDetailSheetProps {
  product: ProductWithCategory | null;
  waNumber?: string;
  waMessage?: string;
  open: boolean;
  onClose: () => void;
}

export default function ProductDetailSheet({
  product,
  waNumber,
  waMessage,
  open,
  onClose,
}: ProductDetailSheetProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Reset state when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageError({});
    if (product?.variants) {
      const defaults: Record<string, string> = {};
      for (const v of product.variants) {
        if (v.options.length > 0) {
          defaults[v.name] = v.options[0].value;
        }
      }
      setSelectedVariants(defaults);
    }
  }, [product]);

  // Build gallery
  const gallery = useMemo(() => {
    if (!product) return [];
    const urls: string[] = [];
    const seen = new Set<string>();
    if (product.image && !seen.has(product.image)) {
      urls.push(product.image);
      seen.add(product.image);
    }
    for (const img of product.images ?? []) {
      if (!seen.has(img)) {
        urls.push(img);
        seen.add(img);
      }
    }
    return urls;
  }, [product]);

  // Variant message for WA
  const variantMessage = useMemo(() => {
    if (!product?.variants) return "";
    const parts: string[] = [];
    for (const v of product.variants) {
      const val = selectedVariants[v.name];
      const opt = v.options.find((o) => o.value === val);
      if (opt) {
        parts.push(`${v.name}=${opt.label}`);
      }
    }
    return parts.length > 0 ? parts.join(", ") : "";
  }, [product?.variants, selectedVariants]);

  const waLink =
    waNumber && product?.name
      ? buildWaLink(
          waNumber,
          (() => {
            const baseMsg = waMessage
              ? `${waMessage}\n\nProduk: ${product.name}`
              : `Halo, saya tertarik dengan produk "${product.name}". Silakan infokan detailnya.`;
            return variantMessage
              ? `${baseMsg}\nVarian: ${variantMessage}`
              : baseMsg;
          })()
        )
      : "#";

  const handleVariantChange = useCallback(
    (groupName: string, value: string) => {
      setSelectedVariants((prev) => ({ ...prev, [groupName]: value }));
    },
    []
  );

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : gallery.length - 1
    );
  }, [gallery.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev < gallery.length - 1 ? prev + 1 : 0
    );
  }, [gallery.length]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!product) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[95] w-full sm:w-[440px] bg-white shadow-2xl overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm text-gray-700 hover:bg-black/20 transition-colors"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image Gallery */}
            <div className="relative w-full aspect-square bg-gray-100">
              {gallery.length > 0 && !imageError[currentImageIndex] ? (
                <>
                  <Image
                    key={currentImageIndex}
                    src={gallery[currentImageIndex]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 440px) 100vw, 440px"
                    className="object-contain"
                    priority
                    onError={() =>
                      setImageError((prev) => ({ ...prev, [currentImageIndex]: true }))
                    }
                  />

                  {/* Nav arrows */}
                  {gallery.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevImage();
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white shadow-sm transition-all"
                        aria-label="Sebelumnya"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextImage();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white shadow-sm transition-all"
                        aria-label="Berikutnya"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Dots */}
                  {gallery.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                      {gallery.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImageIndex(i)}
                          className={`block rounded-full transition-all duration-300 ${
                            i === currentImageIndex
                              ? "bg-brand-maroon w-5 h-2"
                              : "bg-white/60 hover:bg-white/90 h-2 w-2"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Category Badge */}
              {product.category?.name && (
                <Badge
                  variant="secondary"
                  className="bg-brand-maroon/5 text-brand-maroon hover:bg-brand-maroon/10 border-0 text-xs"
                >
                  {product.category.name}
                </Badge>
              )}

              {/* Product Name */}
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {product.name}
              </h2>

              {/* Description */}
              {product.description && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <ProductVariantPicker
                    variants={product.variants}
                    selected={selectedVariants}
                    onChange={handleVariantChange}
                  />
                </div>
              )}

              {/* WA Button */}
              <div className="pt-2">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full text-sm sm:text-base gap-2 py-6 shadow-lg">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Chat WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}