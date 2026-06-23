"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validasi client-side
      if (!email.trim()) {
        setError("Email tidak boleh kosong.");
        setIsLoading(false);
        return;
      }
      if (!password.trim()) {
        setError("Password tidak boleh kosong.");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (!result) {
        setError("Tidak ada respons dari server. Silakan coba lagi.");
        setIsLoading(false);
        return;
      }

      if (result.error) {
        // NextAuth v5 mengembalikan "CredentialsSignin" untuk kredensial salah
        setError("Email atau password salah.");
        setIsLoading(false);
        return;
      }

      if (result.ok) {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-4 mx-auto">
            {/* Decorative frame */}
            <div className="absolute inset-0 w-24 h-24 rounded-2xl border-2 border-brand-maroon/30 rotate-45 scale-110" />
            <div className="absolute inset-0 w-20 h-20 rounded-2xl border-2 border-brand-maroon/20 -rotate-12 scale-105" />
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-sm flex items-center justify-center p-1.5">
              <img
                src="/logo/admin-logo.png"
                alt="Muara Teweh Furniture"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Masuk untuk mengelola toko
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@tokofurnitur.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/admin/forgot-password"
              className="text-sm text-gray-500 hover:text-brand-maroon transition-colors"
            >
              Lupa password?
            </Link>
          </div>
        </div>

        {/* Back to site */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            &larr; Kembali ke halaman utama
          </Link>
        </div>
      </div>
    </div>
  );
}