'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface ServiceRow {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  duration_minutes: number
  color_code: string | null
  is_active: boolean
  is_featured: boolean
  image_url: string | null
  created_at: string
}

export function useServices(options: { activeOnly?: boolean } = {}) {
  return useQuery({
    queryKey: ['services', options.activeOnly],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase.from('services').select('*').order('created_at', { ascending: false })
      if (options.activeOnly) {
        query = query.eq('is_active', true)
      }
      const { data, error } = await query
      if (error) throw error
      return data as ServiceRow[]
    },
  })
}

export function useService(slug: string) {
  return useQuery({
    queryKey: ['service', slug],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('services').select('*').eq('slug', slug).single()
      if (error) throw error
      return data as ServiceRow
    },
    enabled: !!slug,
  })
}
