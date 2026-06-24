"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

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
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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

  const words = title.split(" ");

  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .hw { opacity: 1 !important; transform: none !important; animation: none !important; }
          .hd { transform: none !important; animation: none !important; }
          .hs { opacity: 1 !important; transform: none !important; animation: none !important; }
          .hsc { opacity: 0 !important; }
        }
        @keyframes hwR {
          from { opacity: 0; transform: translateY(25px) scale(.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hdR {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes hsR {
          from { opacity: 0; transform: translateY(15px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hP {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        @keyframes hB {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes hC {
          0%, 100% { transform: translateY(0); opacity: .4; }
          50% { transform: translateY(5px); opacity: .8; }
        }
        .hw { display: inline-block; margin-right: .3em; opacity: 0; animation: hwR .6s ease-out forwards; }
        .hw:last-child { margin-right: 0; }
        .hd { transform-origin: center; transform: scaleX(0); animation: hdR .8s ease-out .85s forwards; }
        .hs { opacity: 0; animation: hsR .7s ease-out .9s forwards; }
      `}</style>
      <section
        id="hero"
        ref={ref}
        className="relative h-screen min-h-[450px] sm:min-h-[600px] max-h-[900px] flex items-center justify-center overflow-hidden"
      >
        {/* Background Image with Parallax */}
        <motion.div style={{ y: parallaxY }} className="absolute inset-0">
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
          style={{ opacity: contentOpacity }}
          className="relative z-10 max-w-4xl mx-auto px-4 text-center"
        >
          {/* Animated Brand Badge */}
          <div
            style={{ animation: 'hsR .6s ease-out .2s both' }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm border border-white/10">
              <span className="w-2 h-2 rounded-full bg-brand-orange" style={{ animation: 'hP 2s ease-in-out infinite' }} />
              Toko Furnitur Terpercaya
            </span>
          </div>

          {/* Title — word-by-word reveal via CSS animation */}
          <h1 className={`${titleClasses} font-bold text-white mb-4 leading-tight drop-shadow-lg text-balance`}>
            {words.map((word, i) => (
              <span
                key={i}
                className="hw"
                style={{ animationDelay: `${0.4 + i * 0.08}s` }}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Decorative Divider — CSS animation */}
          <div className="hd w-24 h-0.5 bg-gradient-to-r from-brand-orange/0 via-brand-orange to-brand-orange/0 mx-auto mb-6" />

          {/* Subtitle — CSS animation */}
          <p className={`${subtitleClasses} text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty hs`}>
            {subtitle}
          </p>

          {/* Scroll Cue — CSS animation */}
          <div
            style={{ animation: 'hsR 1.2s ease-out 1.8s both' }}
            className="mt-14 sm:mt-20 pointer-events-none select-none"
          >
            <div className="flex flex-col items-center gap-5">
              {/* Thin decorative line */}
              <div
                aria-hidden="true"
                className="origin-center w-16 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{ animation: 'hdR 1s ease-out 2.2s both' }}
              />

              {/* Main text */}
              <div className="relative flex flex-col items-center gap-1.5">
                <p
                  aria-hidden="true"
                  className="text-white/50 text-xs sm:text-sm font-light tracking-[0.35em] uppercase"
                  style={{ animation: 'hB 2.5s ease-in-out infinite' }}
                >
                  Scroll
                </p>
                <p
                  aria-hidden="true"
                  className="text-white/50 text-[10px] sm:text-xs font-light tracking-[0.25em] uppercase"
                  style={{ animation: 'hB 2.5s ease-in-out .15s infinite' }}
                >
                  Ke bawah untuk menjelajahi
                </p>
              </div>

              {/* Animated chevron */}
              <svg
                aria-hidden="true"
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                className="text-white/30"
                style={{ animation: 'hC 1.8s ease-in-out .3s infinite' }}
              >
                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}