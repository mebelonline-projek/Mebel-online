import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/admin/Sidebar";
import MobileNav from "@/components/admin/MobileNav";
import ErrorBoundary from "@/components/ErrorBoundary";

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
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />

        <div className="lg:pl-64 transition-all duration-300 pb-20 lg:pb-0">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>

        <MobileNav />
      </div>
    </SessionProvider>
  );
}
