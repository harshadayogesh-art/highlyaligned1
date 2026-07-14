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
  MessageCircle,
  Workflow,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'editor', 'support'] },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, roles: ['admin', 'editor', 'support'] },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarDays, roles: ['admin', 'editor', 'support'] },
  { href: '/admin/whatsapp', label: 'WhatsApp CRM', icon: MessageCircle, roles: ['admin', 'editor', 'support'] },
  { href: '/admin/products', label: 'Products', icon: Package, roles: ['admin', 'editor'] },
  { href: '/admin/services', label: 'Services', icon: BookOpen, roles: ['admin', 'editor'] },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen, roles: ['admin', 'editor'] },
  { href: '/admin/customers', label: 'Customers', icon: Users, roles: ['admin', 'editor', 'support'] },
  { href: '/admin/leads', label: 'Leads', icon: Contact, roles: ['admin', 'editor', 'support'] },
  { href: '/admin/referrals', label: 'Referrals', icon: Share2, roles: ['admin', 'editor'] },
  { href: '/admin/cms', label: 'CMS', icon: FileText, roles: ['admin', 'editor'] },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen, roles: ['admin', 'editor'] },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket, roles: ['admin', 'editor'] },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard, roles: ['admin'] },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
]

function NavList({ collapsed, userRole }: { collapsed: boolean; userRole: string }) {
  const pathname = usePathname()
  const visibleItems = navItems.filter((item) => item.roles.includes(userRole))

  return (
    <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
      {visibleItems.map((item) => {
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

interface AdminSidebarProps {
  userRole: string
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
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
                <span className="text-[#f59e0b]">S</span>A
              </span>
            </div>
            <NavList collapsed={false} userRole={userRole} />
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
              <span className="text-[#f59e0b]">Self</span>aligned
            </span>
          )}
          {collapsed && (
            <span className="text-xl font-bold text-foreground mx-auto">
              <span className="text-[#f59e0b]">S</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <NavList collapsed={collapsed} userRole={userRole} />

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
