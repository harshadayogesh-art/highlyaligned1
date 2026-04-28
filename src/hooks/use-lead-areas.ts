'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface LeadArea {
  id: string
  name: string
  icon: string
  slug: string
  sort_order: number
  is_active: boolean
  ai_prompt: string
  created_at: string
}

export function useLeadAreas() {
  return useQuery({
    queryKey: ['lead-areas'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lead_magnet_areas')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as LeadArea[]
    },
  })
}

export function useAllLeadAreas() {
  return useQuery({
    queryKey: ['lead-areas-all'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lead_magnet_areas')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as LeadArea[]
    },
  })
}

export function useCreateLeadArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lead_magnet_areas')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as LeadArea
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-areas'] })
      queryClient.invalidateQueries({ queryKey: ['lead-areas-all'] })
      toast.success('Area created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateLeadArea() {
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
        .from('lead_magnet_areas')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-areas'] })
      queryClient.invalidateQueries({ queryKey: ['lead-areas-all'] })
      toast.success('Area updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteLeadArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('lead_magnet_areas')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-areas'] })
      queryClient.invalidateQueries({ queryKey: ['lead-areas-all'] })
      toast.success('Area deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
