"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import SocialIcon from "@/components/shared/SocialIcon";
import { buildWaLink } from "@/lib/wa";
import type { SocialMediaItem, OperatingHourEntry } from "@/types";

interface ContactSectionProps {
  phone?: string;
  email?: string;
  address?: string;
  waNumber?: string;
  waNumber2?: string;
  waNumber1Label?: string;
  waNumber2Label?: string;
  waMessage?: string;
  operatingHours?: OperatingHourEntry[];
  socialMedia?: SocialMediaItem[];
}

export default function ContactSection({
  phone = "",
  email = "",
  address = "",
  waNumber = "",
  waNumber2 = "",
  waNumber1Label = "Chat & Tlp",
  waNumber2Label = "Chat Only",
  waMessage = "",
  operatingHours = [],
  socialMedia = [],
}: ContactSectionProps) {
  const prefersReduced = useReducedMotion();

  // Build operating hours display
  const hoursText =
    operatingHours.length > 0
      ? operatingHours.map((oh) => `${oh.days}: ${oh.hours}`).join(" | ")
      : "Belum diatur";

  // Contact items — single phone like original
  const contactItems = [
    { icon: MapPin, label: "Alamat", value: address || "Belum diisi" },
    { icon: Phone, label: "Telepon", value: phone || "Belum diisi" },
    { icon: Mail, label: "Email", value: email || "Belum diisi" },
    {
      icon: Clock,
      label: "Jam Operasional",
      value: hoursText,
    },
  ];

  const waButtons = [
    waNumber ? { number: waNumber, label: waNumber1Label, message: waMessage } : null,
    waNumber2 ? { number: waNumber2, label: waNumber2Label, message: waMessage } : null,
  ].filter(Boolean) as { number: string; label: string; message: string }[];

  const hasAnyWa = waButtons.length > 0;

  return (
    <section id="kontak" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReduced ? 0 : 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-medium text-brand-maroon uppercase tracking-widest mb-3">
            Hubungi Kami
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Kami Siap Membantu
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg">
            Punya pertanyaan atau ingin pemesanan? Jangan ragu untuk menghubungi
            kami
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: prefersReduced ? 0 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReduced ? 0 : 0.6 }}
            className="space-y-6"
          >
            {contactItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: prefersReduced ? 0 : 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: prefersReduced ? 0 : 0.4, delay: prefersReduced ? 0 : i * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-maroon/5 flex items-center justify-center shrink-0 group-hover:bg-brand-maroon/10 transition-colors">
                  <item.icon className="h-5 w-5 text-brand-maroon" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {item.label}
                  </p>
                  <p className="text-base font-semibold text-gray-900 mt-0.5">
                    {item.value}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Social Media */}
            {socialMedia.length > 0 && (
              <div className="pt-4">
                <p className="text-sm font-medium text-gray-500 mb-3">
                  Ikuti Kami
                </p>
                <div className="flex gap-3">
                  {socialMedia.map((soc, i) => (
                    <a
                      key={i}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-brand-maroon hover:text-white transition-all duration-300"
                      aria-label={soc.platform}
                    >
                      <SocialIcon platform={soc.platform} className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right: WhatsApp CTA Card */}
          <motion.div
            initial={{ opacity: 0, x: prefersReduced ? 0 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReduced ? 0 : 0.6, delay: prefersReduced ? 0 : 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-brand-maroon to-brand-maroon-dark rounded-3xl p-8 sm:p-10 text-white h-full flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-8 w-8"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Chat WhatsApp Sekarang
                </h3>
                <p className="text-white/70 mb-8 leading-relaxed">
                  Langsung tanyakan produk yang Anda minati melalui WhatsApp.
                  Tim kami akan merespon dengan cepat.
                </p>
              </div>

              {/* WA Buttons */}
              <div className="space-y-3">
                {hasAnyWa ? (
                  waButtons.map((btn, idx) => (
                    <a
                      key={idx}
                      href={buildWaLink(btn.number, btn.message || "Halo, saya ingin bertanya tentang produk furnitur Anda.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full px-4 sm:px-8 py-3 sm:py-4 transition-all duration-300 shadow-lg shadow-black/20 text-sm sm:text-base text-nowrap"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-5 w-5 shrink-0"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      {btn.number} [ {btn.label} ]
                    </a>
                  ))
                ) : (
                  <div className="text-center text-white/50 text-sm py-4">
                    Nomor WhatsApp belum diatur
                  </div>
                )}
              </div>

              {hasAnyWa && (
                <p className="text-white/50 text-sm text-center mt-4">
                  Klik salah satu nomor di atas untuk terhubung via WhatsApp
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
