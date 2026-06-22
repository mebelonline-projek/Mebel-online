"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Phone, Mail, MessageCircle, ExternalLink } from "lucide-react";
import SocialIcon from "@/components/shared/SocialIcon";
import { buildWaLink } from "@/lib/wa";
import type { SocialMediaItem } from "@/types";

interface ContactSectionProps {
  phone?: string;
  email?: string;
  address?: string;
  waNumber?: string;
  waMessage?: string;
  socialMedia?: SocialMediaItem[];
}

export default function ContactSection({
  phone = "",
  email = "",
  address = "",
  waNumber = "",
  waMessage = "Halo, saya ingin bertanya tentang produk furnitur Anda.",
  socialMedia = [],
}: ContactSectionProps) {
  const prefersReduced = useReducedMotion();

  const contactItems = [
    {
      icon: MapPin,
      label: "Alamat",
      value: address || "Belum diisi",
      href: address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : null,
    },
    {
      icon: Phone,
      label: "Telepon",
      value: phone || "Belum diisi",
      href: phone ? `tel:${phone}` : null,
    },
    {
      icon: Mail,
      label: "Email",
      value: email || "Belum diisi",
      href: email ? `mailto:${email}` : null,
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: waNumber ? "Chat via WhatsApp" : "Belum diisi",
      href: waNumber ? buildWaLink(waNumber, waMessage) : null,
    },
  ];

  return (
    <section id="kontak" className="py-20 sm:py-28 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={prefersReduced ? undefined : { opacity: 0, y: 30 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Hubungi Kami
          </h2>
          <div className="w-16 h-1 bg-brand-orange mx-auto rounded-full mb-4" />
          <p className="text-gray-600 text-lg">
            Punya pertanyaan atau ingin pemesanan? Jangan ragu untuk menghubungi kami.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Info Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {contactItems.map((item, index) => {
              const Icon = item.icon;
              const cardContent = (
                <motion.div
                  initial={prefersReduced ? undefined : { opacity: 0, y: 20 }}
                  whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.1 * index, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-maroon/5 flex items-center justify-center shrink-0 group-hover:bg-brand-maroon/10 transition-colors">
                      <Icon className="h-5 w-5 text-brand-maroon" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {item.label}
                      </h3>
                      <p className="text-gray-600 text-sm break-words">
                        {item.value}
                      </p>
                    </div>
                    {item.href && (
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-brand-maroon hover:text-white transition-all mt-1"
                        aria-label={`Hubungi via ${item.label}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              );

              if (item.href) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="block"
                  >
                    {cardContent}
                  </a>
                );
              }

              return <div key={item.label}>{cardContent}</div>;
            })}
          </div>

          {/* Social Media + CTA */}
          <motion.div
            initial={prefersReduced ? undefined : { opacity: 0, y: 20 }}
            whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 h-fit"
          >
            <h3 className="font-semibold text-gray-900 text-lg mb-4">
              Ikuti Kami
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Dapatkan informasi terbaru seputar produk dan promo melalui media sosial kami.
            </p>

            {socialMedia.length > 0 ? (
              <div className="space-y-3 mb-8">
                {socialMedia.map((soc, i) => (
                  <a
                    key={i}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-brand-maroon/5 transition-colors group"
                  >
                    <SocialIcon platform={soc.icon || soc.platform} className="h-5 w-5 text-brand-maroon" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-brand-maroon transition-colors">
                      {soc.platform}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400 ml-auto" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-8 italic">
                Belum ada media sosial yang ditambahkan.
              </p>
            )}

            {/* WhatsApp CTA */}
            {waNumber && (
              <a
                href={buildWaLink(waNumber, waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-colors shadow-lg shadow-green-500/20"
              >
                <MessageCircle className="h-5 w-5" />
                Chat via WhatsApp
              </a>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}