import type { Metadata } from "next";
import Sidebar from "@/components/admin/Sidebar";
import MobileNav from "@/components/admin/MobileNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — Admin | Muara Teweh",
  robots: { index: false, follow: false },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="lg:pl-64 transition-all duration-300 pb-20 lg:pb-0">
        {children}
      </div>

      <MobileNav />
    </div>
  );
}
