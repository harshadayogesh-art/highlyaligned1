-- Fix orders RLS to allow guest checkout
-- Also fixes profiles insert for new signups
-- Run this in your Supabase SQL Editor

-- ========== PROFILES ==========
-- Ensure users can insert their own profile during signup
drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- ========== ORDERS ==========
-- Ensure RLS is enabled on orders
alter table orders enable row level security;

-- Drop old restrictive insert policy
drop policy if exists "Customers can create orders" on orders;

-- New insert policy: allow authenticated users to create orders for themselves,
-- and allow anonymous/guest users to create orders with null customer_id
create policy "Customers can create orders"
  on orders for insert with check (
    customer_id = auth.uid()
    or (customer_id is null and auth.uid() is null)
  );

-- Drop old select policy
drop policy if exists "Customers see own orders" on orders;

-- Select policy: authenticated users see their own orders, admins see all.
-- Guest order lookups are handled by the /api/orders/[id] endpoint (service role)
-- so we do NOT expose all orders to anonymous users here.
create policy "Customers see own orders"
  on orders for select using (
    customer_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'support'))
  );

-- Ensure admins can update all orders
drop policy if exists "Admins can update orders" on orders;
create policy "Admins can update orders"
  on orders for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor', 'support'))
  );
