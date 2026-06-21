"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildWaLink } from "@/lib/wa";
import ProductVariantPicker from "./ProductVariantPicker";
import type { ProductWithCategory } from "@/types";

interface ProductCardProps {
  product: ProductWithCategory;
  waNumber?: string;
  waMessage?: string;
  priority?: boolean;
  delayMs?: number;
}

export default function ProductCard({
  product,
  waNumber = "",
  waMessage = "Halo, saya tertarik dengan produk ini.",
  priority = false,
  delayMs = 0,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const prefersReduced = useReducedMotion();

  // State untuk varian yang dipilih
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >(() => {
    // Default: pilih opsi pertama setiap grup
    const defaults: Record<string, string> = {};
    for (const v of product.variants ?? []) {
      if (v.options.length > 0) {
        defaults[v.name] = v.options[0].value;
      }
    }
    return defaults;
  });

  const handleVariantChange = (groupName: string, value: string) => {
    setSelectedVariants((prev) => ({ ...prev, [groupName]: value }));
  };

  // Build variant message string
  const variantMessage = useMemo(() => {
    const parts: string[] = [];
    for (const v of product.variants ?? []) {
      const val = selectedVariants[v.name];
      const opt = v.options.find((o) => o.value === val);
      if (opt) {
        parts.push(`${v.name}=${opt.label}`);
      }
    }
    return parts.length > 0 ? parts.join(", ") : "";
  }, [product.variants, selectedVariants]);

  const waLink = waNumber
    ? buildWaLink(
        waNumber,
        (() => {
          const baseMsg = waMessage
            ? `${waMessage}\n\nProduk: ${product.name}`
            : `Halo, saya tertarik dengan produk "${product.name}". Silakan infokan detailnya.`;
          return variantMessage ? `${baseMsg}\nVarian: ${variantMessage}` : baseMsg;
        })()
      )
    : "#";

  return (
    <motion.div
      initial={prefersReduced ? false : { y: 40, scale: 0.88 }}
      whileInView={prefersReduced ? undefined : { y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={prefersReduced ? undefined : {
        duration: 0.6,
        delay: delayMs / 1000,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 gpu-layer"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {product.image && !imageError ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageError(true)}
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* WA Button on Hover (Desktop) */}
        {waNumber && (
          <div
            className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300"
            aria-hidden="true"
          >
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg text-sm gap-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Hubungi WhatsApp
              </Button>
            </a>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category Badge */}
        <Badge
          variant="secondary"
          className="bg-brand-maroon/5 text-brand-maroon hover:bg-brand-maroon/10 border-0 mb-2 text-xs"
        >
          {product.category.name}
        </Badge>

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-1">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-1 min-h-[2.5rem]">
            {product.description}
          </p>
        )}

        {/* Variant Picker */}
        {product.variants && product.variants.length > 0 && (
          <ProductVariantPicker
            variants={product.variants}
            selected={selectedVariants}
            onChange={handleVariantChange}
          />
        )}

        {/* Mobile WA Button */}
        <div className="sm:hidden">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full text-sm gap-2 mt-2">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
