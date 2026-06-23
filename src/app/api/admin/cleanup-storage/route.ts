import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";
import { deleteFromSupabase } from "@/lib/upload";

/**
 * GET /api/admin/cleanup-storage
 *
 * Scan semua foto di Supabase Storage, bandingkan dengan referensi di database,
 * dan hapus file yang tidak dipakai (orphan) dari:
 *   - Product.image (gambar utama produk)
 *   - Product.images (galeri produk)
 *   - SiteConfig.value yang berisi URL gambar (site_logo, hero_image, about_image)
 *   - Category.image (jika ada)
 *
 * Response:
 *   { success: true, data: { totalFiles, referencedFiles, orphanedFiles, deletedFiles, errors } }
 */
export async function GET() {
  try {
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const supabase = getSupabase();
    const bucket =
      process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "furniture-images";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return NextResponse.json(
        { success: false, error: "NEXT_PUBLIC_SUPABASE_URL tidak dikonfigurasi." },
        { status: 500 }
      );
    }

    // ── 1. Kumpulkan semua URL gambar yang direferensi di database ──
    const referencedUrls = new Set<string>();

    // 1a. Product.image & Product.images
    const { data: products } = await supabase
      .from("Product")
      .select("image, images");

    if (products) {
      for (const p of products) {
        if (p.image) referencedUrls.add(p.image);
        if (p.images) {
          try {
            const parsed = JSON.parse(p.images);
            if (Array.isArray(parsed)) {
              parsed.forEach((url: string) => {
                if (typeof url === "string") referencedUrls.add(url);
              });
            }
          } catch {
            // skip invalid JSON
          }
        }
      }
    }

    // 1b. Category.image (jika ada)
    const { data: categories } = await supabase.from("Category").select("image");
    if (categories) {
      for (const c of categories) {
        if (c.image) referencedUrls.add(c.image);
      }
    }

    // 1c. SiteConfig — cari field yang berisi URL gambar
    const IMAGE_FIELDS = ["site_logo", "hero_image", "about_image"];
    const { data: siteConfigs } = await supabase
      .from("SiteConfig")
      .select("key, value")
      .in("key", IMAGE_FIELDS);

    if (siteConfigs) {
      for (const cfg of siteConfigs) {
        if (cfg.value) referencedUrls.add(cfg.value);
      }
    }

    // ── 2. List semua file di Supabase Storage bucket ──
    let allFiles: { name: string }[] = [];
    let cursor: string | null = null;
    const pageSize = 100;

    do {
      const listOptions: {
        limit: number;
        offset?: number;
        sortBy?: { column: string; order: string };
      } = {
        limit: pageSize,
        sortBy: { column: "name", order: "asc" },
      };

      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list("", listOptions);

      if (listError) {
        console.error("Error listing storage files:", listError);
        break;
      }

      if (files) {
        allFiles = [...allFiles, ...files.filter((f) => !f.id?.startsWith("."))];
      }

      // Pagination via name-based cursor
      if (files && files.length === pageSize) {
        cursor = files[files.length - 1].name;
      } else {
        cursor = null;
      }
    } while (cursor);

    // ── 3. Identifikasi file orphan ──
    const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${bucket}/`;
    const orphanedFiles: { name: string; url: string }[] = [];

    for (const file of allFiles) {
      const fileUrl = `${publicPrefix}${file.name}`;
      if (!referencedUrls.has(fileUrl)) {
        orphanedFiles.push({ name: file.name, url: fileUrl });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalFiles: allFiles.length,
        referencedFiles: referencedUrls.size,
        orphanedFiles: orphanedFiles.length,
        orphanedList: orphanedFiles.slice(0, 50), // batasi 50 untuk response
        hasMoreOrphans: orphanedFiles.length > 50,
      },
    });
  } catch (error) {
    console.error("Cleanup storage error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal melakukan pembersihan storage." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cleanup-storage
 *
 * Hapus SEMUA file orphan dari Supabase Storage.
 * Hanya hapus file yang TIDAK direferensi di database sama sekali.
 *
 * Body opsional: { files?: string[] } — untuk hapus file tertentu saja
 *
 * Response:
 *   { success: true, data: { deletedCount, deletedFiles, errors } }
 */
export async function POST(request: Request) {
  try {
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const supabase = getSupabase();
    const bucket =
      process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "furniture-images";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return NextResponse.json(
        { success: false, error: "NEXT_PUBLIC_SUPABASE_URL tidak dikonfigurasi." },
        { status: 500 }
      );
    }

    // Kumpulkan semua URL yang direferensi (sama seperti GET)
    const referencedUrls = new Set<string>();

    const { data: products } = await supabase
      .from("Product")
      .select("image, images");

    if (products) {
      for (const p of products) {
        if (p.image) referencedUrls.add(p.image);
        if (p.images) {
          try {
            const parsed = JSON.parse(p.images);
            if (Array.isArray(parsed)) {
              parsed.forEach((url: string) => {
                if (typeof url === "string") referencedUrls.add(url);
              });
            }
          } catch {
            // skip
          }
        }
      }
    }

    const { data: categories } = await supabase.from("Category").select("image");
    if (categories) {
      for (const c of categories) {
        if (c.image) referencedUrls.add(c.image);
      }
    }

    const IMAGE_FIELDS = ["site_logo", "hero_image", "about_image"];
    const { data: siteConfigs } = await supabase
      .from("SiteConfig")
      .select("key, value")
      .in("key", IMAGE_FIELDS);

    if (siteConfigs) {
      for (const cfg of siteConfigs) {
        if (cfg.value) referencedUrls.add(cfg.value);
      }
    }

    // Parse body — optional specific files list
    let specificFiles: string[] | null = null;
    try {
      const body = await request.json();
      if (body.files && Array.isArray(body.files)) {
        specificFiles = body.files;
      }
    } catch {
      // no body or invalid JSON = hapus semua orphan
    }

    const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${bucket}/`;

    // List semua file di bucket
    let allFiles: { name: string }[] = [];
    let cursor: string | null = null;
    const pageSize = 100;

    do {
      const listOptions: {
        limit: number;
        offset?: number;
        sortBy?: { column: string; order: string };
      } = {
        limit: pageSize,
        sortBy: { column: "name", order: "asc" },
      };

      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list("", listOptions);

      if (listError) break;

      if (files) {
        allFiles = [...allFiles, ...files.filter((f) => !f.id?.startsWith("."))];
      }

      if (files && files.length === pageSize) {
        cursor = files[files.length - 1].name;
      } else {
        cursor = null;
      }
    } while (cursor);

    // Tentukan file mana yang akan dihapus
    const toDelete: string[] = [];

    for (const file of allFiles) {
      const fileUrl = `${publicPrefix}${file.name}`;

      // Jika specificFiles diberikan, hanya hapus yang ada di daftar itu
      if (specificFiles !== null) {
        if (specificFiles.includes(fileUrl)) {
          toDelete.push(file.name);
        }
        continue;
      }

      // Hapus jika tidak direferensi
      if (!referencedUrls.has(fileUrl)) {
        toDelete.push(file.name);
      }
    }

    // Eksekusi hapus dalam batch (max 100 file per request ke Supabase)
    const deletedFiles: string[] = [];
    const errors: string[] = [];
    const batchSize = 100;

    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      const { error: delError } = await supabase.storage
        .from(bucket)
        .remove(batch);

      if (delError) {
        errors.push(`Batch ${i / batchSize}: ${delError.message}`);
        console.error("Delete batch error:", delError);
      } else {
        deletedFiles.push(...batch);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deletedFiles.length,
        deletedFiles: deletedFiles.slice(0, 50),
        hasMoreDeleted: deletedFiles.length > 50,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Cleanup storage error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal melakukan pembersihan storage." },
      { status: 500 }
    );
  }
}