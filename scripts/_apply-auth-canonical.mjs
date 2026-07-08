/**
 * Apply scripts/migrations/001_auth_canonical.sql via Postgres pooler.
 * Reads DIRECT_URL or pooler URL from .env.local — never logs secrets.
 */
import fs from "fs";
import pg from "pg";

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

// Prefer session pooler (port 5432) for DDL; fall back to DIRECT_URL
const candidates = [
  process.env.DIRECT_URL,
  env.DIRECT_URL,
  // Known project pooler (password from LOCAL env only if present in DIRECT_URL)
].filter(Boolean);

let connectionString = candidates.find(
  (u) => u && !String(u).includes("[PASSWORD")
);

if (!connectionString) {
  console.error("No usable DIRECT_URL in .env.local");
  process.exit(1);
}

// If .direct host fails DNS, try rewriting to pooler session mode
function toPoolerSession(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes(".direct.")) {
      u.hostname = u.hostname.replace(".direct.", ".pooler.");
      u.port = "5432";
      return u.toString();
    }
    // pgbouncer transaction mode often blocks DDL — try session port
    if (u.port === "6543") {
      u.port = "5432";
      return u.toString();
    }
  } catch {
    /* ignore */
  }
  return url;
}

const sql = fs.readFileSync("scripts/migrations/001_auth_canonical.sql", "utf8");

async function tryConnect(url) {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 20000 });
  await client.connect();
  return client;
}

const urlsToTry = [connectionString, toPoolerSession(connectionString)];
// Also try explicit pooler with password extracted from DIRECT_URL
try {
  const u = new URL(connectionString);
  const pooler = new URL(connectionString);
  pooler.hostname = "aws-1-ap-southeast-1.pooler.supabase.com";
  pooler.port = "5432";
  // Supabase pooler user format: postgres.<project-ref>
  if (!pooler.username.includes(".")) {
    pooler.username = `postgres.xczbowaotnvzduikgdad`;
  }
  urlsToTry.push(pooler.toString());
} catch {
  /* ignore */
}

let client = null;
let used = null;
for (const url of urlsToTry) {
  try {
    console.log("Trying host:", new URL(url).hostname + ":" + (new URL(url).port || "5432"));
    client = await tryConnect(url);
    used = url;
    break;
  } catch (e) {
    console.log("  failed:", e.code || e.message);
  }
}

if (!client) {
  console.error("Could not connect to Postgres with any candidate URL");
  process.exit(1);
}

console.log("Connected. Applying 001_auth_canonical.sql ...");
try {
  await client.query(sql);
  console.log("SQL applied OK");

  const login = await client.query(
    `SELECT email FROM public.verify_admin_password($1, $2)`,
    ["mebelonline111@gmail.com", "password123"]
  );
  console.log("VERIFY login row_count:", login.rowCount);

  const resetProbe = await client.query(
    `SELECT public.reset_admin_password($1, $2) AS result`,
    ["__no_such_token__", "password123"]
  );
  console.log("VERIFY reset_admin_password:", JSON.stringify(resetProbe.rows[0]?.result));

  const stats = await client.query(`SELECT * FROM public.get_dashboard_stats()`);
  console.log("VERIFY stats products:", stats.rows[0]?.totalProducts);
} finally {
  await client.end();
}
