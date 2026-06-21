"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
}

export default function Hero({
  title = "Furnitur Impian untuk Rumah Anda",
  subtitle = "Temukan koleksi furnitur berkualitas dengan desain modern dan klasik untuk setiap sudut rumah Anda.",
  imageUrl = "",
}: HeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReduced ? "0%" : "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, prefersReduced ? 1 : 1.05]);

  const scrollToCatalog = () => {
    const el = document.getElementById("katalog");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      el.setAttribute("tabindex", "-1");
      el.focus();
    }
  };

  const scrollToAbout = () => {
    const el = document.getElementById("tentang");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      el.setAttribute("tabindex", "-1");
      el.focus();
    }
  };

  return (
    <section
      id="hero"
      ref={ref}
      className="relative h-screen min-h-[600px] max-h-[900px] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Parallax */}
      <motion.div style={{ y: parallaxY, scale }} className="absolute inset-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover object-[65%_50%]"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-brand-maroon-dark" />
        )}
      </motion.div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-brand-maroon/20 blur-3xl" />

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-4xl mx-auto px-4 text-center"
      >
        {/* Animated Brand Badge */}
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.6, delay: 0.2 }}
          className="mb-6"
        >{/*  */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm border border-white/10">
            <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
            Toko Furnitur Terpercaya
          </span>
        </motion.div>

        {/* Title — word-by-word reveal */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
          {prefersReduced ? (
            title
          ) : (
            title.split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 25, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="inline-block mr-[0.3em] last:mr-0"
              >
                {word}
              </motion.span>
            ))
          )}
        </h1>

        {/* Decorative Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: prefersReduced ? 0 : 0.8, delay: prefersReduced ? 0 : 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="origin-center w-24 h-0.5 bg-gradient-to-r from-brand-orange/0 via-brand-orange to-brand-orange/0 mx-auto mb-6"
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: prefersReduced ? 0 : 15, scale: prefersReduced ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: prefersReduced ? 0 : 0.7, delay: prefersReduced ? 0 : 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {subtitle}
        </motion.p>

        {/* CTA Buttons — staggered entrance */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.div
            initial={{ opacity: 0, y: prefersReduced ? 0 : 20, scale: prefersReduced ? 1 : 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: prefersReduced ? 0 : 0.5, delay: prefersReduced ? 0 : 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Button
              onClick={scrollToCatalog}
              size="lg"
              className="bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-full px-8 py-6 text-lg font-medium shadow-lg shadow-brand-maroon/30 hover:shadow-xl hover:shadow-brand-maroon/40 transition-all duration-300"
              aria-label="Lihat Koleksi Produk"
            >
              Lihat Koleksi
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: prefersReduced ? 0 : 20, scale: prefersReduced ? 1 : 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: prefersReduced ? 0 : 0.5, delay: prefersReduced ? 0 : 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Button
              onClick={scrollToAbout}
              variant="outline"
              size="lg"
              className="border-white/30 text-white bg-transparent hover:bg-white/10 rounded-full px-8 py-6 text-lg"
              aria-label="Tentang Kami"
            >
              Tentang Kami
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: prefersReduced ? 0 : 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={prefersReduced ? {} : { y: [0, 8, 0] }}
          transition={prefersReduced ? {} : { duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-white/50 cursor-pointer"
          onClick={scrollToCatalog}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') scrollToCatalog(); }}
          aria-label="Scroll ke katalog produk"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ArrowDown className="h-4 w-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
