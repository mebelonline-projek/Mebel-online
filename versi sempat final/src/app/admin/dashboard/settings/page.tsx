"use client";

import { useState, useEffect, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import ImageUploader from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { SiteSettings, SocialMediaItem, OperatingHourEntry } from "@/types";

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
  wa_number_2: "",
  wa_number_1_label: "Chat & Tlp",
  wa_number_2_label: "Chat Only",
  wa_message: "Halo, saya tertarik dengan produk Anda.",
  contact_phone: "",
  contact_email: "",
  contact_address: "",
  social_media: [],
  operating_hours: [
    { days: "Senin - Jumat", hours: "08:00 - 17:00" },
    { days: "Sabtu", hours: "08:00 - 16:00" },
    { days: "Minggu", hours: "Libur" },
  ],
  footer_description: "Toko furnitur terpercaya untuk rumah impian Anda.",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const addOperatingHour = () => {
    setSettings((prev) => ({
      ...prev,
      operating_hours: [
        ...prev.operating_hours,
        { days: "", hours: "" },
      ],
    }));
  };

  const updateOperatingHour = (index: number, field: keyof OperatingHourEntry, value: string) => {
    setSettings((prev) => {
      const updated = [...prev.operating_hours];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, operating_hours: updated };
    });
  };

  const removeOperatingHour = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      operating_hours: prev.operating_hours.filter((_, i) => i !== index),
    }));
  };

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
              <ImageUploader
                currentImage={settings.site_logo}
                onImageUploaded={(url) => setSettings((p) => ({ ...p, site_logo: url }))}
                folder="settings"
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
              <ImageUploader
                currentImage={settings.hero_image}
                onImageUploaded={(url) => setSettings((p) => ({ ...p, hero_image: url }))}
                folder="settings"
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
              <ImageUploader
                currentImage={settings.about_image}
                onImageUploaded={(url) => setSettings((p) => ({ ...p, about_image: url }))}
                folder="settings"
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
            {/* WA 1 */}
            <div className="space-y-2">
              <Label>Label WA 1</Label>
              <Input
                value={settings.wa_number_1_label}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_number_1_label: e.target.value }))
                }
                placeholder="Chat & Tlp"
              />
            </div>
            <div className="space-y-2">
              <Label>Nomor WhatsApp 1</Label>
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
            {/* WA 2 */}
            <div className="space-y-2">
              <Label>Label WA 2</Label>
              <Input
                value={settings.wa_number_2_label}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_number_2_label: e.target.value }))
                }
                placeholder="Chat Only"
              />
            </div>
            <div className="space-y-2">
              <Label>Nomor WhatsApp 2</Label>
              <Input
                value={settings.wa_number_2}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_number_2: e.target.value }))
                }
                placeholder="6281234567890"
              />
              <p className="text-xs text-gray-400">
                Format: 62xxxx (tanpa + dan spasi)
              </p>
            </div>
            {/* WA Message */}
            <div className="md:col-span-2 space-y-2">
              <Label>Pesan Default WA</Label>
              <Input
                value={settings.wa_message}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, wa_message: e.target.value }))
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                Pesan ini akan terkirim otomatis saat pengunjung klik tombol WA umum.
                Untuk tombol WA di tiap produk, nama produk akan ditambahkan otomatis.
              </p>
            </div>
            {/* Phone (single) */}
            <div className="space-y-2">
              <Label>Nomor Telepon</Label>
              <Input
                value={settings.contact_phone}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, contact_phone: e.target.value }))
                }
                placeholder="(0511) 1234-5678"
              />
            </div>
            {/* Email & Address */}
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
            <div className="space-y-2">
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

        {/* Operating Hours */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Jam Operasional</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOperatingHour}
              className="rounded-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah
            </Button>
          </div>

          {settings.operating_hours.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Belum ada jam operasional. Klik &quot;Tambah&quot; untuk menambahkan.
            </p>
          ) : (
            <div className="space-y-3">
              {settings.operating_hours.map((oh, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Input
                    placeholder="Hari (contoh: Senin - Jumat)"
                    value={oh.days}
                    onChange={(e) => updateOperatingHour(i, "days", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Jam (contoh: 08:00 - 17:00 atau Libur)"
                    value={oh.hours}
                    onChange={(e) => updateOperatingHour(i, "hours", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOperatingHour(i)}
                    className="h-9 w-9 text-gray-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Tampil di bagian kontak (landing page) &amp; footer. Gunakan &quot;Libur&quot; untuk hari libur.
          </p>
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
