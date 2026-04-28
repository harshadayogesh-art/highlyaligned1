-- Coupons RLS Policies
-- Run this in Supabase SQL Editor

alter table coupons enable row level security;

-- Public / anonymous users can read active coupons (checkout validation)
create policy "Active coupons are viewable by everyone"
  on coupons for select
  using (is_active = true);

-- Admins can read all coupons (including inactive)
create policy "Admins can view all coupons"
  on coupons for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor')));

-- Only admins can create coupons
create policy "Only admins can insert coupons"
  on coupons for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor')));

-- Only admins can update coupons
create policy "Only admins can update coupons"
  on coupons for update
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor')));

-- Only admins can delete coupons
create policy "Only admins can delete coupons"
  on coupons for delete
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor')));
