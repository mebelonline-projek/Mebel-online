export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAllSettings } from "@/lib/site-config";

/** Public site settings for landing (no auth). Single SiteConfig query. */
export async function GET() {
  try {
    const settings = await getAllSettings();
    return NextResponse.json(
      { success: true, data: settings },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Public settings error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat pengaturan." },
      { status: 500 }
    );
  }
}
