-- HighlyAligned Booking System Upgrade
-- Run this SQL in Supabase SQL Editor

-- 1. Add availability columns to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS working_hours_start time DEFAULT '10:00',
ADD COLUMN IF NOT EXISTS working_hours_end time DEFAULT '19:00',
ADD COLUMN IF NOT EXISTS slot_interval_minutes int DEFAULT 30,
ADD COLUMN IF NOT EXISTS blocked_dates date[] DEFAULT '{}';

-- 2. Add unique partial index to prevent double-bookings
-- This prevents two active bookings at the same service + date + time_slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_slot
ON bookings (service_id, date, time_slot)
WHERE status NOT IN ('cancelled', 'no_show');

-- 3. Back-fill existing services with sensible defaults
UPDATE services
SET
  working_hours_start = COALESCE(working_hours_start, '10:00'),
  working_hours_end = COALESCE(working_hours_end, '19:00'),
  slot_interval_minutes = COALESCE(slot_interval_minutes, 30),
  blocked_dates = COALESCE(blocked_dates, '{}'),
  buffer_time_minutes = COALESCE(buffer_time_minutes, 15)
WHERE working_hours_start IS NULL;
