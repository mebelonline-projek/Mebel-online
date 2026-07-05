"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Semua field wajib diisi." });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "Password baru minimal 8 karakter.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        type: "error",
        text: "Konfirmasi password tidak cocok.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Password berhasil diubah!");
        setMessage({
          type: "success",
          text: "Password berhasil diubah. Gunakan password baru untuk login berikutnya.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({
          type: "error",
          text: data.error || "Gagal mengubah password.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Terjadi kesalahan server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className={`mb-6 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : ""
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Password Saat Ini</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Password Baru</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            minLength={8}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Masukkan password yang sama"
            minLength={8}
            className="h-11"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Menyimpan...
            </>
          ) : (
            "Ubah Password"
          )}
        </Button>
      </form>
    </>
  );
}