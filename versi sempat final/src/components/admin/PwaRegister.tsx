"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      // Registrasi service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("✅ PWA Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("⚠️ PWA Service Worker failed:", err);
        });
    }
  }, []);

  return null;
}
