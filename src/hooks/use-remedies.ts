'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface Remedy {
  id: string
  customer_id: string
  booking_id: string | null
  title: string
  description: string | null
  duration_days: number | null
  frequency: string | null
  instructions: string | null
  attachment_url: string | null
  status: string
  created_by: string | null
  created_at: string
}

export interface RemedyLog {
  id: string
  remedy_id: string
  customer_id: string
  log_date: string
  status: string
  note: string | null
  created_at: string
}

interface UseRemediesOptions {
  customerId?: string
  status?: string
}

export function useRemedies(options: UseRemediesOptions = {}) {
  const { customerId, status } = options

  return useQuery({
    queryKey: ['remedies', customerId, status],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('remedies')
        .select('*')
        .order('created_at', { ascending: false })

      if (customerId) query = query.eq('customer_id', customerId)
      if (status) query = query.eq('status', status)

      const { data, error } = await query
      if (error) throw error
      return data as Remedy[]
    },
  })
}

export function useRemedyLogs(remedyId: string) {
  return useQuery({
    queryKey: ['remedy-logs', remedyId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('remedy_logs')
        .select('*')
        .eq('remedy_id', remedyId)
        .order('log_date', { ascending: true })
      if (error) throw error
      return data as RemedyLog[]
    },
    enabled: !!remedyId,
  })
}

export function useCreateRemedy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('remedies')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Remedy
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remedies'] })
      toast.success('Remedy created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useCreateRemedyLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('remedy_logs')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as RemedyLog
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remedy-logs'] })
      queryClient.invalidateQueries({ queryKey: ['remedies'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateRemedy() {
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
        .from('remedies')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remedies'] })
      toast.success('Remedy updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
