import Image from 'next/image'
import Link from 'next/link'

import { CheckCircle, Gem, Eye, Leaf } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { usePageBlockMap } from '@/components/store/page-block'

export const metadata = {
  title: 'About Harshada — HighlyAligned',
  description: 'Meet Harshada Yogesh — NLP Coach, Oracle Card Reader, and Chakra Healer with 10+ years of experience.',
}

async function getAboutBlocks() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('page_blocks')
    .select('*')
    .eq('page_key', 'about')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  const map: Record<string, { content: Record<string, unknown>; images: string[] }> = {}
  data?.forEach((b) => { map[b.block_key] = { content: b.content, images: b.images || [] } })
  return map
}

export default async function AboutPage() {
  const blocks = await getAboutBlocks()
  const supabase = await createClient()
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'about')
    .eq('is_active', true)
    .single()

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] to-[#1e293b]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              {(blocks['hero_title']?.content?.text as string) || 'About'} <span className="text-[#f59e0b]">{(blocks['hero_highlight']?.content?.text as string) || 'Harshada'}</span>
            </h1>
            <div className="w-24 h-1 bg-[#f59e0b] mx-auto rounded-full" />
          </div>
        </div>
      </section>

      {/* Bio Section */}
      <section className="px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden bg-slate-100">
            <Image
              src={(blocks['bio_image']?.images?.[0] as string) || '/placeholder.svg'}
              alt="Harshada Yogesh"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">{(blocks['bio_name']?.content?.text as string) || 'Harshada Yogesh'}</h2>
            <p className="text-[#f59e0b] font-medium">
              {(blocks['bio_role']?.content?.text as string) || 'NLP Coach | Oracle Card Reader | Chakra Healer'}
            </p>
            <div className="text-slate-600 leading-relaxed space-y-3">
              <p>{(blocks['bio_paragraph_1']?.content?.text as string) || 'With over a decade of experience in Vedic astrology, energy healing, and spiritual counseling, Harshada has guided more than 5,000 seekers toward clarity, peace, and purpose.'}</p>
              <p>{(blocks['bio_paragraph_2']?.content?.text as string) || "Her unique approach blends ancient Vedic wisdom with modern NLP techniques, making spiritual guidance accessible, practical, and deeply transformative for today's seekers."}</p>
              <p>{(blocks['bio_paragraph_3']?.content?.text as string) || "Whether you are navigating career crossroads, relationship challenges, health concerns, or simply seeking deeper self-understanding, Harshada's compassionate readings provide actionable insights rooted in your unique birth chart."}</p>
            </div>
            <div className="space-y-2 pt-2">
              {[
                (blocks['cert_1']?.content?.text as string) || 'Certified NLP Practitioner',
                (blocks['cert_2']?.content?.text as string) || '10+ Years Astrology Experience',
                (blocks['cert_3']?.content?.text as string) || '5000+ Consultations Delivered',
                (blocks['cert_4']?.content?.text as string) || 'Energy Healing Expert',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 max-w-3xl mx-auto">
        <div className="border-l-4 border-[#f59e0b] bg-amber-50 rounded-r-xl p-6 md:p-8">
          <p className="text-lg text-slate-800 italic leading-relaxed">
            &ldquo;{(blocks['mission_quote']?.content?.text as string) || "My mission is to make ancient spiritual wisdom accessible to every modern seeker. You don't need to be a scholar to benefit from Vedic astrology — you just need an open heart and the right guide."}&rdquo;
          </p>
          <p className="text-sm text-slate-500 mt-3 font-medium">{(blocks['mission_author']?.content?.text as string) || '— Harshada Yogesh'}</p>
        </div>
      </section>

      {/* Services Overview */}
      <section className="px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">{(blocks['services_title']?.content?.text as string) || 'Our Services'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services?.map((svc) => (
            <Link key={svc.id} href="/services" className="group block">
              <div className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-md transition-all h-full">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold mb-3"
                  style={{ backgroundColor: svc.color_code }}
                >
                  {svc.name.charAt(0)}
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-[#f59e0b] transition-colors">
                  {svc.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{svc.duration_minutes} min</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="px-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <Gem className="h-8 w-8 text-[#f59e0b] mx-auto mb-2" />
            <h3 className="font-semibold text-slate-900">{(blocks['trust_1_title']?.content?.text as string) || 'Authentic Products'}</h3>
            <p className="text-sm text-slate-500 mt-1">{(blocks['trust_1_desc']?.content?.text as string) || 'Handpicked and energetically cleansed'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <Eye className="h-8 w-8 text-[#f59e0b] mx-auto mb-2" />
            <h3 className="font-semibold text-slate-900">{(blocks['trust_2_title']?.content?.text as string) || 'Personalized Guidance'}</h3>
            <p className="text-sm text-slate-500 mt-1">{(blocks['trust_2_desc']?.content?.text as string) || 'Every reading is unique to you'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <Leaf className="h-8 w-8 text-[#f59e0b] mx-auto mb-2" />
            <h3 className="font-semibold text-slate-900">{(blocks['trust_3_title']?.content?.text as string) || 'Secure Payments'}</h3>
            <p className="text-sm text-slate-500 mt-1">{(blocks['trust_3_desc']?.content?.text as string) || 'Protected by Razorpay encryption'}</p>
          </div>
        </div>
      </section>

      {/* Custom CMS Content */}
      {page?.content && (
        <section className="px-4 max-w-3xl mx-auto">
          <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-700 leading-relaxed">
            {page.content}
          </div>
        </section>
      )}
    </div>
  )
}
