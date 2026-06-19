'use client'

import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Phone, Mail, MapPin, Globe, Smartphone } from 'lucide-react'

interface StoreFooterProps {
  settings?: Record<string, unknown>
}

export function StoreFooter({ settings }: StoreFooterProps) {
  return <StoreFooterContent settings={settings} />
}

function StoreFooterContent({ settings }: { settings?: Record<string, unknown> }) {
  const footer = (settings?.footer_config as Record<string, string | boolean>) || {}
  const social = (settings?.social_links as Record<string, string>) || {}
  const logoConfig = (settings?.logo_config as Record<string, string>) || {}

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            {logoConfig.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoConfig.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
            )}
            <div className="flex flex-col leading-none gap-1">
              <h3 className="text-white font-bold text-xl font-serif tracking-tight">
                {footer.name || 'Selfaligned'}
              </h3>
              <span className="text-[10px] text-amber-400/80 font-medium tracking-wider uppercase">
                Spiritual Wellness
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {footer.tagline || 'Align Your Energy, Transform Your Life'}
            </p>
            {footer.address && (
              <p className="text-xs text-slate-500 flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span className="flex flex-col gap-1">
                  <span>{footer.address as string}</span>
                  <span className="font-medium mt-1 text-slate-400">GSTIN: GST not applicable – annual turnover below ₹20 lakh threshold</span>
                </span>
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wide">Quick Links</h4>
            <div className="space-y-2">
              <Link href="/shop" className="block text-sm hover:text-[#f59e0b] transition-colors">Shop</Link>
              <Link href="/services" className="block text-sm hover:text-[#f59e0b] transition-colors">Services</Link>
              <Link href="/track-order" className="block text-sm hover:text-[#f59e0b] transition-colors">Track Order</Link>
              <Link href="/about" className="block text-sm hover:text-[#f59e0b] transition-colors">About</Link>
              <Link href="/contact" className="block text-sm hover:text-[#f59e0b] transition-colors">Contact</Link>
              <Link href="/kundali" className="block text-sm hover:text-[#f59e0b] transition-colors">Free Kundali</Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wide">Legal</h4>
            <div className="space-y-2">
              <Link href="/legal/terms" className="block text-sm hover:text-[#f59e0b] transition-colors">Terms</Link>
              <Link href="/legal/privacy" className="block text-sm hover:text-[#f59e0b] transition-colors">Privacy</Link>
              <Link href="/legal/shipping" className="block text-sm hover:text-[#f59e0b] transition-colors">Shipping</Link>
              <Link href="/legal/refund" className="block text-sm hover:text-[#f59e0b] transition-colors">Refund</Link>
            </div>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wide">Contact</h4>
            <div className="space-y-2">
              {footer.phone && (
                <a href={`tel:${footer.phone}`} className="flex items-center gap-2 text-sm hover:text-[#f59e0b]">
                  <Phone className="h-3.5 w-3.5" /> {footer.phone as string}
                </a>
              )}
              {footer.email && (
                // TODO: Replace with domain email support@selfaligned.in once set up
                <a href={`mailto:${footer.email}`} className="flex items-center gap-2 text-sm hover:text-[#f59e0b]">
                  <Mail className="h-3.5 w-3.5" /> {footer.email as string}
                </a>
              )}
            </div>

            {footer.show_newsletter && (
              <form
                className="pt-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  toast.success('Thank you for subscribing!')
                }}
              >
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Your email"
                    required
                    className="bg-slate-800 border-slate-700 text-sm h-9"
                  />
                  <Button type="submit" size="sm" className="bg-[#f59e0b] text-slate-900 h-9">
                    Subscribe
                  </Button>
                </div>
              </form>
            )}

            {/* Social */}
            <div className="flex gap-3 pt-2">
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#f59e0b] transition-colors">
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#f59e0b] transition-colors">
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#f59e0b] transition-colors">
                  <Smartphone className="h-4 w-4" />
                </a>
              )}
              {social.whatsapp && (
                <a href={`https://wa.me/${social.whatsapp.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#f59e0b] transition-colors">
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-center text-xs text-slate-500" suppressHydrationWarning>
          &copy; {new Date().getFullYear()} {footer.name || 'Selfaligned'}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
