-- Phase 6 Schema Updates
-- Run this in Supabase SQL Editor

-- 1. Legal pages table
create table if not exists legal_pages (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  title text not null,
  content text not null,
  last_updated date not null default current_date,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table legal_pages enable row level security;

-- Public read policy
create policy "Legal pages are viewable by everyone"
  on legal_pages for select using (true);

-- Admin write policy
create policy "Only admins can update legal pages"
  on legal_pages for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

-- 2. Insert default legal pages
insert into legal_pages (slug, title, content) values
('terms', 'Terms & Conditions', 
'EFFECTIVE DATE: January 1, 2026

1. INTRODUCTION
Welcome to HighlyAligned. These Terms and Conditions govern your use of our website and services.

2. USE OF SERVICES
By accessing our website, you agree to be bound by these terms. All services are subject to availability.

3. PRODUCTS & SERVICES
We offer spiritual products, astrology consultations, and healing sessions. All descriptions are accurate to the best of our knowledge.

4. PAYMENTS
We accept online payments via Razorpay and Cash on Delivery. Prices are in INR and inclusive of applicable taxes.

5. INTELLECTUAL PROPERTY
All content, logos, and designs are the property of HighlyAligned and may not be used without permission.

6. LIMITATION OF LIABILITY
Our spiritual guidance is for informational purposes. We do not guarantee specific outcomes.

7. GOVERNING LAW
These terms are governed by the laws of India. Disputes shall be resolved in Ahmedabad, Gujarat.

8. CONTACT
For questions about these terms, contact us at harshada@highlyaligned.in'),

('privacy', 'Privacy Policy',
'EFFECTIVE DATE: January 1, 2026

1. INFORMATION WE COLLECT
We collect personal information including name, email, phone, birth details, and payment information.

2. HOW WE USE INFORMATION
- To process orders and bookings
- To provide astrology reports and consultations
- To send appointment reminders
- To improve our services

3. DATA SECURITY
We use industry-standard encryption and security measures. Your data is stored securely on Supabase.

4. SHARING OF INFORMATION
We do not sell your personal data. We may share data with payment processors (Razorpay) and delivery partners.

5. YOUR RIGHTS
You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.

6. COOKIES
We use cookies to enhance your browsing experience. You can disable cookies in your browser settings.

7. CHANGES TO THIS POLICY
We may update this policy periodically. Changes will be posted on this page.

8. CONTACT
For privacy concerns, email harshada@highlyaligned.in'),

('shipping', 'Shipping & Delivery Policy',
'1. PROCESSING TIME
Orders are processed within 1-2 business days.

2. SHIPPING PARTNERS
We partner with Delhivery, BlueDart, DTDC, and India Post for deliveries across India.

3. DELIVERY ESTIMATES
- Metro cities: 3-5 business days
- Tier 2 cities: 5-7 business days
- Remote areas: 7-10 business days

4. SHIPPING CHARGES
Free shipping on orders above Rs. 999. Standard shipping Rs. 79 for orders below.

5. TRACKING
Once shipped, you will receive a tracking number via email and WhatsApp.

6. COD ORDERS
Cash on Delivery is available for orders below Rs. 5000. A Rs. 50 COD fee applies.

7. DAMAGED GOODS
If you receive a damaged product, contact us within 48 hours with photos.

8. INTERNATIONAL SHIPPING
Currently we only ship within India. International shipping coming soon.'),

('refund', 'Cancellation & Refund Policy',
'1. ORDER CANCELLATION
Orders can be cancelled within 2 hours of placement or before shipment.

2. REFUND ELIGIBILITY
- Defective or damaged products: Full refund
- Wrong product delivered: Full refund + free replacement
- Change of mind: Store credit only (within 7 days)

3. REFUND PROCESS
Refunds are processed within 5-7 business days to the original payment method.

4. RETURN PROCESS
Contact us to initiate a return. Products must be unused and in original packaging.

5. NON-RETURNABLE ITEMS
- Used or damaged products
- Customized or personalized items
- Digital products (reports, readings)

6. CONSULTATION CANCELLATIONS
Bookings can be cancelled 24 hours before the scheduled time for a full refund.

7. NO-SHOW POLICY
If you miss your consultation without prior notice, no refund will be issued.

8. CONTACT
For refund queries, email harshada@highlyaligned.in or WhatsApp +91 84688 83571.')
on conflict (slug) do nothing;

-- 3. Insert default settings
insert into settings (key, value) values
('footer_config', '{"name":"HighlyAligned","address":"Navrangpura, Ahmedabad, Gujarat, India","email":"harshada@highlyaligned.in","phone":"+91 84688 83571","tagline":"Align Your Energy, Transform Your Life","show_newsletter":true}'::jsonb),
('social_links', '{"instagram":"","facebook":"","youtube":"","whatsapp":"+918468883571","twitter":"","linkedin":""}'::jsonb),
('cloudinary_config', '{"cloud_name":"","api_key":"","upload_preset":"highlyaligned_unsigned","folder":"highlyaligned"}'::jsonb),
('contact_info', '{"map_embed_url":"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.0!2d72.5714!3d23.0225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDAxJzIxLjAiTiA3MsKwMzQnMTcuMCJF!5e0!3m2!1sen!2sin!4v1600000000000!5m2!1sen!2sin","business_hours":"Mon-Sat: 10:00 AM - 7:00 PM","response_time":"We respond within 24 hours"}'::jsonb),
('hero_images', '{"desktop":"","mobile":"","alt":"HighlyAligned Spiritual Wellness"}'::jsonb),
('logo_config', '{"logo_url":"","favicon_url":""}'::jsonb),
('gemini_config', '{"provider":"gemini","api_key":"","model":"gemini-1.5-flash","temperature":0.7,"max_tokens":1024,"default_language":"english"}'::jsonb)
on conflict (key) do nothing;
