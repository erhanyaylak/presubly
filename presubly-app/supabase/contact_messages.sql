-- İletişim formu mesajları. functions/api/contact.ts service_role ile yazar.
-- Supabase SQL editöründe bir kez çalıştırın.

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  subject     text,
  phone       text,
  message     text not null,
  ip          text,
  user_agent  text,
  handled     boolean not null default false
);

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

-- RLS açık, politika yok → yalnızca service_role (proxy) erişebilir.
-- Tarayıcıdan (anon/authenticated) okuma/yazma engellenir.
alter table public.contact_messages enable row level security;
