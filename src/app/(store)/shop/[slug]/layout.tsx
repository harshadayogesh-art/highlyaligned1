import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description, images')
    .eq('slug', params.slug)
    .single()

  if (!product) return {}

  const plainDesc = product.description.replace(/<[^>]+>/g, '').substring(0, 160)
  const image = product.images?.[0]

  return {
    title: `${product.name} | HighlyAligned`,
    description: plainDesc,
    openGraph: {
      title: `${product.name} | HighlyAligned`,
      description: plainDesc,
      images: image ? [image] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | HighlyAligned`,
      description: plainDesc,
      images: image ? [image] : [],
    },
  }
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const p = await params;
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description, images, price, stock, mrp')
    .eq('slug', p.slug)
    .single()

  const jsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images,
    "description": product.description.replace(/<[^>]+>/g, ''),
    "offers": {
      "@type": "Offer",
      "url": `https://highlyaligned.in/shop/${p.slug}`,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
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
