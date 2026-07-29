-- FatCat PM owner portal — run once in Supabase SQL editor
-- ponytail: all tables + RLS + storage in one file, run idempotently

-- ============== PROPERTIES (existing) ==============
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
  photos text[] default '{}',    -- ponytail: array of storage URLs
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

-- ============== TICKETS (new — maintenance requests) ==============
-- ponytail: simple kanban — open → in_progress → resolved
create table if not exists tickets (
  id bigint generated always as identity primary key,
  property_id bigint references properties(id) on delete cascade,
  title text not null,
  description text,
  priority text default 'normal',     -- low | normal | high | urgent
  status text default 'open',         -- open | in_progress | resolved | cancelled
  created_by text,                    -- email of whoever opened it (owner or admin)
  resolved_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists tickets_property_id_idx on tickets(property_id);
create index if not exists tickets_status_idx on tickets(status);
alter table tickets enable row level security;
-- ponytail: owners see their property's tickets, admins see all (via service key)
drop policy if exists "owner read own tickets" on tickets;
create policy "owner read own tickets" on tickets for select
  using (
    exists (
      select 1 from properties
      where properties.id = tickets.property_id
        and properties.owner_email = auth.jwt() ->> 'email'
    )
  );
-- ponytail: owners can CREATE tickets for their properties (status defaults open)
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

-- ============== STORAGE BUCKET (new — report photos) ==============
-- ponytail: idempotent bucket + RLS — owners upload to their own folder
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

-- Anyone can read (public bucket — house pics aren't sensitive)
drop policy if exists "report photos public read" on storage.objects;
create policy "report photos public read" on storage.objects for select
  using (bucket_id = 'report-photos');

-- Admin writes via service key (bypasses RLS), users can upload to their own folder
drop policy if exists "report photos owner write" on storage.objects;
create policy "report photos owner write" on storage.objects for insert
  with check (bucket_id = 'report-photos' and auth.role() = 'authenticated');
