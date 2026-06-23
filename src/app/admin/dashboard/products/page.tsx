"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import ImageUploader from "@/components/admin/ImageUploader";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import ProductVariantEditor from "@/components/admin/ProductVariantEditor";
import { sortVariants } from "@/lib/variant-utils";
import { kompresFoto } from "@/lib/image-compression";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Package,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  X,
} from "lucide-react";
import type { ProductVariant } from "@/types";

const PAGE_SIZE = 50;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  images: string[];
  variants: ProductVariant[];
  categoryId: string;
  category: { name: string; slug: string };
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const emptyForm = {
  name: "",
  description: "",
  image: "",
  images: [] as string[],
  categoryId: "",
  sortOrder: 0,
  isActive: true,
  variants: [] as ProductVariant[],
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isRenumbering, setIsRenumbering] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [multiFotoUploading, setMultiFotoUploading] = useState(false);
  const multiFotoInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async (page: number) => {
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/products?all=true&page=${page}&limit=${PAGE_SIZE}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }
    } catch {
      toast.error("Gagal memuat produk");
    } finally {
      setIsLoadingMore(false);
      setIsLoading(false);
    }
  }, []);

  const handleRenumber = useCallback(async () => {
    if (isRenumbering) return;
    setIsRenumbering(true);
    try {
      const res = await fetch("/api/products/renumber", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchProducts(pagination.page);
      } else {
        toast.error(data.error || "Gagal mengurutkan ulang");
      }
    } catch {
      toast.error("Gagal mengurutkan ulang");
    } finally {
      setIsRenumbering(false);
    }
  }, [isRenumbering, fetchProducts, pagination.page]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [categoriesRes] = await Promise.all([
        fetch("/api/categories"),
        fetchProducts(1),
      ]);

      const categoriesData = await categoriesRes.json();

      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }
    } catch {
      toast.error("Gagal memuat data");
      setIsLoading(false);
    }
  }, [fetchProducts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchProducts(page);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreate = () => {
    setEditingProduct(null);
    // sortOrder 0 -> backend auto-fill dengan nomor tertinggi +1
    setForm({ ...emptyForm, variants: [], sortOrder: 0 });
    setIsDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    const images = product.images ?? [];
    setForm({
      name: product.name,
      description: product.description ?? "",
      image: product.image ?? "",
      images: images,
      categoryId: product.categoryId,
      sortOrder: product.sortOrder,
      isActive: product.isActive,
      variants: sortVariants(product.variants ?? []),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.categoryId) {
      toast.error("Nama produk dan kategori wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      // Build payload -- always simple mode, sort variants
      const payload = { ...form, variants: sortVariants(form.variants) };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingProduct ? "Produk berhasil diedit" : "Produk berhasil ditambah");
        setIsDialogOpen(false);
        fetchProducts(pagination.page);
      } else {
        toast.error(data.error || "Gagal menyimpan produk");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    const prevProducts = products;

    // ── Optimistic: tutup dialog, hapus dari state, toast sukses instan ──
    setDeleteTarget(null);
    setProducts((prev) => prev.filter((p) => p.id !== target.id));
    toast.success("Produk berhasil dihapus");

    // ── API delete tetap jalan di background ──
    try {
      const res = await fetch(`/api/products/${target.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!data.success) {
        // Rollback jika gagal
        setProducts(prevProducts);
        toast.error(data.error || "Gagal menghapus produk", {
          action: {
            label: "Coba Lagi",
            onClick: () => setDeleteTarget(target),
          },
        });
      } else {
        // Hapus halaman kosong
        const targetPage =
          prevProducts.length === 1 && pagination.page > 1
            ? pagination.page - 1
            : pagination.page;
        if (targetPage !== pagination.page) {
          fetchProducts(targetPage);
        }
      }
    } catch {
      // Rollback jika error jaringan
      setProducts(prevProducts);
      toast.error("Terjadi kesalahan. Produk gagal dihapus.", {
        action: {
          label: "Coba Lagi",
          onClick: () => setDeleteTarget(target),
        },
      });
    }
  };

  if (isLoading) {
    return (
      <>
        <AdminHeader title="Produk" />
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
      <AdminHeader title="Produk" />

      <div className="p-6 lg:p-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
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
            <span className="text-sm text-gray-400">
              {pagination.total} produk
            </span>
            <Button
              onClick={openCreate}
              className="bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "Produk tidak ditemukan" : "Belum ada produk"}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {searchQuery
                  ? "Coba kata kunci lain"
                  : "Tambahkan produk pertama Anda"}
              </p>
              {!searchQuery && (
                <Button onClick={openCreate} variant="outline" className="rounded-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Produk
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                        Produk
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                        Kategori
                      </th>
                      <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                        Urutan
                      </th>
                      <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                        Status
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                              {product.image ? (
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {product.createdAt
                                  ? new Date(product.createdAt).toLocaleDateString("id-ID")
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-0">
                            {product.category.name}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm font-mono text-gray-700">
                            {product.sortOrder}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant="secondary"
                            className={
                              product.isActive
                                ? "bg-green-50 text-green-700 border-0"
                                : "bg-red-50 text-red-700 border-0"
                            }
                          >
                            {product.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(product)}
                              className="h-8 w-8 text-gray-400 hover:text-brand-maroon"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(product)}
                              className="h-8 w-8 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                  <span className="text-sm text-gray-500">
                    Halaman {pagination.page} dari {pagination.totalPages}
                    {isLoadingMore && (
                      <Loader2 className="inline h-3 w-3 ml-2 animate-spin" />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1 || isLoadingMore}
                      onClick={() => goToPage(pagination.page - 1)}
                      className="rounded-xl h-9 px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page number buttons */}
                    {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                      // Show pages around current page
                      let pageNum: number;
                      if (pagination.totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 4) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 3) {
                        pageNum = pagination.totalPages - 6 + i;
                      } else {
                        pageNum = pagination.page - 3 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          disabled={isLoadingMore}
                          onClick={() => goToPage(pageNum)}
                          className={`rounded-xl h-9 w-9 p-0 ${
                            pagination.page === pageNum
                              ? "bg-brand-maroon hover:bg-brand-maroon-dark text-white"
                              : ""
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages || isLoadingMore}
                      onClick={() => goToPage(pagination.page + 1)}
                      className="rounded-xl h-9 px-3"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Produk" : "Tambah Produk"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Ubah informasi produk"
                : "Isi informasi produk baru"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nama produk"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Kategori *</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((p) => ({ ...p, categoryId: v ?? "" }))}
              >
                <SelectTrigger id="category">
                  <SelectValue>
                    {categories.find((c) => c.id === form.categoryId)?.name ||
                      "Pilih kategori"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gambar Utama + Galeri Foto */}
            <div className="space-y-4">
              {/* Gambar Utama */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Gambar Utama</Label>
                <ImageUploader
                  currentImage={form.image}
                  onImageUploaded={(url) => setForm((p) => ({ ...p, image: url }))}
                  onImageRemoved={() => setForm((p) => ({ ...p, image: "" }))}
                  folder="products"
                  tipeFoto="produk"
                />
              </div>

              {/* Galeri Foto */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Galeri Foto</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => multiFotoInputRef.current?.click()}
                    disabled={multiFotoUploading}
                    className="rounded-xl h-8 text-xs"
                  >
                    {multiFotoUploading ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 mr-1" />
                    )}
                    Tambah Foto
                  </Button>
                </div>

                {/* Grid thumbnail galeri */}
                {((form.images ?? []) as string[]).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {((form.images ?? []) as string[]).map((url, i) => (
                      <div key={i} className="relative group/thumb">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                          <Image
                            src={url}
                            alt={`Galeri ${i + 1}`}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            // Hapus dari Supabase dulu
                            try {
                              await fetch("/api/upload/delete", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ url }),
                              });
                            } catch {
                              // silent fail
                            }
                            const updated = ((form.images ?? []) as string[]).filter((_, j) => j !== i);
                            setForm((p) => ({ ...p, images: updated }));
                          }}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Belum ada foto galeri. Klik &ldquo;Tambah Foto&rdquo; untuk menambahkan foto tambahan.
                  </p>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={multiFotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (!files.length) return;
                  setMultiFotoUploading(true);
                  const newImages = [...((form.images ?? []) as string[])];
                  for (const file of files) {
                    try {
                      // Kompres dulu seperti gambar utama, tapi folder ke products/varian
                      const hasil = await kompresFoto(file, "galeri-produk");
                      const formData = new FormData();
                      formData.append("file", hasil.file);
                      formData.append("folder", hasil.folder);
                      formData.append("tipeFoto", "galeri-produk");
                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                      const data = await res.json();
                      if (data.success) newImages.push(data.data.url);
                    } catch { toast.error("Gagal upload " + file.name); }
                  }
                  setForm((p) => ({ ...p, images: newImages }));
                  setMultiFotoUploading(false);
                  if (multiFotoInputRef.current) multiFotoInputRef.current.value = "";
                }}
              />
            </div>

            {/* Varian Produk */}
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <Label className="text-sm font-semibold">Varian Produk</Label>
              <ProductVariantEditor
                variants={form.variants}
                onChange={(v) => setForm((p) => ({ ...p, variants: v }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Deskripsi produk (opsional)"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="text-sm cursor-pointer">
                  Produk aktif
                </Label>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sortOrder" className="text-xs text-gray-500">
                  Urutan tampil
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min={1}
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="Urutan"
                  className="h-9 text-sm w-24"
                />
                <p className="text-[10px] text-gray-400 leading-tight">
                  Nomor kecil = tampil lebih dulu. Produk lain akan menyesuaikan otomatis.
                </p>
              </div>
            </div>

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
                ) : editingProduct ? (
                  "Simpan Perubahan"
                ) : (
                  "Tambah Produk"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus &ldquo;{deleteTarget?.name}&rdquo;?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}