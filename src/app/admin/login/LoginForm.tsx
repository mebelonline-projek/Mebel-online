"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Eye, EyeOff, Store } from "lucide-react";
import { loginAction } from "./actions";

export default function LoginForm() {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  // Fetch logo di client-side untuk menghindari CPU timeout di Worker
  useEffect(() => {
    fetch("/api/settings/logo")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.logoUrl) {
          setLogoUrl(data.logoUrl);
        }
      })
      .catch(() => {
        // silent — gunakan default logo
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("email", email.toLowerCase());
    formData.append("password", password);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* Brand — same store logo as landing page */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <div className="inline-flex items-center justify-center mb-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-brand-maroon/10">
                <Image
                  src={logoUrl}
                  alt="Logo Toko"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-maroon mb-4">
              <Store className="h-7 w-7 text-white" />
            </div>
          )}
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
                placeholder="misal: masukan email"
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
              disabled={isPending}
              className="w-full h-11 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl"
            >
              {isPending ? (
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