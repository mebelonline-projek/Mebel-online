"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminHeader({ title }: { title: string }) {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 lg:px-8">
      <div>
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
        <Avatar className="h-9 w-9 ring-2 ring-gray-100">
          <AvatarFallback className="bg-brand-maroon text-white text-xs">
            {session?.user?.name
              ? session.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "AD"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
