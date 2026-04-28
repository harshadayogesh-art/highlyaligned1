'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface Referral {
  id: string
  referrer_id: string
  referee_id: string | null
  code_used: string
  order_id: string | null
  booking_id: string | null
  commission_amount: number
  status: string
  created_at: string
  referrer?: { name: string; email: string } | null
  referee?: { name: string; email: string } | null
}

export function useReferrals() {
  return useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('referrals')
        .select('*, referrer:referrer_id(name, email), referee:referee_id(name, email)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Referral[]
    },
  })
}

export function useMyReferrals(referrerId?: string) {
  return useQuery({
    queryKey: ['my-referrals', referrerId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', referrerId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Referral[]
    },
    enabled: !!referrerId,
  })
}

export function useCreateReferral() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('referrals')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Referral
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] })
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateReferral() {
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
        .from('referrals')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] })
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] })
      toast.success('Referral updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
