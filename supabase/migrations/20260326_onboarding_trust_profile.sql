create table if not exists public.user_onboarding (
  user_id uuid primary key references auth.users(id) on delete cascade,
  consent_given boolean not null default false,
  consent_text text,
  encrypted_profile_blob text,
  wrapped_dek text,
  iv text,
  profile_version int not null default 1,
  confidence_overall int not null default 0,
  onboarding_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.user_onboarding enable row level security;

create policy if not exists user_onboarding_owner_select
on public.user_onboarding for select
using (auth.uid() = user_id);

create policy if not exists user_onboarding_owner_upsert
on public.user_onboarding for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
