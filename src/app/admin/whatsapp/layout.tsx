'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, BarChart3, Users, Calendar, Workflow, Clock, Settings } from 'lucide-react'

const tabs = [
  { href: '/admin/whatsapp',              label: 'Inbox',        icon: MessageCircle, exact: true },
  { href: '/admin/whatsapp/analytics',    label: 'Analytics',    icon: BarChart3 },
  { href: '/admin/whatsapp/leads',        label: 'Leads',        icon: Users },
  { href: '/admin/whatsapp/appointments', label: 'Appointments', icon: Calendar },
  { href: '/admin/whatsapp/followups',    label: 'Follow-ups',   icon: Clock },
  { href: '/admin/whatsapp/flows',        label: 'Flows',        icon: Workflow },
  { href: '/admin/whatsapp/settings',     label: 'Settings',     icon: Settings },
]

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-background px-2 overflow-x-auto shrink-0">
        {tabs.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              }`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  )
}
