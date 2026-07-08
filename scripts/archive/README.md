# Archived auth scripts — DO NOT RUN

These files previously recreated the same Postgres functions with **conflicting definitions** (`crypt` vs `extensions.crypt`, `UUID` vs `TEXT` return types). Running any of them can overwrite the live auth contract and break production login.

## Canonical source of truth

Use only:

- [`../migrations/001_auth_canonical.sql`](../migrations/001_auth_canonical.sql)

Apply via:

```bash
node scripts/_apply-auth-canonical.mjs
```

Or paste that single file in Supabase SQL Editor if the agent cannot connect.

## Do not

- Paste any `fix-*.sql` / `optimize-auth.sql` from this folder into production
- Run `fix-login-api*.mjs` against live DB
