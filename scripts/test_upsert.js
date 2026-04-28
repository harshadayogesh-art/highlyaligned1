import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data, error } = await supabase.from('settings').upsert({ key: 'logo_config', value: { logo_url: 'test' } }, { onConflict: 'key' })
  console.log(JSON.stringify({ data, error }, null, 2))
}
test()
