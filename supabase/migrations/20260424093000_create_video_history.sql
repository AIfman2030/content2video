-- Create video_history table
create table if not exists public.video_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  style text not null,
  source_text text not null default '',
  cover_index int not null default 0,
  content jsonb,
  nature jsonb,
  options jsonb,
  cover_url text,
  video_url text,
  duration_ms int
);

-- Index for listing by style
create index if not exists idx_video_history_style on public.video_history(style);

-- Index for ordering by creation date
create index if not exists idx_video_history_created_at on public.video_history(created_at desc);

-- Enable RLS
alter table public.video_history enable row level security;

-- Allow anyone to read
create policy "Anyone can read video history"
  on public.video_history for select
  using (true);

-- Allow anyone to insert
create policy "Anyone can insert video history"
  on public.video_history for insert
  with check (true);

-- Allow anyone to delete
create policy "Anyone can delete video history"
  on public.video_history for delete
  using (true);

-- Allow anyone to update
create policy "Anyone can update video history"
  on public.video_history for update
  using (true);
