'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface ProductWithCategory {
  id: string
  name: string
  slug: string
  description: string | null
  how_to_use: string | null
  energization_process: string | null
  price: number
  mrp: number
  stock: number
  sku: string | null
  category_id: string | null
  images: string[]
  gst_applicable: boolean
  gst_rate: number
  weight_grams: number | null
  status: 'draft' | 'published' | 'out_of_stock' | 'hidden'
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  categories: { name: string; type?: string } | null
}

interface UseProductsOptions {
  category?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}

export function useProducts(options: UseProductsOptions = {}) {
  const { category, status, search, page = 1, limit = 20 } = options

  return useQuery({
    queryKey: ['products', category, status, search, page, limit],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('products')
        .select('*, categories(name, type)', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (category) query = query.eq('category_id', category)
      if (status) query = query.eq('status', status)
      if (search) query = query.ilike('name', `%${search}%`)

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error
      return { data: data as ProductWithCategory[], count: count ?? 0 }
    },
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('slug', slug)
        .single()
      if (error) throw error
      return data as ProductWithCategory
    },
    enabled: !!slug,
  })
}
