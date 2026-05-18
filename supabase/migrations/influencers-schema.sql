-- Influencer / Affiliate Program Schema
-- Run this in Supabase SQL Editor

-- 1. Influencers table
 create table if not exists influencers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  commission_rate decimal(5,2) not null default 10.00,
  bio text,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  total_sales decimal(10,2) default 0,
  total_commission_earned decimal(10,2) default 0,
  total_commission_paid decimal(10,2) default 0,
  created_at timestamptz default now()
);

-- 2. Link coupons to influencers
 alter table coupons add column if not exists influencer_id uuid references influencers(id);

-- 3. Influencer commissions table
 create table if not exists influencer_commissions (
  id uuid default gen_random_uuid() primary key,
  influencer_id uuid not null references influencers(id),
  order_id uuid references orders(id),
  sale_amount decimal(10,2) not null,
  commission_rate decimal(5,2) not null,
  commission_amount decimal(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- 4. Indexes
 create index if not exists idx_coupons_influencer_id on coupons(influencer_id);
 create index if not exists idx_influencer_commissions_influencer_id on influencer_commissions(influencer_id);
 create index if not exists idx_influencer_commissions_order_id on influencer_commissions(order_id);
 create index if not exists idx_influencer_commissions_status on influencer_commissions(status);

-- 5. Function to auto-create commission on order insert
 create or replace function public.handle_influencer_commission()
 returns trigger as $$
 declare
  v_coupon record;
  v_influencer record;
  v_commission_amount decimal(10,2);
 begin
  -- Only process if order has a coupon code and is in a payable status
  if new.coupon_code is not null and new.status not in ('cancelled', 'returned') then
    -- Find the coupon linked to an influencer
    select * into v_coupon from public.coupons
    where code = new.coupon_code and influencer_id is not null
    limit 1;

    if found then
      -- Get influencer commission rate
      select * into v_influencer from public.influencers
      where id = v_coupon.influencer_id and status = 'active'
      limit 1;

      if found then
        v_commission_amount := round(new.final_total * (v_influencer.commission_rate / 100), 2);

        -- Insert commission record
        insert into public.influencer_commissions (
          influencer_id, order_id, sale_amount, commission_rate, commission_amount, status
        ) values (
          v_influencer.id, new.id, new.final_total, v_influencer.commission_rate, v_commission_amount, 'pending'
        );

        -- Update influencer totals
        update public.influencers
        set total_sales = total_sales + new.final_total,
            total_commission_earned = total_commission_earned + v_commission_amount
        where id = v_influencer.id;
      end if;
    end if;
  end if;

  return new;
 end;
 $$ language plpgsql;

-- 6. Trigger on orders
 drop trigger if exists trg_influencer_commission on orders;
 create trigger trg_influencer_commission
  after insert on orders
  for each row
  execute function public.handle_influencer_commission();

-- 7. RLS on influencers
 alter table influencers enable row level security;

 create policy "Admins can manage influencers"
  on influencers for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor')));

 create policy "Influencers can view own profile"
  on influencers for select
  using (exists (
    select 1 from profiles where id = auth.uid() and email = influencers.email
  ));

-- 8. RLS on influencer_commissions
 alter table influencer_commissions enable row level security;

 create policy "Admins can manage commissions"
  on influencer_commissions for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor')));

 create policy "Influencers can view own commissions"
  on influencer_commissions for select
  using (exists (
    select 1 from influencers i
    join profiles p on p.email = i.email
    where i.id = influencer_commissions.influencer_id and p.id = auth.uid()
  ));
