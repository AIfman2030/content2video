create table if not exists public.payment_webhook_events (
  id text primary key,
  provider text not null,
  event_type text not null,
  created_at timestamptz not null default now()
);

alter table public.payment_webhook_events enable row level security;
revoke all on public.payment_webhook_events from anon, authenticated;
