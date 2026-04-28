'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Search, User, Menu, X, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartIcon } from './cart-icon'
import { MiniCart } from './mini-cart'
import { useSettings } from '@/hooks/use-settings'
import { useAuth } from '@/hooks/use-auth'

const navLinks = [
  { href: '/shop',     label: 'Shop' },
  { href: '/services', label: 'Services' },
  { href: '/kundali',  label: 'Kundali' },
  { href: '/blog',     label: 'Blog' },
  { href: '/about',    label: 'About Us' },
  { href: '/contact',  label: 'Contact' },
]

export function StoreHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const pathname = usePathname()
  const { data: settings } = useSettings()
  const { user, isAdmin } = useAuth()

  const logoConfig = settings?.logo_config as Record<string, string> | undefined

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-violet-900 to-violet-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0 group">
          {logoConfig?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoConfig.logo_url}
              alt="Logo"
              className="h-16 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          ) : (
            <span className="text-xl font-bold tracking-tight text-white font-serif">
              ✨ HighlyAligned
            </span>
          )}
        </Link>

        {/* Desktop Nav — centred */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navLinks.map(link => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-400 text-violet-950'
                    : 'text-white/90 hover:bg-white/15 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search (desktop) */}
          <div className="hidden lg:flex items-center bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5 transition-colors">
            <Search className="h-4 w-4 text-white/70 mr-2" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm text-white placeholder-white/50 outline-none w-28"
            />
          </div>

          <CartIcon onClick={() => setCartOpen(true)} className="text-white hover:text-amber-400" />

          {user ? (
            <Link href="/account">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/15 hover:text-white rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="ghost"
                className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white border-0 text-xs px-4 h-9">
                Login
              </Button>
            </Link>
          )}

          {isAdmin && (
            <Link href="/admin/dashboard">
              <Button size="sm"
                className="rounded-full bg-amber-400 hover:bg-amber-500 text-violet-950 font-bold border-0 text-xs px-3 h-9">
                <LayoutDashboard className="h-3.5 w-3.5 mr-1" /> Admin
              </Button>
            </Link>
          )}

          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon"
            className="md:hidden text-white hover:bg-white/15 rounded-full"
            onClick={() => setMobileMenuOpen(v => !v)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <MiniCart open={cartOpen} onOpenChange={setCartOpen} />

      {/* Mobile dropdown nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-1 bg-violet-900/95 backdrop-blur-sm">
          {navLinks.map(link => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive ? 'bg-amber-400 text-violet-950' : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          {!user && (
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white">
              Login / Sign Up
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
