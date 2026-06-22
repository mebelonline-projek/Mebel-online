import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { getAllSettings } from "@/lib/site-config";
import { AdminSettingsProvider } from "@/contexts/AdminSettingsContext";
import Sidebar from "@/components/admin/Sidebar";
import MobileNav from "@/components/admin/MobileNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import PwaRegister from "@/components/admin/PwaRegister";

export const metadata: Metadata = {
  title: "Dashboard — Admin | Muara Teweh",
  robots: { index: false, follow: false },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const settings = await getAllSettings();

  return (
    <SessionProvider>
      <AdminSettingsProvider siteLogo={settings.site_logo}>
        <PwaRegister />
        <div className="min-h-screen bg-gray-50">
          <Sidebar logoUrl={settings.site_logo} />

          <div className="lg:pl-64 transition-all duration-300 pb-20 lg:pb-0">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>

          <MobileNav />
        </div>
      </AdminSettingsProvider>
    </SessionProvider>
  );
}
