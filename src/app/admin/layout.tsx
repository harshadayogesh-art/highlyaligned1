'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const getTitle = () => {
    const segment = pathname.split('/').pop() || 'dashboard'
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
  }

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login')
        return
      }

      const role = profile?.role
      if (!role || !['admin', 'editor', 'support'].includes(role)) {
        router.push('/')
        return
      }
    }
  }, [user, profile, isLoading, router])

  // Show nothing while checking auth (prevents flash of admin UI)
  if (isLoading || !user || !profile?.role || !['admin', 'editor', 'support'].includes(profile.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader title={getTitle()} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
