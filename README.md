# FatCat PM — Owner Portal

Multi-page Next.js portal deployed to Vercel. Connected to the shared Supabase project (`iubxycckgrplbpdbncfk`).

## Routes
- `/` — magic-link sign-in (owner or admin)
- `/portal` — owner's properties list (RLS-scoped)
- `/portal/reports/[id]` — property timeline
- `/admin` — admin dashboard (gated by `admin_emails` table)
- `/admin/properties` — add new property
- `/admin/upload-report/[id]` — weekly report upload
- `/admin/referrals` — out-of-state partner pipeline

## Vercel env vars to set
- `NEXT_PUBLIC_SUPABASE_URL` = `https://iubxycckgrplbpdbncfk.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_L92hXORLG-Df4WiZxVq-6Q_X3AB47yl`
- `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase dashboard — Settings → API)
- `WEBHOOK_SECRET` = any random string (used by `/api/notify`)
- `RESEND_API_KEY` = optional, for email notifications
- `NOTIFY_EMAIL` = optional, where new-intake emails go

## Deploy
1. Push to GitHub: `git push origin main`
2. Vercel: import `Dan8NOD/fatcatpm-portal`, set env vars, deploy
3. Supabase: run `supabase/schema.sql` in the SQL editor
4. Supabase Auth: enable Email magic-link + Google provider
5. Add yourself to `admin_emails` (already pre-seeded with negotiatorsondemand@gmail.com + dancruzhomes@gmail.com)

## Auth gating
- Magic link via Supabase `signInWithOtp` (no passwords)
- Admin routes probe `/api/admin` — service-role checks `admin_emails` table
- Owners are RLS-scoped: they only see properties where `owner_email = auth.jwt() ->> 'email'`
