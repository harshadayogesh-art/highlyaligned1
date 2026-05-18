-- Make user admin: harshada.yogesh@gmail.com
-- Run this in Supabase SQL Editor

-- Step 1: Ensure profile exists and update role to admin
INSERT INTO public.profiles (id, name, email, role)
VALUES (
  '5df13997-12f2-46d6-9145-f22447fa9425',
  'Harshada Yogesh',
  'harshada.yogesh@gmail.com',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin',
    name = EXCLUDED.name,
    email = EXCLUDED.email;

-- Step 2: Verify
SELECT id, name, email, role, created_at
FROM public.profiles
WHERE id = '5df13997-12f2-46d6-9145-f22447fa9425';
