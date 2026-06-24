"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: string;
  gap?: string;
}

export function BentoGrid({
  children,
  className,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  gap = "gap-4 md:gap-6",
}: BentoGridProps) {
  return (
    <div className={cn("grid auto-rows-[minmax(220px,auto)]", columns, gap, className)}>
      {children}
    </div>
  );
}

export const spanClasses = {
  tall: "sm:row-span-2",
  wide: "sm:col-span-2",
  large: "sm:col-span-2 sm:row-span-2",
  xl: "lg:col-span-2 xl:col-span-3",
  full: "sm:col-span-2 lg:col-span-3 xl:col-span-4",
} as const;

export type BentoItemSize = keyof typeof spanClasses;

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  size?: BentoItemSize;
  delay?: number;
  prefersReduced?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function BentoCard({
  children,
  className,
  size,
  delay = 0,
  prefersReduced = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: BentoCardProps) {
  const reduced = prefersReduced === true;

  return (
    <motion.div
      initial={reduced ? false : { y: 40, scale: 0.88 }}
      whileInView={reduced ? undefined : { y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{
        duration: 0.4,
        delay: Math.min(delay, 0.2),
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      style={{ willChange: "transform" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={cn(
        "gpu-layer group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-500",
        "hover:shadow-xl hover:border-gray-200",
        size && spanClasses[size],
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function BentoImage({
  src,
  alt,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%23f3f4f6'%3E%3Crect width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='16' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
    </div>
  );
}

export function BentoContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative z-10 flex flex-col justify-end h-full p-5 sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoIcon({
  icon: Icon,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white",
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function BentoSection({
  id,
  title,
  subtitle,
  badge,
  children,
  className,
}: {
  id?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <section
      id={id}
      className={cn("py-20 sm:py-28 overflow-x-hidden bg-white", className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(badge || title || subtitle) && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
            whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
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
        )}
        {children}
      </div>
    </section>
  );
}