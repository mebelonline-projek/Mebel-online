import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/admin/Sidebar";
import ErrorBoundary from "@/components/ErrorBoundary";

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

        <div className="lg:pl-64 transition-all duration-300">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </div>
    </SessionProvider>
  );
}
