"use client";

import { useState, useEffect, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Tags,
  Package,
  ListOrdered,
  FolderOpen,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  _count?: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "", sortOrder: 0 });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<{ id: string; name: string; sortOrder: number }[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isRenumbering, setIsRenumbering] = useState(false);
  const [moveToCategoryId, setMoveToCategoryId] = useState("");
  const [isMovingAndDeleting, setIsMovingAndDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch {
      toast.error("Gagal memuat kategori");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRenumber = useCallback(async () => {
    if (isRenumbering) return;
    setIsRenumbering(true);
    try {
      const res = await fetch("/api/categories/renumber", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchCategories();
      } else {
        toast.error(data.error || "Gagal mengurutkan ulang");
      }
    } catch {
      toast.error("Gagal mengurutkan ulang");
    } finally {
      setIsRenumbering(false);
    }
  }, [isRenumbering, fetchCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditingCategory(null);
    // Auto-fill sortOrder: taruh di akhir (backend auto-fill via max+1, kirim 0)
    setForm({ name: "", description: "", sortOrder: 0 });
    setIsDialogOpen(true);
  };

  const openEdit = async (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      sortOrder: cat.sortOrder,
    });
    setCategoryProducts([]);
    setIsLoadingProducts(true);
    setIsDialogOpen(true);

    // Fetch produk dalam kategori ini — pakai endpoint ringan
    try {
      const res = await fetch(`/api/products/by-category?categoryId=${cat.id}`);
      const data = await res.json();
      if (data.success) {
        setCategoryProducts(data.data);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      let res: Response;

      if (editingCategory) {
        res = await fetch("/api/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCategory.id,
            name: form.name,
            description: form.description || null,
            sortOrder: form.sortOrder,
          }),
        });
      } else {
        res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            description: form.description || null,
            sortOrder: form.sortOrder,
          }),
        });
      }

      const data = await res.json();

      if (data.success) {
        toast.success(
          editingCategory ? "Kategori berhasil diedit" : "Kategori berhasil ditambah"
        );
        setIsDialogOpen(false);
        fetchCategories();
      } else {
        toast.error(data.error || "Gagal menyimpan kategori");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      let url = `/api/categories?id=${deleteTarget.id}`;
      if (moveToCategoryId) {
        url += `&moveToCategoryId=${moveToCategoryId}`;
        setIsMovingAndDeleting(true);
      }

      const res = await fetch(url, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Kategori berhasil dihapus" + (moveToCategoryId ? " & produk dipindahkan" : ""));
        setDeleteTarget(null);
        setMoveToCategoryId("");
        fetchCategories();
      } else {
        toast.error(data.error || "Gagal menghapus kategori");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsMovingAndDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <AdminHeader title="Kategori" />
        <div className="p-6 lg:p-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Kategori" />

      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {categories.length} kategori
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRenumber}
              disabled={isRenumbering}
              className="rounded-xl h-10 text-xs"
            >
              {isRenumbering ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <ListOrdered className="h-3.5 w-3.5 mr-1.5" />
              )}
              Urutkan Ulang
            </Button>
            <Button
              onClick={openCreate}
              className="bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kategori
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <Tags className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum ada kategori
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Buat kategori pertama untuk produk Anda
              </p>
              <Button onClick={openCreate} variant="outline" className="rounded-full">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kategori
              </Button>
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Slug: {cat.slug}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(cat)}
                      className="h-8 w-8 text-gray-400 hover:text-brand-maroon"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(cat)}
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {cat.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {cat.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-0">
                    {cat._count?.products ?? 0} produk
                  </Badge>
                  <span className="text-xs text-gray-400">
                    Urutan: {cat.sortOrder}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) setCategoryProducts([]); setIsDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Ubah nama atau deskripsi kategori"
                : "Buat grup baru untuk produk"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Kategori *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Contoh: Kursi, Meja, Lemari"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Deskripsi kategori (opsional)"
                rows={2}
              />
            </div>

            <div className="w-24">
              <Label htmlFor="sortOrder">Urutan Kategori</Label>
              <Input
                id="sortOrder"
                type="number"
                min={1}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    sortOrder: parseInt(e.target.value) || 0,
                  }))
                }
                className="h-9 mt-1"
              />
              <p className="text-[10px] text-gray-400 leading-tight mt-1">
                Nomor kecil = tampil lebih dulu. Kategori lain akan menyesuaikan otomatis.
              </p>
            </div>

            {/* Daftar Produk dalam kategori ini */}
            {editingCategory && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <Label className="text-xs text-gray-500">
                  Produk dalam kategori ini — {isLoadingProducts ? "memuat..." : `${categoryProducts.length} produk`}
                </Label>
                {isLoadingProducts ? (
                  <div className="flex items-center gap-2 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-400">Memuat produk...</span>
                  </div>
                ) : categoryProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 py-3">Belum ada produk di kategori ini.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {categoryProducts
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{p.name}</span>
                          </div>
                          <span className="text-xs font-mono text-gray-400 ml-2 shrink-0">
                            #{p.sortOrder}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : editingCategory ? (
                  "Simpan Perubahan"
                ) : (
                  "Tambah Kategori"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setMoveToCategoryId("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (deleteTarget._count?.products ?? 0) > 0
                ? `Kategori "${deleteTarget.name}" memiliki ${deleteTarget._count?.products ?? 0} produk. Pindahkan produk ke kategori lain sebelum menghapus.`
                : `Apakah Anda yakin ingin menghapus kategori "${deleteTarget?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteTarget && (deleteTarget._count?.products ?? 0) > 0 && (
            <div className="px-6 py-2">
              <Label htmlFor="move-category-id" className="text-sm font-medium text-gray-700 mb-2 block">
                Pindahkan produk ke kategori:
              </Label>
              <select
                id="move-category-id"
                value={moveToCategoryId}
                onChange={(e) => setMoveToCategoryId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-maroon/20 focus:border-brand-maroon"
              >
                <option value="">-- Pilih kategori --</option>
                {categories
                  .filter((c) => c.id !== deleteTarget?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c._count?.products ?? 0} produk)
                    </option>
                  ))}
              </select>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            {deleteTarget && (deleteTarget._count?.products ?? 0) > 0 ? (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!moveToCategoryId || isMovingAndDeleting}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50"
              >
                {isMovingAndDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Memindahkan & Menghapus...
                  </>
                ) : (
                  <>
                    <FolderOpen className="h-4 w-4 mr-1.5" />
                    Pindahkan & Hapus
                  </>
                )}
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                Hapus
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}