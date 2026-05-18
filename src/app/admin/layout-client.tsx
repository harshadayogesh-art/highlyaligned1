'use client'

import { usePathname } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export default function AdminLayoutClient({
  children,
  userRole,
}: {
  children: React.ReactNode
  userRole: string
}) {
  const pathname = usePathname()

  const getTitle = () => {
    const segment = pathname.split('/').pop() || 'dashboard'
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <AdminSidebar userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader title={getTitle()} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
