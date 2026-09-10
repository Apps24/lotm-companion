-- LOTM Companion Phase 8 reader sync schema.
-- Stores only personal reader state. Never store EPUB prose, chapter XHTML, or EPUB media.

create or replace function public.set_reader_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.reader_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reader_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chapter_number integer not null default 1 check (chapter_number between 1 and 1430),
  scroll_positions jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reader_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookmarks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chapters integer[] not null default '{}'::integer[],
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.annotations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notes jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tts_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.reader_profiles enable row level security;
alter table public.reader_progress enable row level security;
alter table public.reader_settings enable row level security;
alter table public.bookmarks enable row level security;
alter table public.annotations enable row level security;
alter table public.tts_preferences enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['reader_profiles','reader_progress','reader_settings','bookmarks','annotations','tts_preferences']
  loop
    execute format('drop policy if exists "reader owns %1$s" on public.%1$I', table_name);
    execute format(
      'create policy "reader owns %1$s" on public.%1$I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      table_name
    );
  end loop;
end $$;

revoke all on public.reader_profiles from anon;
revoke all on public.reader_progress from anon;
revoke all on public.reader_settings from anon;
revoke all on public.bookmarks from anon;
revoke all on public.annotations from anon;
revoke all on public.tts_preferences from anon;

grant select, insert, update, delete on public.reader_profiles to authenticated;
grant select, insert, update, delete on public.reader_progress to authenticated;
grant select, insert, update, delete on public.reader_settings to authenticated;
grant select, insert, update, delete on public.bookmarks to authenticated;
grant select, insert, update, delete on public.annotations to authenticated;
grant select, insert, update, delete on public.tts_preferences to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['reader_profiles','reader_progress','reader_settings','bookmarks','annotations','tts_preferences']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_reader_updated_at()',
      table_name
    );
  end loop;
end $$;

comment on table public.reader_progress is 'Personal LOTM reader position only; no novel prose.';
comment on table public.annotations is 'User-authored private chapter notes only; no imported chapter text.';
