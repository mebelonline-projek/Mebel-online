"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { MapPin, Phone, Mail, ArrowUp } from "lucide-react";
import type { SocialMediaItem } from "@/types";

interface FooterProps {
  siteName?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  socialMedia?: SocialMediaItem[];
  logoUrl?: string;
}

export default function Footer({
  siteName = "Muara Teweh",
  description = "Toko furnitur terpercaya untuk rumah impian Anda.",
  phone = "",
  email = "",
  address = "",
  socialMedia = [],
  logoUrl = "",
}: FooterProps) {
  const prefersReduced = useReducedMotion();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Focus the navbar after scroll
    const nav = document.querySelector("header");
    if (nav) {
      nav.setAttribute("tabindex", "-1");
      nav.focus();
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      el.setAttribute("tabindex", "-1");
      el.focus();
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gray-950 text-gray-300">
      {/* Top decorative border */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-maroon via-brand-orange to-brand-maroon" />

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <div className="flex items-center gap-3 mb-4">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={siteName}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-lg object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-brand-maroon flex items-center justify-center">
                  <span className="text-white font-bold">MT</span>
                </div>
              )}
              <div>
                <p
                  className="font-tagline text-xs font-semibold tracking-wide"
                  style={{ color: "#B31324" }}
                >
                  Mebel Online
                </p>
                <p className="font-brand text-lg font-bold text-white leading-tight">
                  Muara Teweh
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {description}
            </p>

            {/* Social Media */}
            {socialMedia.length > 0 && (
              <div className="flex gap-3">
                {socialMedia.map((soc, i) => (
                  <a
                    key={i}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-brand-maroon hover:text-white transition-all duration-300"
                    aria-label={soc.platform}
                  >
                    <span className="text-xs font-semibold">
                      {soc.platform.charAt(0).toUpperCase()}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: prefersReduced ? 0 : 0.1 }}
          >
            <h3 className="text-white font-semibold mb-4">Menu</h3>
            <ul className="space-y-3 text-sm">
              {["Beranda", "Katalog", "Tentang", "Kontak"].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => {
                      const map: Record<string, string> = {
                        Beranda: "hero",
                        Katalog: "katalog",
                        Tentang: "tentang",
                        Kontak: "kontak",
                      };
                      scrollToSection(map[item] || "hero");
                    }}
                    className="text-gray-400 hover:text-brand-orange transition-colors"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: prefersReduced ? 0 : 0.2 }}
          >
            <h3 className="text-white font-semibold mb-4">Kontak</h3>
            <ul className="space-y-3 text-sm">
              {phone && (
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-brand-orange mt-0.5 shrink-0" />
                  <span className="text-gray-400">{phone}</span>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-brand-orange mt-0.5 shrink-0" />
                  <span className="text-gray-400">{email}</span>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-brand-orange mt-0.5 shrink-0" />
                  <span className="text-gray-400">{address}</span>
                </li>
              )}
            </ul>
          </motion.div>

          {/* Map Placeholder / Hours */}
          <motion.div
            initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: prefersReduced ? 0 : 0.3 }}
          >
            <h3 className="text-white font-semibold mb-4">Jam Operasional</h3>
            <div className="text-sm text-gray-400 space-y-2">
              <div className="flex justify-between">
                <span>Senin - Jumat</span>
                <span className="text-gray-300">08:00 - 17:00</span>
              </div>
              <div className="flex justify-between">
                <span>Sabtu</span>
                <span className="text-gray-300">08:00 - 16:00</span>
              </div>
              <div className="flex justify-between">
                <span>Minggu</span>
                <span className="text-brand-orange/60">Libur</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} {siteName}. All rights reserved.
          </p>

          {/* Scroll to Top */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-orange transition-colors group"
          >
            Kembali ke atas
            <ArrowUp className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
}
