"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorFallbackProps {
  error?: Error | null;
  onReset?: () => void;
}

export default function ErrorFallback({
  error,
  onReset,
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Terjadi Kesalahan
        </h2>
        <p className="text-gray-500 mb-2">
          Maaf, terjadi kesalahan saat memuat bagian ini. Silakan coba lagi.
        </p>
        {error && process.env.NODE_ENV === "development" && (
          <p className="text-xs text-gray-400 mb-4 font-mono bg-gray-50 rounded-lg p-3 text-left break-all">
            {error.message}
          </p>
        )}
        {onReset && (
          <Button
            onClick={onReset}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </Button>
        )}
      </div>
    </div>
  );
}
