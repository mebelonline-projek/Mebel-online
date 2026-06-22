"use client";

import { createContext, useContext } from "react";

interface AdminSettingsContextType {
  siteLogo: string;
}

const AdminSettingsContext = createContext<AdminSettingsContextType>({
  siteLogo: "",
});

export function AdminSettingsProvider({
  siteLogo,
  children,
}: {
  siteLogo: string;
  children: React.ReactNode;
}) {
  return (
    <AdminSettingsContext.Provider value={{ siteLogo }}>
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const ctx = useContext(AdminSettingsContext);
  if (!ctx) {
    throw new Error(
      "useAdminSettings must be used within <AdminSettingsProvider>"
    );
  }
  return ctx;
}
