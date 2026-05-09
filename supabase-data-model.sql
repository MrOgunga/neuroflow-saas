-- Neuroflow initial data model
-- This is the first app-phase schema for auth-based users and synced trackers.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists trackers (
  id text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  icon text not null default '✨',
  color text not null default 'green',
  position integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists tracker_entries (
  id uuid primary key default gen_random_uuid(),
  tracker_id text not null references trackers(id) on delete cascade,
  day_index integer not null check (day_index >= 0 and day_index <= 30),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (tracker_id, day_index)
);

create table if not exists daily_anchors (
  user_id uuid primary key references profiles(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'inactive',
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table trackers enable row level security;
alter table tracker_entries enable row level security;
alter table daily_anchors enable row level security;
alter table subscriptions enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users manage own trackers"
  on trackers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own tracker entries"
  on tracker_entries for all
  using (
    exists (
      select 1
      from trackers
      where trackers.id = tracker_entries.tracker_id
        and trackers.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from trackers
      where trackers.id = tracker_entries.tracker_id
        and trackers.user_id = auth.uid()
    )
  );

create policy "Users manage own daily anchor"
  on daily_anchors for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users view own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Users insert own subscriptions"
  on subscriptions for insert
  with check (auth.uid() = user_id);
