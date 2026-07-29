-- FatCat PM owner portal — run once in Supabase SQL editor
-- ponytail: all tables + RLS + storage in one file, run idempotently

-- ============== PROPERTIES ==============
create table if not exists properties (
  id bigint generated always as identity primary key,
  owner_email text not null,
  address text not null,
  units int default 1,
  monthly_rent numeric,
  status text default 'active',
  notes text,                       -- ponytail: admin-only scratchpad (handyman codes, etc.)
  created_at timestamptz default now()
);
alter table properties enable row level security;
drop policy if exists "owner read own" on properties;
create policy "owner read own" on properties for select
  using (owner_email = auth.jwt() ->> 'email');
-- ponytail: owners do NOT see notes — only admins read via service key.
-- No additional anon policy on notes = RLS denies it. Safe by default.

-- ============== REPORTS ==============
create table if not exists reports (
  id bigint generated always as identity primary key,
  property_id bigint references properties(id) on delete cascade,
  week_of date not null,
  body jsonb not null,
  totals jsonb,
  photos text[] default '{}',
  created_at timestamptz default now()
);
create index if not exists reports_property_id_idx on reports(property_id);
create index if not exists reports_week_of_idx on reports(week_of desc);
alter table reports enable row level security;
drop policy if exists "owner read own property reports" on reports;
create policy "owner read own property reports" on reports for select
  using (
    exists (
      select 1 from properties
      where properties.id = reports.property_id
        and properties.owner_email = auth.jwt() ->> 'email'
    )
  );

-- ============== REFERRALS ==============
create table if not exists referrals (
  id bigint generated always as identity primary key,
  owner_name text not null,
  owner_email text not null,
  state text not null,
  partner_broker text,
  partner_email text,
  property_address text,
  estimated_value numeric,
  status text default 'pending',
  referred_at date default current_date,
  closed_at date,
  referral_fee numeric,
  notes text,
  created_at timestamptz default now()
);
alter table referrals enable row level security;

-- ============== TICKETS ==============
create table if not exists tickets (
  id bigint generated always as identity primary key,
  property_id bigint references properties(id) on delete cascade,
  title text not null,
  description text,
  priority text default 'normal',
  status text default 'open',
  created_by text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists tickets_property_id_idx on tickets(property_id);
create index if not exists tickets_status_idx on tickets(status);
alter table tickets enable row level security;
drop policy if exists "owner read own tickets" on tickets;
create policy "owner read own tickets" on tickets for select
  using (
    exists (
      select 1 from properties
      where properties.id = tickets.property_id
        and properties.owner_email = auth.jwt() ->> 'email'
    )
  );
drop policy if exists "owner open ticket" on tickets;
create policy "owner open ticket" on tickets for insert
  with check (
    exists (
      select 1 from properties
      where properties.id = tickets.property_id
        and properties.owner_email = auth.jwt() ->> 'email'
    )
  );

-- ============== ADMIN EMAILS ==============
create table if not exists admin_emails (
  email text primary key
);
insert into admin_emails (email) values
  ('negotiatorsondemand@gmail.com'),
  ('dancruzhomes@gmail.com')
on conflict do nothing;

-- ============== STORAGE ==============
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

drop policy if exists "report photos public read" on storage.objects;
create policy "report photos public read" on storage.objects for select
  using (bucket_id = 'report-photos');

drop policy if exists "report photos owner write" on storage.objects;
create policy "report photos owner write" on storage.objects for insert
  with check (bucket_id = 'report-photos' and auth.role() = 'authenticated');

-- ============== REVENUE LEDGER (new — Monthly Revenue Tracker) ==============
-- ponytail: one row per revenue source per month. Vertical = business stream.
create table if not exists revenue_entries (
  id bigint generated always as identity primary key,
  month date not null,              -- first day of the month (2026-08-01)
  vertical text not null,           -- 'token_broker' | 'nod_academy' | 'coaching' | 'manual_kindle' | 'manual_gumroad' | 'agent_script' | 'negotiator_challenge' | 'real_estate' | 'other'
  amount numeric not null default 0,
  transactions int default 0,
  notes text,
  created_at timestamptz default now(),
  unique(month, vertical)
);
create index if not exists revenue_month_idx on revenue_entries(month desc);
alter table revenue_entries enable row level security;
-- ponytail: admin-only via service key — no anon policy = RLS denies anon
drop policy if exists "anon read revenue" on revenue_entries;
create policy "anon read revenue" on revenue_entries for select to anon using (false);
create policy "service role all revenue" on revenue_entries for all to service_role using (true) with check (true);

create table if not exists expense_entries (
  id bigint generated always as identity primary key,
  month date not null,
  category text not null,           -- 'supabase' | 'vercel' | 'github' | 'domain' | 'stripe_fees' | 'zoom' | 'video_editor' | 'va' | 'bookkeeper' | 'software' | 'marketing' | 'other'
  amount numeric not null default 0,
  notes text,
  created_at timestamptz default now(),
  unique(month, category)
);
create index if not exists expense_month_idx on expense_entries(month desc);
alter table expense_entries enable row level security;
drop policy if exists "anon read expenses" on expense_entries;
create policy "anon read expenses" on expense_entries for select to anon using (false);
create policy "service role all expenses" on expense_entries for all to service_role using (true) with check (true);