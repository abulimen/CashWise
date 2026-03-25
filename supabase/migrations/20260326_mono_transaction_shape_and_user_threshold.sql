-- Align transactions table with Mono statement shape
alter table if exists public.transactions
  add column if not exists type text,
  add column if not exists narration text,
  add column if not exists balance numeric(14,2),
  add column if not exists date timestamptz,
  add column if not exists category text;

-- Backfill from older columns if present
update public.transactions
set type = coalesce(type, tx_type)
where type is null;

update public.transactions
set date = coalesce(date, tx_date)
where date is null;

-- Set minimum constraints for required Mono fields
alter table public.transactions
  alter column type set not null,
  alter column amount set not null,
  alter column date set not null;

alter table public.transactions
  add constraint if not exists transactions_type_check check (type in ('credit','debit'));

-- Remove non-Mono fields from storage contract
alter table if exists public.transactions
  drop column if exists description,
  drop column if exists tx_type,
  drop column if exists tx_date,
  drop column if exists metadata,
  drop column if exists mono_tx_id;

-- User configurable inflow threshold
alter table if exists public.user_profiles
  add column if not exists bulk_inflow_min_amount numeric(14,2) not null default 10000;
