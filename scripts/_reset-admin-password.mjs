/**
 * Reset admin password via canonical RPC (production recovery).
 * Usage: node scripts/_reset-admin-password.mjs [email] [newPassword]
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const raw = fs.readFileSync(".env.local", "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

const email = process.argv[2] ?? "mebelonline111@gmail.com";
const newPassword = process.argv[3] ?? "password123";

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

const { data: hash, error: hashError } = await supabase.rpc("hash_admin_password", {
  p_password: newPassword,
});

if (hashError || !hash) {
  console.error("hash_admin_password failed:", hashError?.message ?? "no hash");
  process.exit(1);
}

const { error: updateError } = await supabase
  .from("Admin")
  .update({ password: hash, updatedAt: new Date().toISOString() })
  .ilike("email", email);

if (updateError) {
  console.error("Admin update failed:", updateError.message);
  process.exit(1);
}

const { data: verify, error: verifyError } = await supabase.rpc(
  "verify_admin_password",
  { p_email: email, p_password: newPassword }
);

if (verifyError || !verify?.length) {
  console.error("Post-reset verify failed:", verifyError?.message ?? "no match");
  process.exit(1);
}

console.log(`OK: password reset for ${email} (verify_admin_password passed)`);
