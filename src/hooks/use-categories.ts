'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Category {
  id: string
  name: string
  slug: string
  type: 'product' | 'service'
  parent_id: string | null
  image: string | null
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export function useCategories(type?: 'product' | 'service') {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (type) query = query.eq('type', type)

      const { data, error } = await query
      if (error) throw error
      return data as Category[]
    },
  })
}
