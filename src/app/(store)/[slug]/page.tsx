import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: page } = await supabase.from('pages').select('*').eq('slug', slug).eq('is_active', true).single()

  if (!page) return { title: 'Page Not Found' }

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || '',
  }
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: page } = await supabase.from('pages').select('*').eq('slug', slug).eq('is_active', true).single()

  if (!page) notFound()

  return (
    <div className='px-4 py-8 max-w-3xl mx-auto'>
      <h1 className='text-3xl font-bold text-slate-900 mb-6'>{page.title}</h1>
      <div className='prose prose-slate max-w-none whitespace-pre-line text-slate-700 leading-relaxed'>
        {page.content}
      </div>
    </div>
  )
}
