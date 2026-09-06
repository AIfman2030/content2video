create table if not exists public.memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('monthly', 'quarterly', 'yearly', 'lifetime')),
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled')),
  provider_customer_id text,
  provider_subscription_id text unique,
  provider_transaction_id text unique,
  expires_at timestamptz,
  lifetime boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.memberships enable row level security;

drop policy if exists "Users can read their own membership" on public.memberships;
create policy "Users can read their own membership"
  on public.memberships for select
  to authenticated
  using (auth.uid() = user_id);

revoke insert, update, delete on public.memberships from anon, authenticated;
grant select on public.memberships to authenticated;

create index if not exists memberships_customer_id_idx on public.memberships(provider_customer_id);
