'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface PageBlock {
  id: string
  page_key: string
  block_key: string
  content: Record<string, unknown>
  images: string[]
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export function usePageBlocks(pageKey: string) {
  return useQuery({
    queryKey: ['page-blocks', pageKey],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('page_blocks')
        .select('*')
        .eq('page_key', pageKey)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as PageBlock[]
    },
    enabled: !!pageKey,
  })
}

export function useAllPageBlocks() {
  return useQuery({
    queryKey: ['page-blocks-all'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('page_blocks')
        .select('*')
        .order('page_key', { ascending: true })
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as PageBlock[]
    },
  })
}

export function useCreatePageBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('page_blocks')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as PageBlock
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-blocks'] })
      queryClient.invalidateQueries({ queryKey: ['page-blocks-all'] })
      toast.success('Block created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdatePageBlock() {
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
        .from('page_blocks')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-blocks'] })
      queryClient.invalidateQueries({ queryKey: ['page-blocks-all'] })
      toast.success('Block updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeletePageBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('page_blocks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-blocks'] })
      queryClient.invalidateQueries({ queryKey: ['page-blocks-all'] })
      toast.success('Block deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
