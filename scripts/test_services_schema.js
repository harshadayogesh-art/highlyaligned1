import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data, error } = await supabase.rpc('get_schema', { table_name: 'services' })
  // wait rpc might not exist, let's just query a single non-existent row so error returns hint or just use standard approach
  const { data: d2, error: e2 } = await supabase.from('services').select('*').limit(1)
  console.log(e2) // no error
  // Let's do a trick: inserting an invalid type to see the error, or query information_schema if we can (REST API doesn't expose it usually)
}
test()
