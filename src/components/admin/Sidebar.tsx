"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Tags,
  Settings,
  User,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/products", label: "Produk", icon: Package },
  { href: "/admin/dashboard/categories", label: "Kategori", icon: Tags },
  { href: "/admin/dashboard/settings", label: "Pengaturan", icon: Settings },
  { href: "/admin/dashboard/profile", label: "Profil", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/admin/login");
  };

  return (
    <>
      {/* Sidebar — hanya muncul di lg: ke atas */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 flex-col transition-all duration-300 hidden lg:flex ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Brand with Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          {!collapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src="/logo/admin-logo.png"
                  alt="Muara Teweh Furniture"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-maroon leading-tight">
                  Mebel Online
                </p>
                <p className="text-sm font-bold leading-tight">
                  Admin Panel
                </p>
              </div>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0"
            aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-brand-maroon text-white shadow-sm shadow-brand-maroon/20"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Keluar" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
