-- Daily Planner schema
-- Run this in Supabase: Dashboard → SQL Editor → New query → paste & run

-- Tasks
create table if not exists public.tasks (
  id           bigint       primary key,
  user_id      uuid         not null references auth.users(id) on delete cascade,
  title        text         not null,
  cat          text         not null default 'work',
  done         boolean      not null default false,
  postponed    boolean      not null default false,
  expanded     boolean      not null default false,
  show_ai      boolean      not null default false,
  ai_suggestions jsonb      not null default '[]',
  subtasks     jsonb        not null default '[]',
  created_at   timestamptz  not null default now()
);

-- Someday items
create table if not exists public.someday (
  id           bigint       primary key,
  user_id      uuid         not null references auth.users(id) on delete cascade,
  title        text         not null,
  cat          text         not null default 'personal',
  created_at   timestamptz  not null default now()
);

-- Per-user meta (streak, dates)
create table if not exists public.meta (
  user_id          uuid        primary key references auth.users(id) on delete cascade,
  last_active_date text,
  streak_dates     jsonb       not null default '[]',
  longest_streak   integer     not null default 0,
  updated_at       timestamptz not null default now()
);

-- Row Level Security
alter table public.tasks   enable row level security;
alter table public.someday enable row level security;
alter table public.meta    enable row level security;

create policy "tasks: own rows only"
  on public.tasks for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "someday: own rows only"
  on public.someday for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "meta: own row only"
  on public.meta for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
