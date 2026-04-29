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
  buffer_time_minutes: number
  mode: string[]
  color_code: string | null
  is_active: boolean
  is_featured: boolean
  image_url: string | null
  category_id: string | null
  sort_order: number
  created_at: string
  // Availability config
  working_hours_start?: string | null
  working_hours_end?: string | null
  slot_interval_minutes?: number | null
  blocked_dates?: string[] | null
}

export function useServices(options: { activeOnly?: boolean } = {}) {
  return useQuery({
    queryKey: ['services', options.activeOnly],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase.from('services').select('*').order('sort_order', { ascending: true })
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
