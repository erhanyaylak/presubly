-- PSB-IMP-013 — Gönderim Operasyon Merkezi
-- Apply once in Supabase SQL Editor before enabling the feature in production.

create table if not exists public.manuscript_operations (
  id               text primary key,
  user_id          uuid not null references auth.users (id) on delete cascade,
  manuscript_title text not null,
  target_journal   text,
  status           text not null default 'preparing'
                     check (status in ('preparing','ready','submitted','revision','accepted','closed')),
  deadline         date,
  next_action      text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, manuscript_title)
);

create index if not exists manuscript_operations_user_updated_idx
  on public.manuscript_operations (user_id, updated_at desc);

alter table public.manuscript_operations enable row level security;

-- The application accesses this table only through authenticated Cloudflare
-- Pages Functions using the service role. No public RLS policy is intentional.
revoke all privileges on table public.manuscript_operations from anon, authenticated;
grant select, insert, update on table public.manuscript_operations to service_role;
