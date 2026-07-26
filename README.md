# FatCat PM — Owner Portal

Next.js + Supabase Auth (magic link). Owners sign in, see their properties.

## Setup

1. `npm install`
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Supabase dashboard → Auth → URL Configuration: add your Vercel URL to redirect URLs
4. `npm run dev` → http://localhost:3000

## Deploy (Vercel)

1. Push this repo to GitHub (`Dan8NOD/fatcatpm-portal`)
2. Vercel → New Project → import repo
3. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from `.env.local.example`)
4. Deploy. Add `https://<your-app>.vercel.app/portal` to Supabase Auth redirect URLs.

## Notes

- No service key needed client-side — RLS scopes reads to the logged-in owner's email.
- Adding properties: insert rows via Supabase dashboard (service role) with `owner_email` set.
