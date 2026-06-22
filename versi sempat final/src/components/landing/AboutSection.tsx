"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Shield, Star, Truck, Award } from "lucide-react";

interface AboutSectionProps {
  title?: string;
  content?: string;
  imageUrl?: string;
}

export default function AboutSection({
  title = "Tentang Kami",
  content = "",
  imageUrl = "",
}: AboutSectionProps) {
  const prefersReduced = useReducedMotion();
  const features = [
    {
      icon: Star,
      label: "Produk Berkualitas",
      desc: "Material pilihan dengan finishing terbaik",
    },
    {
      icon: Truck,
      label: "Pengiriman Aman",
      desc: "Dikemas dengan standar tinggi",
    },
    {
      icon: Shield,
      label: "Garansi Kepuasan",
      desc: "Pastikan sesuai sebelum diterima",
    },
    {
      icon: Award,
      label: "Terpercaya",
      desc: "Melayani pelanggan dengan sepenuh hati",
    },
  ];

  return (
    <section id="tentang" className="py-20 sm:py-28 bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: prefersReduced ? 0 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReduced ? 0 : 0.7 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-maroon/10 to-brand-orange/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-brand-maroon/10 flex items-center justify-center">
                      <Award className="h-12 w-12 text-brand-maroon" />
                    </div>
                    <p className="text-gray-400 text-sm">Foto Toko</p>
                  </div>
                </div>
              )}
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReduced ? 0 : 0.5, delay: prefersReduced ? 0 : 0.4 }}
              className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg p-4 hidden sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-brand-orange fill-brand-orange" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">100%</p>
                  <p className="text-xs text-gray-500">Kepuasan Pelanggan</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: prefersReduced ? 0 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReduced ? 0 : 0.7, delay: prefersReduced ? 0 : 0.2 }}
          >
            <span className="inline-block text-sm font-medium text-brand-maroon uppercase tracking-widest mb-3">
              Tentang Kami
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {title}
            </h2>
            <div className="text-gray-600 leading-relaxed mb-8 space-y-4">
              {content ? (
                content.split("\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))
              ) : (
                <>
                  <p>
                    Kami adalah toko furnitur terpercaya{" "}
                    <span className="font-semibold text-brand-maroon">
                      Muara Teweh
                    </span>{" "}
                    yang menyediakan berbagai pilihan perabot rumah tangga
                    berkualitas.
                  </p>
                  <p>
                    Dengan pengalaman bertahun-tahun, kami berkomitmen untuk
                    memberikan produk terbaik dengan pelayanan yang ramah dan
                    profesional untuk setiap pelanggan.
                  </p>
                </>
              )}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: prefersReduced ? 0 : 0.4, delay: prefersReduced ? 0 : 0.3 + i * 0.1 }}
                  className="bg-white rounded-xl p-4 border border-gray-100"
                >
                  <feature.icon className="h-5 w-5 text-brand-maroon mb-2" />
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {feature.label}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
