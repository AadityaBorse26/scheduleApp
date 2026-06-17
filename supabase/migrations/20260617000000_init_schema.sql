-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  timezone text default 'America/Los_Angeles',
  google_refresh_token text,
  calendar_sync_enabled boolean default false
);

-- Create recurring_availability table
create table public.recurring_availability (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  day_of_week int check (day_of_week between 0 and 6) not null,
  start_time time not null,
  end_time time not null,
  constraint start_before_end check (start_time < end_time)
);

-- Create date_overrides table
create table public.date_overrides (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  start_time time,
  end_time time,
  status text check (status in ('free','unavailable')) not null,
  constraint override_start_before_end check (start_time is null or end_time is null or start_time < end_time)
);

-- Create synced_busy_blocks table
create table public.synced_busy_blocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  source text default 'google' not null,
  last_synced_at timestamptz default now() not null,
  constraint busy_start_before_end check (start_datetime < end_datetime)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.recurring_availability enable row level security;
alter table public.date_overrides enable row level security;
alter table public.synced_busy_blocks enable row level security;

-- Create RLS Policies
-- Profiles
create policy "Allow read access to profiles for signed-in users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Allow users to modify their own profile"
  on public.profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- Recurring Availability
create policy "Allow read access to recurring availability for signed-in users"
  on public.recurring_availability for select
  using (auth.role() = 'authenticated');

create policy "Allow users to modify their own recurring availability"
  on public.recurring_availability for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Date Overrides
create policy "Allow read access to date overrides for signed-in users"
  on public.date_overrides for select
  using (auth.role() = 'authenticated');

create policy "Allow users to modify their own date overrides"
  on public.date_overrides for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Synced Busy Blocks
create policy "Allow read access to synced busy blocks for signed-in users"
  on public.synced_busy_blocks for select
  using (auth.role() = 'authenticated');

create policy "Allow users to modify their own synced busy blocks"
  on public.synced_busy_blocks for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Create Trigger to auto-create Profile on Sign Up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
