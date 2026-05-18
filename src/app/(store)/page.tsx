import { createClient } from '@/lib/supabase/server'
import HomePage from './home-page'
import type { ProductWithCategory } from '@/hooks/use-products'
import type { ServiceRow } from '@/hooks/use-services'
import type { BlockData } from '@/components/store/page-block'

export default async function Page() {
  const supabase = await createClient()

  try {
    const [
      { data: settingsRows },
      { data: productsData },
      { data: servicesData },
      { data: blocksData },
    ] = await Promise.all([
      supabase.from('settings').select('*'),
      supabase
        .from('products')
        .select('*, categories(name, type)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('page_blocks')
        .select('*')
        .eq('page_key', 'home')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ])

    const settings: Record<string, unknown> = {}
    settingsRows?.forEach((row: any) => {
      settings[row.key] = row.value
    })

    const normalizedProducts = (productsData || []).map((item: any) => ({
      ...item,
      categories: Array.isArray(item.categories)
        ? item.categories[0]
        : item.categories,
    })) as ProductWithCategory[]

    const featuredProducts = normalizedProducts.filter(
      (item) =>
        item.categories?.type === 'product' && item.metadata?.is_featured
    )

    const featuredServices = (servicesData || []).filter(
      (s: any) => s.is_featured
    ) as ServiceRow[]

    const blocks: Record<string, BlockData> = {}
    blocksData?.forEach((b: any) => {
      blocks[b.block_key] = { content: b.content, images: b.images || [] }
    })

    return (
      <HomePage
        settings={settings}
        featuredProducts={featuredProducts}
        featuredServices={featuredServices}
        blocks={blocks}
      />
    )
  } catch (error) {
    console.error('Failed to fetch home page data:', error)
    return (
      <HomePage
        settings={{}}
        featuredProducts={[]}
        featuredServices={[]}
        blocks={{}}
      />
    )
  }
}
