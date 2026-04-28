import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image')
    .eq('slug', params.slug)
    .single()

  if (!post) return {}

  const image = post.cover_image

  return {
    title: `${post.title} | HighlyAligned Blog`,
    description: post.excerpt || '',
    openGraph: {
      title: `${post.title} | HighlyAligned Blog`,
      description: post.excerpt || '',
      images: image ? [image] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | HighlyAligned Blog`,
      description: post.excerpt || '',
      images: image ? [image] : [],
    },
  }
}

export default async function BlogLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const p = await params;
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image, created_at')
    .eq('slug', p.slug)
    .single()

  const jsonLd = post ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "image": post.cover_image ? [post.cover_image] : [],
    "datePublished": post.created_at,
    "author": {
      "@type": "Person",
      "name": "Harshada"
    }
  } : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
