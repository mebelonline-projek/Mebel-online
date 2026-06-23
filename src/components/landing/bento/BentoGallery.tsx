"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Grid,
  LayoutGrid,
  Columns,
} from "lucide-react";
import { BentoGrid, BentoCard, BentoContent, type BentoItemSize } from "../BentoGrid";
import { cn } from "@/lib/utils";

// ── Gallery Image Type ──
export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  /** Optional: category/tag for filtering */
  tag?: string;
  /** Optional: size hint for bento layout */
  featured?: boolean;
}

interface BentoGalleryProps {
  images: GalleryImage[];
  title?: string;
  subtitle?: string;
  badge?: string;
  /** Default columns. Default: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" */
  columns?: string;
  className?: string;
}

// ── Layout view modes ──
type LayoutMode = "bento" | "masonry" | "grid";

const layoutModes: { key: LayoutMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { key: "bento", icon: LayoutGrid, label: "Bento" },
  { key: "masonry", icon: Columns, label: "Masonry" },
  { key: "grid", icon: Grid, label: "Grid" },
];

export default function BentoGallery({
  images,
  title = "Galeri",
  subtitle,
  badge = "Galeri Foto",
  columns,
  className,
}: BentoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("bento");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  // Extract unique tags
  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    images.forEach((img) => {
      if (img.tag) tagSet.add(img.tag);
    });
    return Array.from(tagSet);
  }, [images]);

  // Filtered images
  const filteredImages = useMemo(
    () => (activeTag ? images.filter((img) => img.tag === activeTag) : images),
    [images, activeTag]
  );

  // Close lightbox
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  // Navigate
  const prevImage = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev > 0 ? prev - 1 : filteredImages.length - 1) : null
    );
  }, [filteredImages.length]);

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev < filteredImages.length - 1 ? prev + 1 : 0) : null
    );
  }, [filteredImages.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    },
    [closeLightbox, prevImage, nextImage]
  );

  return (
    <section className={cn("py-20 sm:py-28 overflow-x-hidden bg-brand-cream", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 20 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {badge && (
            <span className="inline-block text-sm font-medium text-brand-maroon uppercase tracking-widest mb-3">
              {badge}
            </span>
          )}
          {title && (
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* ── Filter & Layout Controls ── */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.15 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-10"
        >
          {/* Tag filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag(null)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                activeTag === null
                  ? "bg-brand-maroon text-white shadow-sm shadow-brand-maroon/20"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              )}
            >
              Semua
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                  activeTag === tag
                    ? "bg-brand-maroon text-white shadow-sm shadow-brand-maroon/20"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Layout mode toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-white rounded-full border border-gray-200 p-1 shadow-sm">
            {layoutModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.key}
                  onClick={() => setLayoutMode(mode.key)}
                  aria-label={mode.label}
                  className={cn(
                    "p-2 rounded-full transition-all duration-200",
                    layoutMode === mode.key
                      ? "bg-brand-maroon text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Gallery Grid ── */}
        {layoutMode === "bento" && (
          <BentoGrid columns={columns}>
            {filteredImages.map((img, i) => {
              // Featured images get larger spans
              const size: BentoItemSize | undefined = img.featured
                ? "large"
                : i === 0
                  ? "large"
                  : i === 1
                    ? "tall"
                    : i % 5 === 0
                      ? "wide"
                      : i % 7 === 0
                        ? "tall"
                        : undefined;

              return (
                <BentoCard
                  key={img.id}
                  size={size}
                  delay={Math.min(i * 0.03, 0.2)}
                  prefersReduced={prefersReduced === true}
                  className="cursor-pointer"
                  onClick={() => setLightboxIndex(i)}
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Tag badge */}
                  {img.tag && (
                    <div className="absolute top-3 left-3 z-20">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-brand-maroon shadow-sm">
                        {img.tag}
                      </span>
                    </div>
                  )}

                  {/* Zoom icon */}
                  <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <BentoContent>
                    <p className="text-sm text-white/90 drop-shadow-md line-clamp-1 font-medium">
                      {img.alt}
                    </p>
                  </BentoContent>
                </BentoCard>
              );
            })}
          </BentoGrid>
        )}

        {layoutMode === "masonry" && (
          <MasonryGrid>
            {filteredImages.map((img, i) => (
              <motion.div
                key={img.id}
                initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.2) }}
                className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
                style={{ aspectRatio: img.featured ? "4/5" : "3/4" }}
                onClick={() => setLightboxIndex(i)}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-3 left-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-sm text-white drop-shadow-md line-clamp-1 font-medium">
                    {img.alt}
                  </p>
                </div>
                {img.tag && (
                  <div className="absolute top-3 left-3 z-20">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-brand-maroon shadow-sm">
                      {img.tag}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </MasonryGrid>
        )}

        {layoutMode === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((img, i) => (
              <motion.div
                key={img.id}
                initial={prefersReduced ? false : { opacity: 0, scale: 0.9 }}
                whileInView={prefersReduced ? undefined : { opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.02, 0.15) }}
                className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer shadow-sm hover:shadow-lg transition-all duration-500"
                onClick={() => setLightboxIndex(i)}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-2 left-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-xs text-white drop-shadow-md line-clamp-1 font-medium">
                    {img.alt}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredImages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Grid className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Tidak Ada Gambar
            </h3>
            <p className="text-gray-500 text-sm">
              {activeTag
                ? `Tidak ada gambar dengan tag "${activeTag}".`
                : "Belum ada gambar yang ditambahkan."}
            </p>
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredImages[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="dialog"
            aria-modal="true"
            aria-label="Galeri gambar"
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 z-10 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm text-white/80">
              {lightboxIndex + 1} / {filteredImages.length}
            </div>

            {/* Previous */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-[90vw] max-h-[85vh] w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={filteredImages[lightboxIndex].src}
                alt={filteredImages[lightboxIndex].alt}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
              {/* Caption */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-lg text-center">
                <p className="text-sm text-white/80 drop-shadow-lg px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm">
                  {filteredImages[lightboxIndex].alt}
                </p>
              </div>
            </motion.div>

            {/* Next */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
              aria-label="Berikutnya"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Masonry Grid (CSS columns-based) ──
function MasonryGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4",
        className
      )}
    >
      {children}
    </div>
  );
}