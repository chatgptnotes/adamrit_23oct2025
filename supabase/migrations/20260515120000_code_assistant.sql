-- Super-Admin Code Assistant: tables for prompts, generations, history, and rate limits.
-- See: bettroi-vault/Adamrit/Super-Admin-Code-Assistant-Plan.md §23 for the full design.
--
-- IMPORTANT: This migration is local-only. DO NOT push to live Supabase without explicit user permission.

create extension if not exists "uuid-ossp";

-- ─── Generations ─────────────────────────────────────────────────────────
create table if not exists public.code_assistant_generations (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete restrict,
  parent_generation_id        uuid references public.code_assistant_generations(id),
  prompt                      text not null check (length(prompt) between 5 and 10000),
  attached_files              text[] not null default '{}'::text[],
  attached_image_storage_key  text,
  template_id                 uuid,
  provider_used               text,
  deepseek_model              text,
  request_tokens              integer,
  response_tokens             integer,
  cost_usd                    numeric(10, 4),
  plan                        text,
  proposed_files              jsonb,
  warnings                    jsonb default '[]'::jsonb,
  branch_name                 text,
  commit_sha                  text,
  pr_number                   integer,
  pr_url                      text,
  preview_url                 text,
  preview_build_seconds       integer,
  playwright_results          jsonb,
  status                      text not null,
  error_code                  text,
  error_details               jsonb,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  promoted_at                 timestamptz,
  promoted_by                 uuid references auth.users(id),
  approved_by                 uuid references auth.users(id),
  reverted_at                 timestamptz
);

create index if not exists idx_code_assist_gen_user_created
  on public.code_assistant_generations (user_id, created_at desc);
create index if not exists idx_code_assist_gen_status
  on public.code_assistant_generations (status)
  where status not in ('promoted', 'reverted');
create index if not exists idx_code_assist_gen_parent
  on public.code_assistant_generations (parent_generation_id)
  where parent_generation_id is not null;

alter table public.code_assistant_generations
  add constraint code_assistant_generations_status_chk
  check (status in (
    'validating-payload', 'checking-rate-limit', 'loading-context', 'calling-deepseek',
    'parsing-response', 'validating-response', 'committing-to-github', 'preview-pending',
    'preview-ready', 'iterating', 'self-healing', 'manual-edit-pending',
    'promoting', 'awaiting-second-approval', 'promoted', 'reverting', 'reverted',
    'failed-validation', 'failed-rate-limit-prompts', 'failed-rate-limit-cost-daily',
    'failed-rate-limit-cost-monthly', 'failed-context',
    'failed-deepseek-auth', 'failed-deepseek-rate-limit', 'failed-deepseek-timeout',
    'failed-deepseek-server', 'failed-deepseek-network', 'failed-deepseek-content-filter',
    'failed-all-providers',
    'failed-malformed-response', 'failed-empty-changeset', 'failed-syntax',
    'failed-allowlist', 'failed-locklist',
    'failed-github-auth', 'failed-github-conflict', 'failed-github-rate-limit', 'failed-github-network',
    'failed-vercel-build', 'failed-vercel-timeout', 'failed-vercel-network',
    'failed-self-heal-gave-up',
    'failed-pr', 'failed-pr-checks', 'failed-merge', 'failed-revert',
    'failed-unknown'
  ));

-- ─── Multi-turn messages (used Phase 3 onward; created now for forward compat) ──
create table if not exists public.code_assistant_messages (
  id                   uuid primary key default gen_random_uuid(),
  generation_id        uuid not null references public.code_assistant_generations(id) on delete cascade,
  turn                 integer not null,
  role                 text not null check (role in ('user', 'assistant', 'system')),
  content              text not null,
  files_at_this_turn   jsonb,
  cost_usd             numeric(10, 4),
  created_at           timestamptz default now()
);
create index if not exists idx_code_assist_msg_gen_turn
  on public.code_assistant_messages (generation_id, turn);

-- ─── Templates ──────────────────────────────────────────────────────────
create table if not exists public.code_assistant_templates (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  prompt          text not null,
  attached_files  text[] default '{}'::text[],
  is_public       boolean default false,
  used_count      integer default 0,
  created_at      timestamptz default now()
);

-- ─── Pipeline events (Supabase Realtime — Phase 3) ──────────────────────
create table if not exists public.code_assistant_pipeline_events (
  id              uuid primary key default gen_random_uuid(),
  generation_id   uuid not null references public.code_assistant_generations(id) on delete cascade,
  event_type      text not null,
  payload         jsonb not null,
  created_at      timestamptz default now()
);
create index if not exists idx_code_assist_evt_gen_created
  on public.code_assistant_pipeline_events (generation_id, created_at);

-- ─── Rate limits ────────────────────────────────────────────────────────
create table if not exists public.code_assistant_rate_limits (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  prompts_this_hour    integer not null default 0,
  hour_started_at      timestamptz not null default now(),
  cost_today_usd       numeric(10, 4) not null default 0,
  day_started_at       date not null default current_date,
  cost_this_month_usd  numeric(10, 4) not null default 0,
  month_started_at     date not null default date_trunc('month', current_date)::date,
  updated_at           timestamptz not null default now()
);

-- ─── Provider config (Phase 3) ──────────────────────────────────────────
create table if not exists public.code_assistant_provider_config (
  id                     uuid primary key default gen_random_uuid(),
  primary_provider       text not null default 'deepseek',
  fallback_chain         text[] not null default array['claude', 'openai'],
  per_provider_settings  jsonb not null default '{}'::jsonb,
  updated_at             timestamptz default now(),
  updated_by             uuid references auth.users(id)
);

-- ─── RLS ────────────────────────────────────────────────────────────────
alter table public.code_assistant_generations enable row level security;
alter table public.code_assistant_messages enable row level security;
alter table public.code_assistant_templates enable row level security;
alter table public.code_assistant_pipeline_events enable row level security;
alter table public.code_assistant_rate_limits enable row level security;
alter table public.code_assistant_provider_config enable row level security;

-- Read policies: own rows + superadmin can read all.
create policy "ca_gen_select_own_or_super"
  on public.code_assistant_generations for select
  using (user_id = auth.uid() or (auth.jwt() ->> 'role') = 'superadmin');

create policy "ca_msg_select_via_generation"
  on public.code_assistant_messages for select
  using (exists (
    select 1 from public.code_assistant_generations g
    where g.id = generation_id
      and (g.user_id = auth.uid() or (auth.jwt() ->> 'role') = 'superadmin')
  ));

create policy "ca_tmpl_select_own_or_public"
  on public.code_assistant_templates for select
  using (user_id = auth.uid() or is_public = true);

create policy "ca_evt_select_via_generation"
  on public.code_assistant_pipeline_events for select
  using (exists (
    select 1 from public.code_assistant_generations g
    where g.id = generation_id
      and (g.user_id = auth.uid() or (auth.jwt() ->> 'role') = 'superadmin')
  ));

create policy "ca_rl_select_own"
  on public.code_assistant_rate_limits for select
  using (user_id = auth.uid());

create policy "ca_provider_select_any"
  on public.code_assistant_provider_config for select
  using (true);

-- Writes only via API functions (service role bypasses RLS).
create policy "ca_gen_no_direct_writes"
  on public.code_assistant_generations for all to authenticated
  using (false) with check (false);
create policy "ca_msg_no_direct_writes"
  on public.code_assistant_messages for all to authenticated
  using (false) with check (false);
create policy "ca_evt_no_direct_writes"
  on public.code_assistant_pipeline_events for all to authenticated
  using (false) with check (false);
create policy "ca_rl_no_direct_writes"
  on public.code_assistant_rate_limits for all to authenticated
  using (false) with check (false);

-- Templates: owner can write their own.
create policy "ca_tmpl_write_own"
  on public.code_assistant_templates for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Updated-at trigger ─────────────────────────────────────────────────
create or replace function public.ca_touch_updated_at() returns trigger as $$
  begin new.updated_at := now(); return new; end;
$$ language plpgsql;

drop trigger if exists code_assist_gen_touch on public.code_assistant_generations;
create trigger code_assist_gen_touch
  before update on public.code_assistant_generations
  for each row execute function public.ca_touch_updated_at();

drop trigger if exists code_assist_rl_touch on public.code_assistant_rate_limits;
create trigger code_assist_rl_touch
  before update on public.code_assistant_rate_limits
  for each row execute function public.ca_touch_updated_at();
