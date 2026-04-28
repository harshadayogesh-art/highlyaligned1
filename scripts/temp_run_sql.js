import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  console.log('Running query...')
  // Cannot run ALTER TABLE directly with supabase-js unless using rpc, but let's try
  // Wait, service role doesn't let you run DDL. We need psql.
}

run()
