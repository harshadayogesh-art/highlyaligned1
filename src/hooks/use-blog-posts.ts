'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  featured_image: string | null
  category: string | null
  tags: string[]
  author: string
  status: string
  published_at: string | null
  views: number
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
}

interface UseBlogPostsOptions {
  category?: string
  status?: string
  search?: string
}

export function useBlogPosts(options: UseBlogPostsOptions = {}) {
  const { category, status, search } = options

  return useQuery({
    queryKey: ['blog-posts', category, status, search],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (category) query = query.eq('category', category)
      if (status) query = query.eq('status', status)
      if (search) query = query.ilike('title', `%${search}%`)

      const { data, error } = await query
      if (error) throw error
      return data as BlogPost[]
    },
  })
}

export function usePublishedBlogPosts(category?: string) {
  return useQuery({
    queryKey: ['blog-posts-published', category],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (category) query = query.eq('category', category)

      const { data, error } = await query
      if (error) throw error
      return data as BlogPost[]
    },
  })
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single()
      if (error) throw error
      return data as BlogPost
    },
    enabled: !!slug,
  })
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as BlogPost
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      toast.success('Blog post created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateBlogPost() {
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
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blog-post'] })
      toast.success('Blog post updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('blog_posts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      toast.success('Blog post deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
