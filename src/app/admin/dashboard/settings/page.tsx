"use client";

import { useState, useEffect, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ImageIcon } from "lucide-react";
import type { SiteSettings, SocialMediaItem } from "@/types";

const defaultSettings: SiteSettings = {
  site_logo: "",
  site_name: "Muara Teweh",
  hero_title: "Furnitur Impian untuk Rumah Anda",
  hero_subtitle: "Temukan koleksi furnitur berkualitas dengan desain modern.",
  hero_image: "",
  about_title: "Tentang Kami",
  about_content: "Kami adalah toko furnitur terpercaya...",
  about_image: "",
  wa_number: "",
  wa_message: "Halo, saya tertarik dengan produk Anda.",
  contact_phone: "",
  contact_email: "",
  contact_address: "",
  social_media: [],
  footer_description: "Toko furnitur terpercaya untuk rumah impian Anda.",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch {
      toast.error("Gagal memuat pengaturan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pengaturan berhasil disimpan");
      } else {
        toast.error(data.error || "Gagal menyimpan");
      }
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (file: File, key: string) => {
    setUploading(key);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "settings");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setSettings((prev) => ({ ...prev, [key]: data.data.url }));
        toast.success("Gambar berhasil diupload");
      } else {
        toast.error(data.error || "Gagal upload");
      }
    } catch {
      toast.error("Gagal upload gambar");
    } finally {
      setUploading(null);
    }
  };

  const addSocialMedia = () => {
    setSettings((prev) => ({
      ...prev,
      social_media: [
        ...prev.social_media,
        { platform: "", url: "", icon: "" },
      ],
    }));
  };

  const updateSocialMedia = (index: number, field: keyof SocialMediaItem, value: string) => {
    setSettings((prev) => {
      const updated = [...prev.social_media];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, social_media: updated };
    });
  };

  const removeSocialMedia = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      social_media: prev.social_media.filter((_, i) => i !== index),
    }));
  };

  const ImageUpload = ({ value, onUpload, label, onChange }: { value: string; onUpload: (f: File) => void; label: string; onChange: (val: string) => void }) => (
    <div className="flex items-center gap-3">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`URL ${label} atau upload`}
        className="flex-1"
      />
      <div className="relative">
        <input
          id={`image-upload-${label}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
        <Button type="button" variant="outline" disabled={uploading === label} className="rounded-xl cursor-pointer" onClick={() => document.getElementById(`image-upload-${label}`)?.click()}>
          {uploading === label ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <>
        <AdminHeader title="Pengaturan Landing Page" />
        <div className="p-6 lg:p-8 space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Pengaturan Landing Page" />

      <div className="p-6 lg:p-8 space-y-8">
        {/* Brand */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Brand & Identitas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Logo Toko</Label>
              <ImageUpload
                value={settings.site_logo}
                onUpload={(f) => handleUpload(f, "site_logo")}
                onChange={(val) => setSettings((p) => ({ ...p, site_logo: val }))}
                label="site_logo"
              />
            </div>
            <div className="space-y-2">
              <Label>Nama Toko</Label>
              <Input
                value={settings.site_name}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, site_name: e.target.value }))
                }
              />
            </div>
          </div>
        </section>

        {/* Hero */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Hero Section</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Judul Hero</Label>
              <Input
                value={settings.hero_title}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, hero_title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Gambar Hero</Label>
              <ImageUpload
                value={settings.hero_image}
                onUpload={(f) => handleUpload(f, "hero_image")}
                onChange={(val) => setSettings((p) => ({ ...p, hero_image: val }))}
                label="hero_image"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Subtitle Hero</Label>
              <Textarea
                value={settings.hero_subtitle}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, hero_subtitle: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
        </section>

        {/* About */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Tentang Kami</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Judul Tentang</Label>
              <Input
                value={settings.about_title}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, about_title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Gambar Tentang</Label>
              <ImageUpload
                value={settings.about_image}
                onUpload={(f) => handleUpload(f, "about_image")}
                onChange={(val) => setSettings((p) => ({ ...p, about_image: val }))}
                label="about_image"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Konten Tentang</Label>
              <Textarea
                value={settings.about_content}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, about_content: e.target.value }))
                }
                rows={4}
              />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Kontak & WhatsApp</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Nomor WhatsApp</Label>
              <Input
                value={settings.wa_number}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_number: e.target.value }))
                }
                placeholder="6281234567890"
              />
              <p className="text-xs text-gray-400">
                Format: 62xxxx (tanpa + dan spasi)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Pesan Default WA</Label>
              <Input
                value={settings.wa_message}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_message: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Nomor Telepon</Label>
              <Input
                value={settings.contact_phone}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, contact_phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email Kontak</Label>
              <Input
                value={settings.contact_email}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, contact_email: e.target.value }))
                }
                type="email"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Alamat</Label>
              <Textarea
                value={settings.contact_address}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, contact_address: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
        </section>

        {/* Social Media */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Media Sosial</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSocialMedia}
              className="rounded-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah
            </Button>
          </div>

          {settings.social_media.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Belum ada media sosial. Klik &quot;Tambah&quot; untuk menambahkan.
            </p>
          ) : (
            <div className="space-y-3">
              {settings.social_media.map((soc, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Input
                    placeholder="Platform (Instagram, Facebook...)"
                    value={soc.platform}
                    onChange={(e) => updateSocialMedia(i, "platform", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL"
                    value={soc.url}
                    onChange={(e) => updateSocialMedia(i, "url", e.target.value)}
                    className="flex-[2]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSocialMedia(i)}
                    className="h-9 w-9 text-gray-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Footer</h2>
          <div className="space-y-2">
            <Label>Deskripsi Footer</Label>
            <Textarea
              value={settings.footer_description}
              onChange={(e) =>
                setSettings((p) => ({ ...p, footer_description: e.target.value }))
              }
              rows={2}
            />
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end sticky bottom-0 pb-6">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl px-8 shadow-lg shadow-brand-maroon/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Menyimpan...
              </>
            ) : (
              "Simpan Semua Pengaturan"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
