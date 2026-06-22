"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Tags,
  Settings,
  User,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/products", label: "Produk", icon: Package },
  { href: "/admin/dashboard/categories", label: "Kategori", icon: Tags },
  { href: "/admin/dashboard/settings", label: "Setting", icon: Settings },
  { href: "/admin/dashboard/profile", label: "Profil", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/80 backdrop-blur-lg border-t border-gray-200 lg:hidden pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-0.5 min-w-0 w-14 h-full"
            >
              {/* Animated active indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute -top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-brand-maroon"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <Icon
                className={`h-5 w-5 ${
                  isActive ? "text-brand-maroon" : "text-gray-400"
                }`}
              />
              <span
                className={`text-[10px] leading-tight font-medium ${
                  isActive ? "text-brand-maroon" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
