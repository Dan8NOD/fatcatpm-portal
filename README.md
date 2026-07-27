# FatCat PM — Owner Portal

Next.js + Supabase Auth (magic link). Owners sign in, see their properties.

## Setup

1. `npm install`
2. Do **not** run `supabase/schema.sql` (see note below) — the real `properties`/`property_owners` tables already exist on the shared project with a richer, normalized shape.
3. Supabase dashboard → Auth → URL Configuration: add your Vercel URL to redirect URLs
4. `npm run dev` → http://localhost:3000

## Deploy (Vercel)

1. Push this repo to GitHub (`Dan8NOD/fatcatpm-portal`)
2. Vercel → New Project → import repo
3. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from `.env.local.example`)
4. Deploy. Add `https://<your-app>.vercel.app/portal` to Supabase Auth redirect URLs.

## Notes

- No service key needed client-side — RLS scopes reads to the signed-in owner.
- **`supabase/schema.sql` is stale, don't run it.** Checked directly against the live database (2026-07-27): `properties` and `property_owners` already exist as part of the shared multi-domain schema, normalized (`properties.owner_id` -> `property_owners.id` -> `property_owners.user_id` = `auth.uid()`), not the flat `owner_email` column this file assumes. Running it would error (it references a column, `owner_email`, that doesn't exist on the real table) or at best do nothing useful. Left in the repo for history only.
- Adding a property: insert a `property_owners` row for the client (with their real `user_id` once they've signed in at least once, so `profiles`/auth has them) and a `properties` row with `owner_id` pointing at it — via the Supabase dashboard or service role, not client-side.
