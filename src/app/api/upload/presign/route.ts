import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(request: Request) {
  try {
    // Proteksi: hanya admin
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { fileName, folder = "general", contentType } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { success: false, error: "Parameter tidak lengkap." },
        { status: 400 }
      );
    }

    // Validasi tipe file (server side, non-negotiable)
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: "Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "furniture-images";

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Supabase belum dikonfigurasi. Hubungi administrator." },
        { status: 500 }
      );
    }

    // Generate nama file unik (sama pola dengan uploadToSupabase)
    // Deteksi WebP dari contentType — pastikan ekstensi cocok dengan isi
    const isWebp = contentType === "image/webp";
    const originalExt = fileName.split(".").pop() ?? "jpg";
    const ext = isWebp ? "webp" : originalExt;
    const filePath = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.${ext}`;

    // Minta presigned upload URL dari Supabase Storage
    const presignRes = await fetch(
      `${supabaseUrl}/storage/v1/object/upload/${bucket}/${filePath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType,
          upsert: "true",
        }),
      }
    );

    if (!presignRes.ok) {
      const errorBody = await presignRes.text();
      console.error("Presign failed:", errorBody);
      return NextResponse.json(
        { success: false, error: `Gagal mendapatkan token upload: ${presignRes.status}` },
        { status: 500 }
      );
    }

    const presignData = await presignRes.json();
    const presignedUrl = presignData.url ?? presignData.tokenUrl ?? presignData.data?.url;

    return NextResponse.json({
      success: true,
      data: {
        presignedUrl,
        publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`,
        filePath,
      },
    });
  } catch (error) {
    console.error("Presign API error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}