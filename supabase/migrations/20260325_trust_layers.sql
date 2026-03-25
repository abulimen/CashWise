create table if not exists encrypted_transaction_cache (
  user_id text primary key,
  encrypted_blob text not null,
  wrapped_dek text not null,
  iv text not null,
  last_fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table encrypted_transaction_cache enable row level security;

create policy if not exists encrypted_cache_owner_select
on encrypted_transaction_cache
for select
using (auth.uid()::text = user_id);

create policy if not exists encrypted_cache_owner_upsert
on encrypted_transaction_cache
for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create table if not exists ai_feedback (
  id bigserial primary key,
  user_id text not null,
  query text not null,
  ai_suggestion text not null,
  user_explanation text not null,
  timestamp timestamptz not null default now()
);

alter table ai_feedback enable row level security;

create policy if not exists ai_feedback_owner_select
on ai_feedback
for select
using (auth.uid()::text = user_id);

create policy if not exists ai_feedback_owner_insert
on ai_feedback
for insert
with check (auth.uid()::text = user_id);

create table if not exists ai_audit_trail (
  id bigserial primary key,
  user_id text not null,
  timestamp timestamptz not null default now(),
  action text not null,
  suggestion text not null,
  user_decision text not null,
  confidence integer not null default 0
);

alter table ai_audit_trail enable row level security;

create policy if not exists ai_audit_owner_select
on ai_audit_trail
for select
using (auth.uid()::text = user_id);

create policy if not exists ai_audit_owner_insert
on ai_audit_trail
for insert
with check (auth.uid()::text = user_id);
