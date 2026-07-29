-- STALE — do not run. Checked live 2026-07-27: properties/property_owners
-- already exist on the shared project with a normalized shape (owner_id ->
-- property_owners.id -> user_id = auth.uid()), not the owner_email column
-- below. Running this errors on the CREATE POLICY line (no such column).
-- Kept for history only. See README.md.
-- FatCat PM owner portal — run once in Supabase SQL editor
-- ponytail: all tables + RLS in one file, run idempotently

-- ============== PROPERTIES (existing) ==============
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
drop policy if exists "owner read own" on properties;
create policy "owner read own" on properties for select
  using (owner_email = auth.jwt() ->> 'email');

-- ============== REPORTS (new — weekly owner updates) ==============
-- ponytail: one row per weekly report per property. JSONB body for flexibility.
create table if not exists reports (
  id bigint generated always as identity primary key,
  property_id bigint references properties(id) on delete cascade,
  week_of date not null,        -- Monday of the report week
  body jsonb not null,          -- { rent_collected, expenses, work_orders, notes }
  totals jsonb,                 -- { rent_in, rent_out, net, occupancy_pct }
  created_at timestamptz default now()
);
create index if not exists reports_property_id_idx on reports(property_id);
create index if not exists reports_week_of_idx on reports(week_of desc);
alter table reports enable row level security;
-- ponytail: owner can read reports for properties they own (join)
drop policy if exists "owner read own property reports" on reports;
create policy "owner read own property reports" on reports for select
  using (
    exists (
      select 1 from properties
      where properties.id = reports.property_id
        and properties.owner_email = auth.jwt() ->> 'email'
    )
  );

-- ============== REFERRALS (new — out-of-state owner referrals) ==============
-- ponytail: tracks owners Dan refers to out-of-state brokers. Admin view only.
create table if not exists referrals (
  id bigint generated always as identity primary key,
  owner_name text not null,
  owner_email text not null,
  state text not null,
  partner_broker text,          -- name of the out-of-state partner agent
  partner_email text,
  property_address text,
  estimated_value numeric,
  status text default 'pending',  -- pending | sent | accepted | closed
  referred_at date default current_date,
  closed_at date,
  referral_fee numeric,
  notes text,
  created_at timestamptz default now()
);
alter table referrals enable row level security;
-- ponytail: owners never read referrals (admin-only via service key)
-- No anon select policy = no public access

-- ============== ADMIN EMAILS ==============
-- ponytail: hardcoded list of admin emails that bypass row restriction
create table if not exists admin_emails (
  email text primary key
);
insert into admin_emails (email) values
  ('negotiatorsondemand@gmail.com'),
  ('dancruzhomes@gmail.com')
on conflict do nothing;
