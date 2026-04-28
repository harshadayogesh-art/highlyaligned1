import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjbihxkuetcdivntxiym.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYmloeGt1ZXRjZGl2bnR4aXltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE3NTQ2MSwiZXhwIjoyMDkyNzUxNDYxfQ.rHCpqTgziRCrEWUEu-TW5OOibEtpZahMbmthFxPKdtE';

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function fixTrigger() {
  const sql = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    DECLARE
      base_name text;
      gen_code text;
    BEGIN
      base_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
      gen_code := 'HA' || UPPER(SUBSTRING(REGEXP_REPLACE(base_name, '[^a-zA-Z]', '', 'g') FROM 1 FOR 4)) || lpad(floor(random() * 100)::text, 2, '0');
      
      INSERT INTO public.profiles (id, email, name, role, referral_code)
      VALUES (
        new.id,
        new.email,
        base_name,
        'customer',
        gen_code
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  // Actually we need to execute this using a raw query. Supabase JS doesn't support raw queries directly via adminClient.rpc unless we created an exec_sql function previously.
  // Did I create exec_sql in Phase 1?
  
  const { data, error } = await adminClient.rpc('exec_sql', { sql });
  console.log("Result:", data, error);
}

fixTrigger();
