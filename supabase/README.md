# StefBank Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/migrations/001_stefbank_schema.sql`.
3. Create a local `.env.local` file with these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
STEFBANK_ADMIN_PASSWORD=...
STEFBANK_YEZI_PASSWORD=...
```

Only the `NEXT_PUBLIC_*` values are used by the browser app. `SUPABASE_SERVICE_ROLE_KEY` and the two passwords are only read by `scripts/init-supabase.cjs`.

4. Run the one-time initializer:

```bash
npm.cmd run supabase:init
```

The script creates/updates the two Auth users, writes their profiles, creates the account, and imports the 33 historical transactions with a balance of 3300.
