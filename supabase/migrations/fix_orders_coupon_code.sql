-- Fix: add missing coupon_code column to orders table
-- Run this in your Supabase SQL Editor

alter table orders add column if not exists coupon_code text;
