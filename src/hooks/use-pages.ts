'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface CmsPage {
  id: string
  slug: string
  title: string
  content: string | null
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function usePages() {
  return useQuery({
    queryKey: ['pages'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('is_active', true)
        .order('title', { ascending: true })
      if (error) throw error
      return data as CmsPage[]
    },
  })
}

export function useAllPages() {
  return useQuery({
    queryKey: ['pages-all'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('title', { ascending: true })
      if (error) throw error
      return data as CmsPage[]
    },
  })
}

export function usePage(slug: string) {
  return useQuery({
    queryKey: ['page', slug],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .single()
      if (error) throw error
      return data as CmsPage
    },
    enabled: !!slug,
  })
}

export function useCreatePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pages')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as CmsPage
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      queryClient.invalidateQueries({ queryKey: ['pages-all'] })
      toast.success('Page created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdatePage() {
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
        .from('pages')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      queryClient.invalidateQueries({ queryKey: ['pages-all'] })
      queryClient.invalidateQueries({ queryKey: ['page'] })
      toast.success('Page updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeletePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('pages').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      queryClient.invalidateQueries({ queryKey: ['pages-all'] })
      toast.success('Page deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
