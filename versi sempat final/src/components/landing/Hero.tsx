"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

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

  // Auto-size title based on text length — prevents overflow
  const titleClasses = (() => {
    const len = title.length;
    if (len <= 18) return "text-5xl sm:text-6xl md:text-7xl lg:text-8xl";
    if (len <= 30) return "text-4xl sm:text-5xl md:text-6xl lg:text-7xl";
    if (len <= 45) return "text-3xl sm:text-4xl md:text-5xl lg:text-6xl";
    return "text-2xl sm:text-3xl md:text-4xl lg:text-5xl";
  })();

  // Auto-size subtitle based on text length
  const subtitleClasses = (() => {
    const len = subtitle.length;
    if (len <= 60) return "text-xl sm:text-2xl";
    if (len <= 100) return "text-lg sm:text-xl";
    return "text-base sm:text-lg";
  })();

  return (
    <section
      id="hero"
      ref={ref}
      className="relative h-screen min-h-[450px] sm:min-h-[600px] max-h-[900px] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Parallax */}
      <motion.div style={{ y: parallaxY, scale }} className="absolute inset-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover object-center sm:object-[65%_50%]"
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
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm border border-white/10">
            <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
            Toko Furnitur Terpercaya
          </span>
        </motion.div>

        {/* Title — word-by-word reveal, auto-sizes based on text length */}
        <h1 className={`${titleClasses} font-bold text-white mb-4 leading-tight drop-shadow-lg text-balance overflow-wrap-break-word`}>
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

        {/* Subtitle — auto-sizes based on text length */}
        <motion.p
          initial={{ opacity: 0, y: prefersReduced ? 0 : 15, scale: prefersReduced ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: prefersReduced ? 0 : 0.7, delay: prefersReduced ? 0 : 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`${subtitleClasses} text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty overflow-wrap-break-word`}
        >
          {subtitle}
        </motion.p>

        {/* ── Minimal Typographic Scroll Cue — pure typography, not a button ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReduced ? 0 : 1.2, delay: prefersReduced ? 0 : 1.8 }}
          className="mt-14 sm:mt-20 pointer-events-none select-none"
        >
          <div className="flex flex-col items-center gap-5">

            {/* Thin decorative line */}
            <motion.div
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: prefersReduced ? 0 : 1, delay: prefersReduced ? 0 : 2.2 }}
              className="origin-center w-16 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />

            {/* Main text — floating, elegant */}
            <div className="relative flex flex-col items-center gap-1.5">
              <motion.p
                aria-hidden="true"
                animate={prefersReduced ? {} : {
                  y: [0, -3, 0],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-white/50 text-xs sm:text-sm font-light tracking-[0.35em] uppercase"
              >
                Scroll
              </motion.p>
              <motion.p
                aria-hidden="true"
                animate={prefersReduced ? {} : {
                  y: [0, -3, 0],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                className="text-white/50 text-[10px] sm:text-xs font-light tracking-[0.25em] uppercase"
              >
                Ke bawah untuk menjelajahi
              </motion.p>
            </div>

            {/* Animated chevron */}
            <motion.svg
              aria-hidden="true"
              animate={prefersReduced ? {} : { y: [0, 5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              className="text-white/30"
            >
              <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
