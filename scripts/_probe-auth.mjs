/**
 * One-shot probe via Supabase JS (service role). No full password hashes logged.
 * Reads keys from .env.local
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

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function rpc(name, params = {}) {
  const { data, error } = await supabase.rpc(name, params);
  return {
    data,
    error: error
      ? {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        }
      : null,
  };
}

const login = await rpc("verify_admin_password", {
  p_email: "mebelonline111@gmail.com",
  p_password: "password123",
});
console.log(
  "=== LOGIN mebelonline111 ===",
  JSON.stringify({
    ok: !login.error && Array.isArray(login.data) && login.data.length > 0,
    rowCount: Array.isArray(login.data) ? login.data.length : 0,
    email: login.data?.[0]?.email ?? null,
    idType: typeof login.data?.[0]?.id,
    error: login.error,
  })
);

const login2 = await rpc("verify_admin_password", {
  p_email: "admin@example.com",
  p_password: "password123",
});
console.log(
  "=== LOGIN admin@example ===",
  JSON.stringify({
    ok: !login2.error && Array.isArray(login2.data) && login2.data.length > 0,
    rowCount: Array.isArray(login2.data) ? login2.data.length : 0,
    email: login2.data?.[0]?.email ?? null,
    error: login2.error,
  })
);

const stats = await rpc("get_dashboard_stats");
console.log("=== STATS ===", JSON.stringify(stats));

const change = await rpc("change_admin_password", {
  p_email: "mebelonline111@gmail.com",
  p_current_password: "__probe_wrong__",
  p_new_password: "password123",
});
console.log(
  "=== change_admin_password ===",
  JSON.stringify({ error: change.error, data: change.data })
);

const reset = await rpc("reset_admin_password", {
  p_token: "probe",
  p_new_password: "password123",
});
console.log(
  "=== reset_admin_password ===",
  JSON.stringify({ error: reset.error, data: reset.data })
);

const { data: admins, error: adminErr } = await supabase
  .from("Admin")
  .select("email, password");
console.log(
  "=== HASH KIND ONLY ===",
  JSON.stringify({
    error: adminErr ? adminErr.message : null,
    rows: (admins ?? []).map((a) => ({
      email: a.email,
      hash_kind: String(a.password || "").slice(0, 4),
    })),
  })
);
