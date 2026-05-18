import { createClient } from '@/lib/supabase/server'
import { StoreHeader } from '@/components/store/header'
import { BottomNav } from '@/components/store/bottom-nav'
import FloatingButtons from '@/components/store/floating-buttons'
import { StoreFooter } from '@/components/store/footer'

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: settingsRows } = await supabase.from('settings').select('*')

  const settings: Record<string, unknown> = {}
  settingsRows?.forEach((row: any) => {
    settings[row.key] = row.value
  })

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0 flex flex-col overflow-x-hidden">
      <StoreHeader settings={settings} />
      <main className="flex-1">{children}</main>
      <StoreFooter settings={settings} />
      <FloatingButtons />
      <BottomNav />
    </div>
  )
}
