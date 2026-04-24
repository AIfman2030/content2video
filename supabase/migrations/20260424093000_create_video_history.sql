-- Video history table — stores generated videos and covers
create table if not exists public.video_history (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text not null,
  style       text not null check (style in ('chinese','city','aitech','nature')),
  source_text text not null,
  cover_index integer not null default 0,
  -- AI-generated structured content
  content     jsonb,             -- GeneratedContent for non-nature styles
  nature      jsonb,             -- NatureContent for nature style
  options     jsonb,             -- chineseOptions / aiOptions / etc.
  -- Optional storage URLs (set later when video is rendered)
  cover_url   text,
  video_url   text,
  duration_ms integer
);

-- Index for chronological listing
create index if not exists idx_video_history_created_at
  on public.video_history (created_at desc);

-- Index for filtering by style
create index if not exists idx_video_history_style
  on public.video_history (style);

-- Public access (no auth in this app — anyone can list/save their own history)
alter table public.video_history enable row level security;

create policy "Anyone can read video history"
  on public.video_history for select
  using (true);

create policy "Anyone can insert video history"
  on public.video_history for insert
  with check (true);

create policy "Anyone can update video history"
  on public.video_history for update
  using (true) with check (true);

create policy "Anyone can delete video history"
  on public.video_history for delete
  using (true);
