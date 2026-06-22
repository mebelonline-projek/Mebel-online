import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}
if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_KEY is not set");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type Tables =
  | "Admin"
  | "PasswordResetToken"
  | "Category"
  | "Product"
  | "SiteConfig"
  | "RateLimit";