'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface Lead {
  id: string
  name: string
  mobile: string
  email: string | null
  dob: string | null
  birth_time: string | null
  birth_location: string | null
  area_of_life_id: string | null
  customer_question: string | null
  ai_answer: string | null
  ai_prompt_used: string | null
  source: string
  status: string
  converted_to_customer_id: string | null
  report_data_json: Record<string, unknown> | null
  created_at: string
  lead_magnet_areas?: { name: string; icon: string } | null
}

interface UseLeadsOptions {
  status?: string
  source?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export function useLeads(options: UseLeadsOptions = {}) {
  const { status, source, search, dateFrom, dateTo } = options

  return useQuery({
    queryKey: ['leads', status, source, search, dateFrom, dateTo],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (status) query = query.eq('status', status)
      if (source) query = query.eq('source', source)
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)
      if (search) {
        query = query.or(`name.ilike.%${search}%,mobile.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) {
        console.error('useLeads error:', error)
        throw error
      }
      return data as Lead[]
    },
    meta: {
      errorMessage: 'Failed to load leads. Please check your connection.',
    },
  })
}

export function useLead(leadId: string) {
  return useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('leads')
        .select('*, lead_magnet_areas(name, icon)')
        .eq('id', leadId)
        .single()
      if (error) throw error
      return data as Lead
    },
    enabled: !!leadId,
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('leads')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Lead
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      leadId,
      updates,
    }: {
      leadId: string
      updates: Record<string, unknown>
    }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)
      if (error) throw error
    },
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
      toast.success('Lead updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
