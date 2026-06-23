"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Upload } from "lucide-react";

interface ImageUploaderProps {
  currentImage: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  folder?: string;
  disabled?: boolean;
}

export default function ImageUploader({
  currentImage,
  onImageUploaded,
  onImageRemoved,
  folder = "general",
  disabled = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        // Hapus preview lokal setelah upload sukses
        if (localPreview) URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
        onImageUploaded(data.data.url);
      } else {
        // Fallback: kalau gagal, reset
        if (localPreview) URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
        throw new Error(data.error || "Gagal upload");
      }
    } catch {
      toast.error("Gagal mengupload gambar");
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Tampilkan preview lokal dulu
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);

    // Upload ke Supabase
    handleUpload(file);
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const hasImage = currentImage || localPreview;
  const displaySrc = localPreview || currentImage;

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      <div
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload gambar produk"
        className={cn(
          "relative w-full overflow-hidden rounded-xl border-2 transition-all duration-200",
          "aspect-[4/3] cursor-pointer",
          !hasImage &&
            "border-dashed border-gray-300 bg-gray-50 hover:border-brand-maroon/50 hover:bg-brand-maroon/5",
          hasImage &&
            "border-solid border-gray-200 hover:border-brand-maroon/40",
          (disabled || uploading) && "pointer-events-none opacity-60"
        )}
      >
        {hasImage ? (
          <>
            <Image
              src={displaySrc!}
              alt="Preview gambar produk"
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 50vw"
            />

            {/* Overlay hover — Ganti & Hapus */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 hover:bg-black/40">
              <div className="flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 opacity-0 shadow-sm transition-opacity duration-200 hover:opacity-100 cursor-pointer">
                <Upload className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">
                  Ganti Foto
                </span>
              </div>
              {onImageRemoved && currentImage && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await fetch("/api/upload/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: currentImage }),
                      });
                    } catch {
                      // silent fail
                    }
                    onImageRemoved();
                  }}
                  className="flex items-center gap-2 rounded-lg bg-red-500/90 px-4 py-2 opacity-0 shadow-sm transition-opacity duration-200 hover:opacity-100 hover:bg-red-600 text-white text-sm font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  Hapus
                </button>
              )}
            </div>

            {/* Loading overlay */}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  <span className="text-sm font-medium text-white">
                    Mengupload...
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
            <div className="rounded-full bg-white p-3 shadow-sm">
              <ImagePlus className="h-6 w-6 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">
                Klik untuk upload gambar
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                JPG, PNG, WebP, AVIF — Maks 5MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
