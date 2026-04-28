import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export async function generateStaticParams() {
  return [
    { slug: 'terms' },
    { slug: 'privacy' },
    { slug: 'shipping' },
    { slug: 'refund' },
  ]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const titles: Record<string, string> = {
    terms: 'Terms & Conditions',
    privacy: 'Privacy Policy',
    shipping: 'Shipping & Delivery Policy',
    refund: 'Cancellation & Refund Policy',
  }
  return {
    title: `${titles[slug] || 'Legal'} — HighlyAligned`,
  }
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: page } = await supabase
    .from('legal_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!page) return notFound()

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-[#f59e0b] mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
      </Link>
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{page.title}</h1>
        <p className="text-sm text-slate-400 mt-1">Last updated: {new Date(page.last_updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-700 leading-relaxed">
        {page.content}
      </div>
    </div>
  )
}
