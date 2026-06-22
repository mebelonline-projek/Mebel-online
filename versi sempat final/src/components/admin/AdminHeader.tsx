"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Store } from "lucide-react";
import { useAdminSettings } from "@/contexts/AdminSettingsContext";

export default function AdminHeader({ title }: { title: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { siteLogo } = useAdminSettings();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut({ redirect: false });
    router.push("/admin/login");
  };

  return (
    <header className="sticky top-0 z-30 lg:static h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 md:px-6 lg:px-8">
      <div>
        <h1 className="text-base md:text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* User info — hidden on small screens */}
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-gray-900">
            {session?.user?.name || "Admin"}
          </p>
          <p className="text-xs text-gray-500">
            {session?.user?.email || ""}
          </p>
        </div>

        {/* Avatar with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="focus:outline-none"
            aria-label="Menu pengguna"
          >
            <Avatar className="h-9 w-9 ring-2 ring-gray-100 cursor-pointer hover:ring-brand-maroon/30 transition-all">
              {siteLogo ? (
                <AvatarImage
                  src={siteLogo}
                  alt="Logo Toko"
                  className="object-contain p-0.5"
                />
              ) : null}
              <AvatarFallback className="bg-brand-maroon text-white text-xs">
                {siteLogo ? (
                  <Store className="h-4 w-4" />
                ) : session?.user?.name ? (
                  session.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                ) : (
                  "AD"
                )}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              {/* User info (visible only on mobile/tablet) */}
              <div className="px-4 py-2 border-b border-gray-50 md:hidden">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email || ""}
                </p>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/admin/dashboard/profile");
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4 text-gray-400" />
                Profil
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
