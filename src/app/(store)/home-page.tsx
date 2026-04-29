'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/use-settings'
import { useProducts } from '@/hooks/use-products'
import { useServices } from '@/hooks/use-services'
import { getOptimizedImage } from '@/lib/cloudinary'
import {
  ShoppingBag,
  Calendar,
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Gem,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  Zap,
  Plus,
  Clock,
  ArrowUpRight,
} from 'lucide-react'
import LeadMagnetPopup from '@/components/store/lead-magnet-popup'
import { usePageBlockMap, type BlockData } from '@/components/store/page-block'
import type { ProductWithCategory } from '@/hooks/use-products'
import { useCartStore } from '@/stores/cart-store'
import { useRouter } from 'next/navigation'

/* ── Home Product Card with Mobile Actions ── */
function HomeProductGrid({ products }: { products: ProductWithCategory[] }) {
  const addItem = useCartStore((s) => s.addItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const router = useRouter()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
      {products.map((product) => {
        const image = product.images?.[0] || '/placeholder.svg'
        const isOutOfStock = product.status === 'out_of_stock' || product.stock <= 0
        const discount = product.mrp > product.price
          ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
          : 0

        const handleAdd = (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          if (isOutOfStock) return
          addItem(
            {
              productId: product.id,
              name: product.name,
              image,
              price: product.price,
              mrp: product.mrp,
              maxStock: product.stock,
            },
            1
          )
        }

        const handleBuyNow = (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          if (isOutOfStock) return
          clearCart()
          addItem(
            {
              productId: product.id,
              name: product.name,
              image,
              price: product.price,
              mrp: product.mrp,
              maxStock: product.stock,
            },
            1
          )
          router.push('/checkout')
        }

        return (
          <div
            key={product.id}
            className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col group"
          >
            <Link href={`/shop/${product.slug}`} className="block">
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {discount > 0 && (
                  <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full">
                    -{discount}%
                  </span>
                )}
              </div>
            </Link>
            <div className="p-3 md:p-4 flex flex-col flex-1">
              <Link href={`/shop/${product.slug}`}>
                <h3 className="font-semibold text-xs md:text-sm text-slate-900 line-clamp-2 leading-tight mb-2 flex-1">
                  {product.name}
                </h3>
              </Link>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-black text-sm md:text-base text-violet-800">
                  ₹{product.price}
                </span>
                {product.mrp > product.price && (
                  <span className="text-[10px] md:text-xs text-slate-400 line-through">
                    ₹{product.mrp}
                  </span>
                )}
              </div>
              {/* Mobile: full-width action buttons */}
              <div className="flex flex-col gap-1.5 md:hidden">
                <Button
                  size="sm"
                  className="w-full h-9 bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold text-xs"
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                >
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  Buy Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-9 text-xs font-medium"
                  disabled={isOutOfStock}
                  onClick={handleAdd}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add to Cart
                </Button>
              </div>
              {/* Desktop: compact bag icon */}
              <Link href={`/shop/${product.slug}`} className="hidden md:block">
                <div className="flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-violet-700 text-white flex items-center justify-center hover:bg-violet-800 transition-colors">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function LandingPage() {
  const blocks = usePageBlockMap('home')
  const { data: settings } = useSettings()

  const heroImages = settings?.hero_images
  const desktopBanners =
    (heroImages?.desktops as string[]) ||
    (heroImages?.desktop ? [heroImages.desktop as string] : []) ||
    blocks['hero_banner']?.images ||
    []
  const mobileBanners =
    (heroImages?.mobiles as string[]) ||
    (heroImages?.mobile ? [heroImages.mobile as string] : []) ||
    blocks['hero_banner']?.images ||
    []
  const heroAlt = heroImages?.alt || 'HighlyAligned Spiritual Wellness'

  const [currentSlide, setCurrentSlide] = useState(0)

  const { data: productsData } = useProducts({ status: 'published', limit: 100 })
  const allItems = productsData?.data || []
  const normalizedItems = allItems.map((item) => ({
    ...item,
    categories: Array.isArray(item.categories) ? item.categories[0] : item.categories,
  }))
  const featuredProducts = normalizedItems.filter(
    (item) => item.categories?.type === 'product' && item.metadata?.is_featured
  )

  const { data: servicesData } = useServices({ activeOnly: true })
  const featuredServices = (servicesData || []).filter((s) => s.is_featured)

  useEffect(() => {
    if (desktopBanners.length <= 1) return
    const iv = setInterval(
      () => setCurrentSlide((p) => (p + 1) % desktopBanners.length),
      5000
    )
    return () => clearInterval(iv)
  }, [desktopBanners.length])

  return (
    <div className="overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════════════
          HERO
          Mobile: compact carousel with overlay text at bottom
          Desktop: full-bleed carousel with large left-aligned text
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative w-full h-[55vh] md:h-[80vh] min-h-[400px] md:min-h-[600px] flex flex-col justify-end overflow-hidden pb-12 md:pb-20 px-4 md:px-8 isolate">
        {desktopBanners.length > 0 ? (
          <>
            {desktopBanners.map((banner, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  idx === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <picture>
                  {mobileBanners[idx] && (
                    <source
                      media="(max-width: 768px)"
                      srcSet={getOptimizedImage(mobileBanners[idx], 768)}
                    />
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getOptimizedImage(banner, 1920)}
                    alt={`${heroAlt} ${idx + 1}`}
                    className="w-full h-full max-w-full max-h-full object-cover object-center"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-violet-900/90 via-violet-800/40 to-transparent md:bg-gradient-to-r md:from-violet-900/80 md:via-violet-800/40 md:to-transparent" />
              </div>
            ))}

            {/* Slide controls — hidden on mobile, visible on desktop */}
            {desktopBanners.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentSlide(
                      (p) => (p - 1 + desktopBanners.length) % desktopBanners.length
                    )
                  }
                  className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full items-center justify-center transition-all"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={() =>
                    setCurrentSlide((p) => (p + 1) % desktopBanners.length)
                  }
                  className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full items-center justify-center transition-all"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {desktopBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentSlide
                          ? 'bg-amber-400 w-8 md:w-10'
                          : 'bg-white/50 w-1.5 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-violet-800 to-purple-700" />
        )}

        {/* Arc separator — mobile only */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[140%] h-20 bg-white rounded-t-[50%] z-10 md:hidden" />

        {/* Hero text */}
        <div className="relative z-20 max-w-7xl mx-auto w-full text-white">
          <div className="max-w-2xl">
            <p className="text-xs md:text-sm text-white/80 mb-2 md:mb-3 font-medium tracking-wide uppercase">
              {(blocks['hero_tagline']?.content?.text as string) || 'Welcome to your spiritual journey'}
            </p>
            <h1 className="text-3xl md:text-6xl font-serif font-bold leading-tight mb-4 md:mb-8 drop-shadow-lg whitespace-pre-line">
              {(blocks['hero_title']?.content?.text as string) || 'Align Your Energy,\nTransform Your Life'}
            </h1>
            <p className="hidden md:block text-white/80 text-lg mb-8 max-w-lg leading-relaxed">
              {(blocks['hero_description']?.content?.text as string) || 'Discover ancient wisdom through personalized astrology, energy healing, and sacred products curated to elevate your spiritual practice.'}
            </p>
            <div className="flex flex-row gap-3">
              <Link href={(blocks['hero_cta_primary']?.content?.link as string) || '/kundali'}>
                <Button className="bg-gradient-to-br from-amber-400 to-amber-600 text-violet-950 font-bold px-5 md:px-8 py-5 md:py-6 rounded-xl shadow-[0_4px_12px_rgba(251,191,36,0.35)] hover:scale-[1.03] transition-transform border-0 text-sm md:text-base">
                  <Sparkles className="h-4 w-4 mr-2" /> {(blocks['hero_cta_primary']?.content?.text as string) || 'Free Kundali'}
                </Button>
              </Link>
              <Link href={(blocks['hero_cta_secondary']?.content?.link as string) || '/services'}>
                <Button
                  variant="outline"
                  className="bg-white/15 text-white backdrop-blur-md border border-white/25 font-bold px-5 md:px-8 py-5 md:py-6 rounded-xl hover:bg-white/25 hover:text-white transition-all text-sm md:text-base"
                >
                  <Calendar className="h-4 w-4 mr-2" /> {(blocks['hero_cta_secondary']?.content?.text as string) || 'Book Session'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURED SERVICES
          Mobile: horizontal scroll compact cards
          Desktop: 4-col grid with larger cards, image + description
         ═══════════════════════════════════════════════════════════════ */}
      {featuredServices.length > 0 && (
        <section className="pt-6 md:pt-16 pb-8 md:pb-16 -mt-4 md:mt-0 relative z-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex justify-between items-end mb-4 md:mb-8">
              <div>
                <h2 className="text-lg md:text-3xl font-bold text-slate-900">
                  {(blocks['services_title']?.content?.text as string) || '✨ Our Services'}
                </h2>
                <p className="hidden md:block text-slate-500 mt-2 max-w-xl">
                  {(blocks['services_subtitle']?.content?.text as string) || 'Personalized guidance across career, relationships, health and spiritual growth — delivered by expert practitioners.'}
                </p>
              </div>
              <Link
                href={(blocks['services_cta']?.content?.link as string) || '/services'}
                className="text-sm md:text-base font-semibold text-violet-700 hover:text-violet-900 flex items-center gap-1"
              >
                {(blocks['services_cta']?.content?.text as string) || 'See All'} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mobile: horizontal scroll — redesigned */}
            <div className="flex md:hidden gap-3 overflow-x-auto pb-3 scrollbar-none -mx-4 px-4">
              {featuredServices.map((service) => (
                <div
                  key={service.id}
                  className="min-w-[260px] w-[260px] bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex-shrink-0 group"
                >
                  {/* Image */}
                  <div className="relative h-36 overflow-hidden">
                    {service.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={
                          service.color_code
                            ? { backgroundColor: service.color_code + '18' }
                            : { backgroundColor: '#f3f0ff' }
                        }
                      >
                        <Star className="h-10 w-10 text-violet-400" />
                      </div>
                    )}
                    {/* Duration badge */}
                    <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {service.duration_minutes}m
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3.5">
                    <h3 className="font-bold text-sm text-slate-900 mb-1 line-clamp-1 group-hover:text-violet-700 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                      {service.description || 'Personalized spiritual guidance for your journey.'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-medium">Starting at</span>
                        <span className="font-black text-base text-violet-800">₹{service.price}</span>
                      </div>
                      <Link href={`/services/${service.slug}`}>
                        <button className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md shadow-violet-600/20 active:scale-95 transition-all flex items-center gap-1">
                          Book Now <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: grid — redesigned */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredServices.map((service) => (
                <div
                  key={service.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    {service.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={
                          service.color_code
                            ? { backgroundColor: service.color_code + '15' }
                            : { backgroundColor: '#f3f0ff' }
                        }
                      >
                        <Star className="h-14 w-14 text-violet-400" />
                      </div>
                    )}
                    {/* Duration badge */}
                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration_minutes} mins
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-violet-900/0 group-hover:bg-violet-900/10 transition-colors duration-300" />
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 mb-1.5 group-hover:text-violet-700 transition-colors line-clamp-1">
                      {service.name}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed flex-1">
                      {service.description || 'Personalized spiritual guidance for your journey.'}
                    </p>

                    {/* Price + CTA row */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-400 font-medium">Starting at</span>
                        <span className="font-black text-xl text-violet-800">₹{service.price}</span>
                      </div>
                      <Link href={`/services/${service.slug}`}>
                        <button className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 active:scale-95 transition-all flex items-center gap-1.5">
                          Book Now <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          FEATURED PRODUCTS
          Mobile: 2-col compact grid with Add to Cart / Buy Now
          Desktop: 4-col grid with richer cards
         ═══════════════════════════════════════════════════════════════ */}
      {featuredProducts.length > 0 && (
        <section className="py-6 md:py-16 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex justify-between items-end mb-4 md:mb-8">
              <div>
                <h2 className="text-lg md:text-3xl font-bold text-slate-900">
                  {(blocks['products_title']?.content?.text as string) || '🔥 Sacred Products'}
                </h2>
                <p className="hidden md:block text-slate-500 mt-2 max-w-xl">
                  {(blocks['products_subtitle']?.content?.text as string) || 'Handpicked crystals, malas, and spiritual tools energized for your practice.'}
                </p>
              </div>
              <Link
                href={(blocks['products_cta']?.content?.link as string) || '/shop'}
                className="text-sm md:text-base font-semibold text-violet-700 hover:text-violet-900 flex items-center gap-1"
              >
                {(blocks['products_cta']?.content?.text as string) || 'View All'} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <HomeProductGrid products={featuredProducts} />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TRUST / WHY CHOOSE US
         ═══════════════════════════════════════════════════════════════ */}
      <section className="py-10 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              {(blocks['trust_title']?.content?.text as string) || 'Why Thousands Trust HighlyAligned'}
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              {(blocks['trust_subtitle']?.content?.text as string) || 'A blend of ancient Vedic wisdom and modern spiritual guidance, delivered with authenticity and care.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
            {[
              {
                icon: Gem,
                blockKey: 'trust_badge_1',
                title: (blocks['trust_badge_1']?.content?.title as string) || 'Authentic Practices',
                desc: (blocks['trust_badge_1']?.content?.description as string) || 'Rooted in traditional Vedic astrology and energy healing techniques passed down through generations.',
              },
              {
                icon: HeartHandshake,
                blockKey: 'trust_badge_2',
                title: (blocks['trust_badge_2']?.content?.title as string) || 'Personalized Guidance',
                desc: (blocks['trust_badge_2']?.content?.description as string) || 'Every reading and session is tailored to your unique birth chart, energy, and life circumstances.',
              },
              {
                icon: ShieldCheck,
                blockKey: 'trust_badge_3',
                title: (blocks['trust_badge_3']?.content?.title as string) || 'Trusted & Confidential',
                desc: (blocks['trust_badge_3']?.content?.description as string) || 'Your personal details and consultations are kept strictly private. Over 5,000+ satisfied clients.',
              },
            ].map((item) => {
              const image = blocks[item.blockKey]?.images?.[0]
              return (
                <div
                  key={item.title}
                  className="text-left sm:text-center p-5 md:p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex sm:block items-start gap-4"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 sm:mx-auto rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mb-0 sm:mb-5 shrink-0">
                    {image ? (
                      <img src={image} alt={item.title} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <item.icon className="h-7 w-7" />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS
          Mobile: horizontal scroll cards
          Desktop: 3-col grid with larger cards
         ═══════════════════════════════════════════════════════════════ */}
      <section className="py-8 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="mb-4 md:mb-8">
            <h2 className="text-lg md:text-3xl font-bold text-slate-900">
              {(blocks['testimonials_title']?.content?.text as string) || '💫 Client Stories'}
            </h2>
            <p className="hidden md:block text-slate-500 mt-2">
              {(blocks['testimonials_subtitle']?.content?.text as string) || 'Real experiences from our spiritual community.'}
            </p>
          </div>

          {/* Mobile: horizontal scroll */}
          <div className="flex md:hidden gap-3 overflow-x-auto pb-2 scrollbar-none">
            {getTestimonials(blocks).map((t, i) => (
              <TestimonialCard key={i} t={t} compact />
            ))}
          </div>

          {/* Desktop: grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {getTestimonials(blocks).map((t, i) => (
              <TestimonialCard key={i} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          DESKTOP CTA BANNER
         ═══════════════════════════════════════════════════════════════ */}
      <section className="hidden md:block py-20 bg-violet-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-serif font-bold text-white mb-6">
            {(blocks['cta_title']?.content?.text as string) || 'Begin Your Transformation Today'}
          </h2>
          <p className="text-violet-200 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            {(blocks['cta_subtitle']?.content?.text as string) || 'Whether you seek clarity through astrology, healing through energy work, or tools to deepen your practice — we are here to guide you.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={(blocks['cta_button_1']?.content?.link as string) || '/services'}>
              <Button className="bg-amber-400 hover:bg-amber-500 text-violet-950 font-bold px-8 py-6 rounded-xl text-base shadow-lg shadow-amber-500/20 border-0">
                <Calendar className="h-5 w-5 mr-2" /> {(blocks['cta_button_1']?.content?.text as string) || 'Book a Session'}
              </Button>
            </Link>
            <Link href={(blocks['cta_button_2']?.content?.link as string) || '/shop'}>
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white px-8 py-6 rounded-xl text-base font-semibold"
              >
                <ShoppingBag className="h-5 w-5 mr-2" /> {(blocks['cta_button_2']?.content?.text as string) || 'Explore Shop'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          EMPTY STATE
         ═══════════════════════════════════════════════════════════════ */}
      {featuredServices.length === 0 && featuredProducts.length === 0 && (
        <section className="py-16 -mt-4 relative z-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12">
              <div className="text-5xl mb-4">🔮</div>
              <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">
                Coming Soon
              </h2>
              <p className="text-slate-500 max-w-md mx-auto mb-8">
                Our spiritual products and services are being curated. Visit our
                services page to explore and book a session.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/services">
                  <Button className="bg-violet-700 hover:bg-violet-800 text-white px-8 py-5 rounded-xl">
                    <Calendar className="h-4 w-4 mr-2" /> Browse Services
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button
                    variant="outline"
                    className="px-8 py-5 rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" /> Visit Shop
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <LeadMagnetPopup />
    </div>
  )
}

/* ── Testimonials data ── */
function getTestimonials(blocks: Record<string, BlockData>) {
  const fromBlocks = []
  for (let i = 1; i <= 5; i++) {
    const b = blocks[`testimonial_${i}`]
    if (b?.content?.text) {
      fromBlocks.push({
        text: b.content.text as string,
        author: (b.content.author as string) || '',
        service: (b.content.service as string) || '',
        img: (b.content.img as string) || b.images?.[0] || '',
      })
    }
  }
  if (fromBlocks.length > 0) return fromBlocks
  return [
    {
      text: "Harshada's chakra healing completely shifted my energy. I felt lighter and more focused within days.",
      author: 'Meera Joshi',
      service: 'Chakra Healing',
      img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    },
    {
      text: 'The oracle card reading gave me clarity about my career. Her intuition is remarkable and accurate.',
      author: 'Rohit Verma',
      service: 'Oracle Reading',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    },
    {
      text: 'The manifestation coaching helped me align my desires. I manifested a new job within 2 months!',
      author: 'Priya Sharma',
      service: 'Manifestation Coaching',
      img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    },
  ]
}

/* ── Testimonial Card ── */
interface Testimonial {
  text: string
  author: string
  service: string
  img: string
}

function TestimonialCard({
  t,
  compact,
}: {
  t: Testimonial
  compact?: boolean
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm flex-shrink-0 ${
        compact ? 'min-w-[280px] w-[280px] p-5' : 'p-8'
      }`}
    >
      <div
        className={`text-amber-400 tracking-widest mb-2 ${
          compact ? 'text-sm' : 'text-base mb-3'
        }`}
      >
        ★★★★★
      </div>
      <p
        className={`text-slate-600 leading-relaxed mb-4 ${
          compact ? 'text-sm line-clamp-3' : 'text-base'
        }`}
      >
        &ldquo;{t.text}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.img}
          alt={t.author}
          className={`rounded-full object-cover ${
            compact ? 'w-10 h-10' : 'w-12 h-12'
          }`}
        />
        <div>
          <div
            className={`font-bold text-slate-900 ${
              compact ? 'text-sm' : 'text-base'
            }`}
          >
            {t.author}
          </div>
          <div className="text-xs text-slate-500">{t.service}</div>
        </div>
      </div>
    </div>
  )
}
