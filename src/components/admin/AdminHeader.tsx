"use client";

import { useSession } from "next-auth/react";

export default function AdminHeader({ title }: { title: string }) {
  const { data: session } = useSession();

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Logo — hanya 1 di kiri */}
        <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-brand-maroon/20 p-0.5">
          <img
            src="/logo/admin-logo.png"
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">
            {session?.user?.name || "Admin"}
          </p>
          <p className="text-xs text-gray-500">
            {session?.user?.email || ""}
          </p>
        </div>
        {/* Avatar inisial user — bukan logo dobel */}
        <div className="h-9 w-9 rounded-xl bg-brand-maroon flex items-center justify-center text-white text-sm font-semibold ring-2 ring-gray-100 flex-shrink-0">
          {initials}
        </div>
      </div>
    </header>
  );
}
