'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarDays,
  Sparkles,
  MapPin,
  Gift,
  User,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const navItems = [
  { href: '/account', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/account/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/account/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/account/remedies', label: 'Remedies', icon: Sparkles },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/referral', label: 'Referral', icon: Gift },
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/settings', label: 'Settings', icon: Settings },
]

function AccountSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="flex flex-col h-full">
      {/* User mini profile */}
      <div className="p-4 border-b border-slate-100">
        <p className="text-sm text-slate-500">Welcome back,</p>
        <p className="font-semibold text-slate-900 truncate">{profile?.name || 'Customer'}</p>
        <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/account' && pathname.startsWith(item.href + '/'))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-100">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 text-sm"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const currentLabel = navItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== '/account' && pathname.startsWith(item.href + '/'))
  )?.label || 'Account'

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto">
        {/* Mobile header — sticky below store header (h-20) */}
        <div className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 sticky top-20 z-40">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Account Menu</SheetTitle>
              </SheetHeader>
              <AccountSidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="text-sm font-semibold text-slate-900">{currentLabel}</h1>
          <div className="w-8" />
        </div>

        {/* Mobile quick nav — horizontal scroll */}
        <div className="lg:hidden overflow-x-auto scrollbar-hide bg-white border-b border-slate-100">
          <div className="flex gap-1.5 px-3 py-2.5 min-w-max">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/account' && pathname.startsWith(item.href + '/'))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'text-slate-600 border border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-20 h-[calc(100vh-5rem)] bg-white border-r border-slate-200">
            <AccountSidebar />
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="p-3 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
