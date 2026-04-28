'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface Banner {
  id: string
  title: string
  image: string
  link: string | null
  position: string
  sort_order: number
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
}

export function useBanners(position?: string) {
  return useQuery({
    queryKey: ['banners', position],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (position) query = query.eq('position', position)

      const { data, error } = await query
      if (error) throw error
      return data as Banner[]
    },
  })
}

export function useAllBanners() {
  return useQuery({
    queryKey: ['banners-all'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as Banner[]
    },
  })
}

export function useCreateBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('banners')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Banner
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      queryClient.invalidateQueries({ queryKey: ['banners-all'] })
      toast.success('Banner created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Record<string, unknown>
    }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('banners')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      queryClient.invalidateQueries({ queryKey: ['banners-all'] })
      toast.success('Banner updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('banners').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      queryClient.invalidateQueries({ queryKey: ['banners-all'] })
      toast.success('Banner deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
