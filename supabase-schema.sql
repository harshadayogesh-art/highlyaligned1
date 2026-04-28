-- HighlyAligned Database Schema
-- Run this in Supabase SQL Editor

-- 1. PROFILES (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'editor', 'support')),
  referral_code text unique,
  gstin text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- 2. SETTINGS (master configuration)
create table if not exists settings (
  id uuid default gen_random_uuid() primary key,
  key text not null unique,
  value jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. CATEGORIES
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  type text not null check (type in ('product', 'service')),
  parent_id uuid references categories(id),
  image text,
  description text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. PRODUCTS
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  how_to_use text,
  energization_process text,
  price decimal(10,2) not null,
  mrp decimal(10,2) not null,
  stock int not null default 0,
  sku text,
  category_id uuid references categories(id),
  images text[] default '{}',
  gst_applicable boolean default false,
  gst_rate decimal(5,2) default 0,
  hsn_code text,
  weight_grams int,
  status text not null default 'draft' check (status in ('draft', 'published', 'out_of_stock', 'hidden')),
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. SERVICES
create table if not exists services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  duration_minutes int not null,
  price decimal(10,2) not null,
  mode text[] not null default '{}' check (mode <@ array['video', 'phone', 'chat', 'in_person']::text[]),
  buffer_time_minutes int default 15,
  category_id uuid references categories(id),
  color_code text default '#8b5cf6',
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 6. ORDERS
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  order_number text not null unique,
  customer_id uuid references profiles(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  subtotal decimal(10,2) not null,
  gst_amount decimal(10,2) default 0,
  discount_amount decimal(10,2) default 0,
  shipping_amount decimal(10,2) default 0,
  final_total decimal(10,2) not null,
  payment_mode text not null check (payment_mode in ('online', 'cod')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'captured', 'failed', 'refunded')),
  razorpay_order_id text,
  razorpay_payment_id text,
  shipping_address jsonb not null,
  courier_name text,
  tracking_id text,
  shipping_label_url text,
  coupon_code text,
  cod_collected boolean default false,
  cod_collection_date timestamptz,
  gst_enabled_at_checkout boolean default false,
  cgst_amount decimal(10,2) default 0,
  sgst_amount decimal(10,2) default 0,
  igst_amount decimal(10,2) default 0,
  place_of_supply text,
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. ORDER ITEMS
create table if not exists order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null,
  price decimal(10,2) not null,
  total decimal(10,2) not null,
  gst_rate decimal(5,2) default 0,
  gst_amount decimal(10,2) default 0
);

-- 8. BOOKINGS
create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  booking_number text not null unique,
  customer_id uuid references profiles(id),
  service_id uuid references services(id),
  date date not null,
  time_slot text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  mode text not null check (mode in ('video', 'phone', 'chat', 'in_person')),
  intake_data jsonb default '{}',
  meet_link text,
  session_notes text,
  remedies_added boolean default false,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'captured', 'refunded')),
  amount decimal(10,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. REMEDIES
create table if not exists remedies (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references profiles(id),
  booking_id uuid references bookings(id),
  title text not null,
  description text,
  duration_days int,
  frequency text,
  instructions text,
  attachment_url text,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 10. REMEDY LOGS
create table if not exists remedy_logs (
  id uuid default gen_random_uuid() primary key,
  remedy_id uuid references remedies(id) on delete cascade,
  customer_id uuid references profiles(id),
  log_date date not null,
  status text not null check (status in ('done', 'skipped')),
  note text,
  created_at timestamptz default now()
);

-- 11. LEADS
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  mobile text not null,
  email text,
  dob date,
  birth_time text,
  birth_location text,
  area_of_life_id uuid,
  customer_question text,
  ai_answer text,
  ai_prompt_used text,
  source text not null default 'free_report' check (source in ('free_report', 'whatsapp', 'manual', 'referral')),
  status text not null default 'new' check (status in ('new', 'contacted', 'interested', 'follow_up', 'converted', 'cold')),
  converted_to_customer_id uuid references profiles(id),
  report_data_json jsonb default '{}',
  created_at timestamptz default now()
);

-- 12. LEAD MAGNET AREAS
create table if not exists lead_magnet_areas (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon text default '✨',
  slug text not null unique,
  sort_order int default 0,
  is_active boolean default true,
  ai_prompt text not null default 'You are a Vedic astrology expert. Based on the birth details: {birth_details}, answer this question about {area_name}: {question}. Keep it warm, specific, and actionable.',
  created_at timestamptz default now()
);

alter table lead_magnet_areas enable row level security;

create policy "Lead magnet areas are viewable by everyone"
  on lead_magnet_areas for select using (true);

create policy "Only admins can insert lead magnet areas"
  on lead_magnet_areas for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

create policy "Only admins can update lead magnet areas"
  on lead_magnet_areas for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

create policy "Only admins can delete lead magnet areas"
  on lead_magnet_areas for delete using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

-- 13. REFERRALS
create table if not exists referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references profiles(id),
  referee_id uuid references profiles(id),
  code_used text not null,
  order_id uuid references orders(id),
  booking_id uuid references bookings(id),
  commission_amount decimal(10,2) default 0,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz default now()
);

-- 14. COUPONS
create table if not exists coupons (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  type text not null check (type in ('percentage', 'fixed', 'free_shipping')),
  value decimal(10,2) not null,
  min_order_amount decimal(10,2) default 0,
  max_uses int,
  usage_count int default 0,
  per_customer_limit int default 1,
  valid_from date,
  valid_to date,
  applicable_to text[] default array['all']::text[],
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Coupons RLS
alter table coupons enable row level security;
create policy "Active coupons are viewable by everyone"
  on coupons for select using (is_active = true);
create policy "Admins can view all coupons"
  on coupons for select using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor')));
create policy "Only admins can insert coupons"
  on coupons for insert with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor')));
create policy "Only admins can update coupons"
  on coupons for update using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor')));
create policy "Only admins can delete coupons"
  on coupons for delete using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor')));

-- 15. BANNERS
create table if not exists banners (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image text not null,
  link text,
  position text not null check (position in ('hero', 'section_2', 'section_3')),
  sort_order int default 0,
  start_date date,
  end_date date,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 16. PAGES (CMS)
create table if not exists pages (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  title text not null,
  content text,
  meta_title text,
  meta_description text,
  og_image text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 17. BLOG POSTS
create table if not exists blog_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  featured_image text,
  category text,
  tags text[] default '{}',
  author text default 'Harshada Yogesh',
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  published_at timestamptz,
  views int default 0,
  meta_title text,
  meta_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table blog_posts enable row level security;

-- Blog Posts: Public reads published, admin/editor full access
create policy "Published blog posts are viewable by everyone"
  on blog_posts for select using (status = 'published');

create policy "Admins can view all blog posts"
  on blog_posts for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

create policy "Only admins can insert blog posts"
  on blog_posts for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

create policy "Only admins can update blog posts"
  on blog_posts for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

create policy "Only admins can delete blog posts"
  on blog_posts for delete using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

-- ROW LEVEL SECURITY POLICIES

-- Profiles: Users can read all, update own
create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Products: Public read, admin write
create policy "Products are viewable by everyone"
  on products for select using (true);

create policy "Only admins can insert products"
  on products for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

create policy "Only admins can update products"
  on products for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

-- Orders: Customer sees own, admin sees all
create policy "Customers see own orders"
  on orders for select using (
    customer_id = auth.uid() or 
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'support'))
  );

create policy "Customers can create orders"
  on orders for insert with check (customer_id = auth.uid());

-- Bookings: Customer sees own, admin sees all
create policy "Customers see own bookings"
  on bookings for select using (
    customer_id = auth.uid() or 
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'support'))
  );

-- Leads: Admin only
create policy "Leads admin only"
  on leads for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'support'))
  );

-- Functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    upper(substring(md5(random()::text), 1, 8))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ═══════════════════════════════════════════════════════════════
-- INFLUENCER / AFFILIATE PROGRAM
-- ═══════════════════════════════════════════════════════════════

-- Influencers table
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

-- Link coupons to influencers
 alter table coupons add column if not exists influencer_id uuid references influencers(id);

-- Influencer commissions table
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

-- Indexes
 create index if not exists idx_coupons_influencer_id on coupons(influencer_id);
 create index if not exists idx_influencer_commissions_influencer_id on influencer_commissions(influencer_id);
 create index if not exists idx_influencer_commissions_order_id on influencer_commissions(order_id);
 create index if not exists idx_influencer_commissions_status on influencer_commissions(status);

-- Function: auto-create commission on order insert
 create or replace function public.handle_influencer_commission()
 returns trigger as $$
 declare
  v_coupon record;
  v_influencer record;
  v_commission_amount decimal(10,2);
 begin
  if new.coupon_code is not null and new.status not in ('cancelled', 'returned') then
    select * into v_coupon from public.coupons
    where code = new.coupon_code and influencer_id is not null
    limit 1;

    if found then
      select * into v_influencer from public.influencers
      where id = v_coupon.influencer_id and status = 'active'
      limit 1;

      if found then
        v_commission_amount := round(new.final_total * (v_influencer.commission_rate / 100), 2);

        insert into public.influencer_commissions (
          influencer_id, order_id, sale_amount, commission_rate, commission_amount, status
        ) values (
          v_influencer.id, new.id, new.final_total, v_influencer.commission_rate, v_commission_amount, 'pending'
        );

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

-- Trigger on orders
 drop trigger if exists trg_influencer_commission on orders;
 create trigger trg_influencer_commission
  after insert on orders
  for each row
  execute function public.handle_influencer_commission();

-- RLS: influencers
 alter table influencers enable row level security;
 create policy "Admins can manage influencers"
  on influencers for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor')));
 create policy "Influencers can view own profile"
  on influencers for select
  using (exists (select 1 from profiles where id = auth.uid() and email = influencers.email));

-- RLS: influencer_commissions
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
