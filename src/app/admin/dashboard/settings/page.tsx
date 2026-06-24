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
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
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

const SAVE_SECTIONS = [
  "Menyimpan brand & identitas...",
  "Menyimpan hero section...",
  "Menyimpan tentang kami...",
  "Menyimpan kontak & WhatsApp...",
  "Menyimpan jam operasional...",
  "Menyimpan media sosial...",
  "Menyimpan footer...",
  "Menyelesaikan...",
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveMessage, setSaveMessage] = useState("");

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
    setSaveProgress(0);

    // Mulai progress animation
    const progressTimer = setInterval(() => {
      setSaveProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressTimer);
          return 90;
        }
        return prev + 5;
      });
    }, 400);

    try {
      setSaveMessage(SAVE_SECTIONS[0]);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      // Simulasi progress lebih akurat setelah response
      const steps = SAVE_SECTIONS.length;
      for (let i = 1; i < steps; i++) {
        setSaveMessage(SAVE_SECTIONS[i]);
        setSaveProgress(Math.min(Math.round((i / steps) * 95), 95));
        await new Promise((r) => setTimeout(r, 100));
      }

      setSaveProgress(95);
      const data = await res.json();
      
      if (data.success) {
        setSaveProgress(100);
        setSaveMessage("✓ Semua pengaturan berhasil disimpan!");
        await new Promise((r) => setTimeout(r, 800));
        toast.success("Pengaturan berhasil disimpan");
      } else {
        toast.error(data.error || "Gagal menyimpan");
        setSaveProgress(0);
      }
    } catch {
      toast.error("Gagal menyimpan pengaturan");
      setSaveProgress(0);
    } finally {
      clearInterval(progressTimer);
      setIsSaving(false);
      setSaveProgress(0);
      setSaveMessage("");
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
                tipeFoto="logo"
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
                tipeFoto="hero"
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
                tipeFoto="tentang-kami"
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
            {/* Phone, Email, Address */}
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
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              Belum ada jam operasional. Klik "Tambah" untuk menambahkan.
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
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            Tampil di bagian kontak (landing page) & footer. Gunakan "Libur" untuk hari libur.
          </p>
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
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              Belum ada media sosial. Klik "Tambah" untuk menambahkan.
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

        {/* Save Button with Progress Bar */}
        <div className="sticky bottom-0 pb-6">
          {isSaving && (
            <div className="mb-4 bg-white rounded-xl border border-gray-100 p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {saveProgress >= 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-brand-maroon" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {saveMessage || "Menyimpan..."}
                  </span>
                </div>
                <span className="text-xs font-mono text-gray-400">{saveProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    saveProgress >= 100 ? "bg-green-500" : "bg-brand-maroon"
                  }`}
                  style={{ width: `${saveProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
              className="bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl px-8 shadow-lg shadow-brand-maroon/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {saveProgress >= 100 ? "Tersimpan!" : "Menyimpan..."}
                </>
              ) : (
                "Simpan Semua Pengaturan"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}