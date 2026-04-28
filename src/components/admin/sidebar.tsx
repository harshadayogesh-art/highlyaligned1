'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { useDarkMode } from '@/hooks/use-dark-mode'
import {
  LayoutDashboard,
  ShoppingCart,
  CalendarDays,
  Package,
  FolderOpen,
  Users,
  Contact,
  Share2,
  FileText,
  BookOpen,
  Ticket,
  CreditCard,
  Settings,
  Menu,
  LogOut,
  Moon,
  Sun,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/services', label: 'Services', icon: BookOpen },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/leads', label: 'Leads', icon: Contact },
  { href: '/admin/referrals', label: 'Referrals', icon: Share2 },
  { href: '/admin/cms', label: 'CMS', icon: FileText },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

function NavList({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive
                ? 'bg-muted text-foreground border-l-4 border-[#f59e0b]'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { darkMode, toggleDarkMode } = useDarkMode()
  const signOut = useAuthStore((s) => s.signOut)

  return (
    <>
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col bg-background border-border">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="h-16 flex items-center px-4 border-b border-border">
              <span className="text-xl font-bold text-foreground">
                <span className="text-[#f59e0b]">H</span>A
              </span>
            </div>
            <NavList collapsed={false} />
            <div className="border-t border-border p-3 space-y-2">
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border bg-background transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <span className="text-xl font-bold text-foreground">
              <span className="text-[#f59e0b]">Highly</span>Aligned
            </span>
          )}
          {collapsed && (
            <span className="text-xl font-bold text-foreground mx-auto">
              <span className="text-[#f59e0b]">H</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <NavList collapsed={collapsed} />

        <div className="border-t border-border p-3 space-y-2">
          <button
            onClick={toggleDarkMode}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Toggle dark mode' : undefined}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>}
          </button>
          <button
            onClick={signOut}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
