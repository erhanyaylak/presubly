-- Presubly — Supabase (Postgres) canonical schema.
-- Identity: Supabase Auth (auth.users). Tables keyed by the auth user UUID.
-- Apply: Supabase Dashboard → SQL Editor → paste & run (idempotent).
--
-- All app access goes through Cloudflare Pages Functions using the SERVICE ROLE
-- key (which bypasses RLS). RLS is enabled with no public policies as a hard
-- backstop so the anon key can never read/write these tables directly.

-- ── profiles ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  credits    integer not null default 6,       -- free starter credits
  plan       text not null default 'free',     -- free | academic | pro | enterprise
  is_pro     boolean not null default false,   -- legacy flag (kept for compat)
  is_admin   boolean not null default false,   -- super admin: unlimited credits, all features
  created_at timestamptz not null default now()
);

-- ── usage_logs ──────────────────────────────────────────────────────────
create table if not exists public.usage_logs (
  id         bigint generated always as identity primary key,
  user_id    uuid,
  product    text not null default 'presubly',
  action     text,
  cost       integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists usage_logs_user_created_idx on public.usage_logs (user_id, created_at desc);

-- ── journals (Academic tier: profile library) ───────────────────────────
create table if not exists public.journals (
  id             text primary key,
  user_id        uuid,                          -- NULL = built-in/public profile
  name           text not null,
  discipline     text,
  ref_style      text,
  word_limit     integer,
  similarity_max integer,
  study_standard text,
  notes          text,
  created_at     timestamptz not null default now()
);
create index if not exists journals_user_idx on public.journals (user_id);

-- ── saved_reports (Academic tier: archive + progress) ───────────────────
create table if not exists public.saved_reports (
  id         text primary key,                  -- uuid (server-generated)
  user_id    uuid not null,
  title      text not null,
  tool       text not null default 'readiness',
  score      integer,
  grade      text,
  data       text not null,                     -- JSON snapshot
  created_at timestamptz not null default now()
);
create index if not exists saved_reports_user_idx on public.saved_reports (user_id, created_at desc);
create index if not exists saved_reports_title_idx on public.saved_reports (user_id, title);

-- ── manuscript operations (PSB-IMP-013: submission workflow metadata) ──
-- Saved reports remain immutable evidence. This table keeps the mutable plan.
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

-- ── shared_reports (Enterprise tier: public links) ──────────────────────
create table if not exists public.shared_reports (
  id         text primary key,                  -- used in #share-<id>
  user_id    uuid not null,
  title      text,
  data       text not null,
  views      integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- ── api_keys (Enterprise tier: OJS/DergiPark integration) ───────────────
create table if not exists public.api_keys (
  id         text primary key,
  user_id    uuid not null,
  prefix     text not null,
  key_hash   text not null,
  label      text,
  revoked    boolean not null default false,
  last_used  timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists api_keys_user_idx on public.api_keys (user_id);
create index if not exists api_keys_hash_idx on public.api_keys (key_hash);

-- ── RLS: enabled, no public policies (service role bypasses) ────────────
alter table public.profiles       enable row level security;
alter table public.usage_logs     enable row level security;
alter table public.journals       enable row level security;
alter table public.saved_reports  enable row level security;
alter table public.manuscript_operations enable row level security;
revoke all privileges on table public.manuscript_operations from anon, authenticated, service_role;
grant select, insert, update on table public.manuscript_operations to service_role;
alter table public.shared_reports enable row level security;
alter table public.api_keys       enable row level security;

-- ── Auto-create a profile row on signup (6 free credits) ────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, new.email, 6)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Atomic credit ops ───────────────────────────────────────────────────
create or replace function public.deduct_credits(p_user uuid, p_amount integer)
returns integer language plpgsql security definer set search_path = public as $$
declare remaining integer;
begin
  update public.profiles set credits = credits - p_amount
   where id = p_user and credits >= p_amount
   returning credits into remaining;
  return remaining; -- NULL if insufficient balance
end $$;

create or replace function public.add_credits(p_user uuid, p_amount integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set credits = credits + p_amount where id = p_user;
end $$;

create or replace function public.bump_share_views(p_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.shared_reports set views = views + 1 where id = p_id;
end $$;

-- ── Admin dashboard data (users + stats + daily) ────────────────────────
create or replace function public.presubly_admin_data()
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'users', (
      select coalesce(json_agg(u), '[]'::json) from (
        select p.id, p.email, p.credits, p.plan, p.is_pro, p.is_admin, p.created_at,
               (select count(*) from usage_logs ul where ul.user_id = p.id) as uses
        from profiles p order by p.created_at desc limit 1000
      ) u
    ),
    'stats', json_build_object(
      'users',      (select count(*) from profiles),
      'uses',       (select count(*) from usage_logs),
      'uses7',      (select count(*) from usage_logs where created_at >= now() - interval '7 days'),
      'new7',       (select count(*) from profiles  where created_at >= now() - interval '7 days'),
      'active7',    (select count(distinct user_id) from usage_logs where created_at >= now() - interval '7 days'),
      'academic',   (select count(*) from profiles where plan = 'academic'),
      'pro_plan',   (select count(*) from profiles where plan = 'pro'),
      'enterprise', (select count(*) from profiles where plan = 'enterprise'),
      'pro',        (select count(*) from profiles where is_pro),
      'admins',     (select count(*) from profiles where is_admin),
      'credits',    (select coalesce(sum(credits), 0) from profiles)
    ),
    'daily', (
      select coalesce(json_agg(d), '[]'::json) from (
        select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as d, count(*) as n
        from usage_logs where created_at >= now() - interval '13 days'
        group by 1 order by 1
      ) d
    )
  )
$$;

-- ── teams + members (Pro tier: collaboration) ──────────────────────────
create table if not exists public.teams (
  id         text primary key,                  -- uuid (server-generated)
  name       text not null,
  owner_id   uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists teams_owner_idx on public.teams (owner_id);

create table if not exists public.team_members (
  id         text primary key,                  -- uuid
  team_id    text not null references public.teams (id) on delete cascade,
  email      text not null,                     -- invited email (lowercased)
  role       text not null default 'member',    -- owner | member
  created_at timestamptz not null default now()
);
create index if not exists team_members_team_idx  on public.team_members (team_id);
create index if not exists team_members_email_idx on public.team_members (lower(email));

-- ── report_comments (Pro tier: comment system) ─────────────────────────
create table if not exists public.report_comments (
  id         text primary key,                  -- uuid
  report_id  text not null references public.saved_reports (id) on delete cascade,
  user_id    uuid not null,
  author     text,                              -- display email at comment time
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists report_comments_report_idx on public.report_comments (report_id, created_at);

alter table public.teams          enable row level security;
alter table public.team_members   enable row level security;
alter table public.report_comments enable row level security;

-- ── Are two users teammates? (share any team, by email/ownership) ───────
create or replace function public.presubly_teammates(p_a uuid, p_b uuid)
returns boolean language sql security definer set search_path = public as $$
  with a_teams as (
    select id from teams where owner_id = p_a
    union
    select tm.team_id from team_members tm
      where lower(tm.email) = lower((select email from profiles where id = p_a))
  ),
  b_teams as (
    select id from teams where owner_id = p_b
    union
    select tm.team_id from team_members tm
      where lower(tm.email) = lower((select email from profiles where id = p_b))
  )
  select exists (select 1 from a_teams a join b_teams b on a.id = b.id);
$$;

-- ── Seed: built-in journal / standard profiles ──────────────────────────
insert into public.journals (id, user_id, name, discipline, ref_style, word_limit, similarity_max, study_standard, notes) values
 ('gen-apa',   null, 'Genel — APA 7 (Sosyal/Sağlık)',  'Sosyal Bilimler',       'APA 7',     250, 20, null,      'APA 7 başlık düzeyleri; özet ≤250 kelime; 3-5 anahtar kelime.'),
 ('gen-vanc',  null, 'Genel — Vancouver (Tıp)',        'Tıp / Klinik Bilimler', 'Vancouver', 250, 20, null,      'Vancouver numaralı atıf; yapılandırılmış özet; ICMJE yazar kriterleri.'),
 ('consort',   null, 'RKÇ dergisi — CONSORT',          'Tıp / Klinik Bilimler', 'Vancouver', 300, 15, 'CONSORT', 'CONSORT 2010 akış diyagramı; deney kaydı numarası; güç analizi zorunlu.'),
 ('prisma',    null, 'Sistematik derleme — PRISMA',    'Sağlık Bilimleri',      'Vancouver', 300, 20, 'PRISMA',  'PRISMA 2020 akış; protokol kaydı (PROSPERO); arama stratejisi eki.'),
 ('strobe',    null, 'Gözlemsel — STROBE',             'Sağlık Bilimleri',      'Vancouver', 300, 20, 'STROBE',  'STROBE kontrol listesi; çalışma tasarımı başlıkta belirtilmeli.'),
 ('dergipark', null, 'DergiPark — Genel TR dergi',     'Sosyal Bilimler',       'APA 7',     200, 20, null,      'TR/EN çift özet; etik kurul beyanı; yazar katkı & çıkar çatışması bölümleri.')
on conflict (id) do nothing;
