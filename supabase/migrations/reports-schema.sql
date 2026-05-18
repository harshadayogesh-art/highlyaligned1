-- Reports & Analytics — GST Compliance Schema Updates
-- Run this in Supabase SQL Editor

-- 1. Add HSN code to products
 alter table products add column if not exists hsn_code text;

-- 2. Add CGST/SGST/IGST breakdown to orders
 alter table orders add column if not exists cgst_amount decimal(10,2) default 0;
 alter table orders add column if not exists sgst_amount decimal(10,2) default 0;
 alter table orders add column if not exists igst_amount decimal(10,2) default 0;
 alter table orders add column if not exists place_of_supply text;

-- 3. Add customer GSTIN to profiles (for B2B transactions)
 alter table profiles add column if not exists gstin text;
