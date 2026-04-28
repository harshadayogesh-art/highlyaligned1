import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://highlyaligned.in'

  const staticPages = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/booking`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/kundali`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
  ]

  const { data: products } = await supabase.from('products').select('slug, updated_at').eq('status', 'published')
  const productUrls = products?.map((p) => ({
    url: `${baseUrl}/shop/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || []

  const { data: posts } = await supabase.from('blog_posts').select('slug, updated_at').eq('status', 'published')
  const blogUrls = posts?.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  })) || []

  const { data: legal } = await supabase.from('pages').select('slug, updated_at').eq('status', 'published')
  const legalUrls = legal?.map((p) => ({
    url: `${baseUrl}/legal/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.3,
  })) || []

  return [...staticPages, ...productUrls, ...blogUrls, ...legalUrls]
}
