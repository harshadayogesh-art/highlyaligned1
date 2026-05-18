-- Addresses table for customer saved addresses
-- Run this in Supabase SQL Editor

create table if not exists addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  phone text not null,
  email text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  landmark text,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table addresses enable row level security;

-- Users can view their own addresses
create policy "Users can view own addresses"
  on addresses for select
  using (auth.uid() = user_id);

-- Users can insert their own addresses
create policy "Users can insert own addresses"
  on addresses for insert
  with check (auth.uid() = user_id);

-- Users can update their own addresses
create policy "Users can update own addresses"
  on addresses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own addresses
create policy "Users can delete own addresses"
  on addresses for delete
  using (auth.uid() = user_id);

-- Admins can view all addresses
create policy "Admins can view all addresses"
  on addresses for select
  using (exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'editor', 'support')
  ));
