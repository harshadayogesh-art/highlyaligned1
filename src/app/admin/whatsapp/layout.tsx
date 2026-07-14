'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageCircle, BarChart3, Users, Calendar,
  Workflow, Clock, Settings, ChevronRight, Zap
} from 'lucide-react'

const waNav = [
  { href: '/admin/whatsapp', label: 'Inbox', icon: MessageCircle, exact: true },
  { href: '/admin/whatsapp/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/whatsapp/leads', label: 'Leads', icon: Users },
  { href: '/admin/whatsapp/appointments', label: 'Appointments', icon: Calendar },
  { href: '/admin/whatsapp/followups', label: 'Follow-ups', icon: Clock },
  { href: '/admin/whatsapp/flows', label: 'Flow Builder', icon: Workflow },
  { href: '/admin/whatsapp/settings', label: 'Settings', icon: Settings },
]

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full gap-0 -m-6">
      {/* Top nav bar */}
      <div className="flex items-center gap-1 px-4 py-0 border-b border-border bg-background overflow-x-auto shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 pr-4 border-r border-border mr-2 py-3 shrink-0">
          <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm text-foreground">WA CRM</span>
        </div>

        {waNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  )
}
