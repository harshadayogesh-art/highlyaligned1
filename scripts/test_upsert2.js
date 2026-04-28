import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  await supabase.from('settings').upsert({ key: 'logo_config', value: { logo_url: 'test' } }, { onConflict: 'key' })
  const { data } = await supabase.from('settings').select('*').eq('key', 'logo_config')
  console.log(data)
}
test()
