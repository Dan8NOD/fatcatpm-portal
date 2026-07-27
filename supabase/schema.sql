-- STALE — do not run. Checked live 2026-07-27: properties/property_owners
-- already exist on the shared project with a normalized shape (owner_id ->
-- property_owners.id -> user_id = auth.uid()), not the owner_email column
-- below. Running this errors on the CREATE POLICY line (no such column).
-- Kept for history only. See README.md.
-- FatCat PM owner portal — run once in Supabase SQL editor
create table if not exists properties (
  id bigint generated always as identity primary key,
  owner_email text not null,
  address text not null,
  units int default 1,
  monthly_rent numeric,
  status text default 'active',
  created_at timestamptz default now()
);
alter table properties enable row level security;
-- owners read only their own rows; writes go through service key (admin ops only)
create policy "owner read own" on properties for select
  using (owner_email = auth.jwt() ->> 'email');
