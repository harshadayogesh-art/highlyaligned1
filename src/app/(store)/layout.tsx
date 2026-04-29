import { StoreHeader } from '@/components/store/header'
import { BottomNav } from '@/components/store/bottom-nav'
import FloatingButtons from '@/components/store/floating-buttons'
import { StoreFooter } from '@/components/store/footer'

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0 flex flex-col overflow-x-hidden">
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
      <FloatingButtons />
      <BottomNav />
    </div>
  )
}
