"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
interface NavbarProps {
  siteName?: string;
  logoUrl?: string;
}

export default function Navbar({
  siteName = "Muara Teweh",
  logoUrl = "",
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setIsMobileOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      // Pindahkan fokus ke heading section untuk keyboard users
      el.setAttribute("tabindex", "-1");
      el.focus();
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Logo + Brand Text */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Logo */}
            {logoUrl ? (
              <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden ring-2 ring-brand-maroon/10">
                <Image
                  src={logoUrl}
                  alt={siteName}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 shrink-0 rounded-lg bg-brand-maroon flex items-center justify-center">
                <span className="text-white font-brand text-xl">MT</span>
              </div>
            )}

            {/* Brand Text — Vertical Stack */}
            <div className="flex flex-col leading-none">
              <span
                className="font-tagline font-semibold text-sm sm:text-base tracking-wide"
                style={{ color: "#B31324" }}
              >
                Mebel Online
              </span>
              <span className="font-brand font-bold text-xl sm:text-2xl tracking-tight">
                <span style={{ color: "#B31324" }}>Muara</span>{" "}
                <span style={{ color: "#F5A300" }}>Teweh</span>
              </span>
            </div>
          </Link>

          {/* Center: Category Nav — Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => scrollToSection("hero")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                isScrolled
                  ? "text-gray-700 hover:text-brand-maroon hover:bg-brand-maroon/5"
                  : "text-gray-200 hover:text-white"
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => scrollToSection("katalog")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                isScrolled
                  ? "text-gray-700 hover:text-brand-maroon hover:bg-brand-maroon/5"
                  : "text-gray-200 hover:text-white"
              }`}
            >
              Katalog
            </button>
<button
              onClick={() => scrollToSection("tentang")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                isScrolled
                  ? "text-gray-700 hover:text-brand-maroon hover:bg-brand-maroon/5"
                  : "text-gray-200 hover:text-white"
              }`}
            >
              Tentang
            </button>
            <button
              onClick={() => scrollToSection("kontak")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                isScrolled
                  ? "text-gray-700 hover:text-brand-maroon hover:bg-brand-maroon/5"
                  : "text-gray-200 hover:text-white"
              }`}
            >
              Kontak
            </button>
          </nav>

          {/* Right: WA Button — Desktop */}
          <div className="hidden md:flex items-center">
            <Button
              onClick={() => scrollToSection("kontak")}
              size="sm"
              className="bg-brand-maroon hover:bg-brand-maroon-dark text-white font-medium rounded-full px-5"
            >
              Hubungi Kami
            </Button>
          </div>

          {/* Mobile: Hamburger */}
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger
              className={`md:hidden p-2 rounded-lg transition-colors cursor-pointer ${
                isScrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"
              }`}
              aria-label="Buka menu navigasi"
              aria-expanded={isMobileOpen}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menu navigasi</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-6">
              <div className="flex flex-col gap-2 mt-8">
                <button
                  onClick={() => scrollToSection("hero")}
                  className="text-left px-4 py-3 text-lg font-medium rounded-lg hover:bg-brand-maroon/5 hover:text-brand-maroon transition-colors"
                >
                  Beranda
                </button>
                <button
                  onClick={() => scrollToSection("katalog")}
                  className="text-left px-4 py-3 text-lg font-medium rounded-lg hover:bg-brand-maroon/5 hover:text-brand-maroon transition-colors"
                >
                  Katalog
                </button>
                <button
                  onClick={() => scrollToSection("tentang")}
                  className="text-left px-4 py-3 text-lg font-medium rounded-lg hover:bg-brand-maroon/5 hover:text-brand-maroon transition-colors"
                >
                  Tentang
                </button>
                <button
                  onClick={() => scrollToSection("kontak")}
                  className="text-left px-4 py-3 text-lg font-medium rounded-lg hover:bg-brand-maroon/5 hover:text-brand-maroon transition-colors"
                >
                  Kontak
                </button>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button className="w-full bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-full">
                    Hubungi Kami
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
