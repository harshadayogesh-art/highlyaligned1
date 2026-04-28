'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface Influencer {
  id: string
  name: string
  email: string | null
  phone: string | null
  commission_rate: number
  bio: string | null
  avatar_url: string | null
  status: 'active' | 'inactive'
  total_sales: number
  total_commission_earned: number
  total_commission_paid: number
  created_at: string
}

export interface InfluencerCommission {
  id: string
  influencer_id: string
  order_id: string | null
  sale_amount: number
  commission_rate: number
  commission_amount: number
  status: 'pending' | 'approved' | 'paid'
  paid_at: string | null
  notes: string | null
  created_at: string
  order?: {
    order_number: string
    final_total: number
    status: string
    created_at: string
    shipping_address: Record<string, unknown>
  } | null
}

export interface InfluencerCoupon {
  id: string
  code: string
  type: string
  value: number
  min_order_amount: number
  max_uses: number | null
  usage_count: number
  is_active: boolean
  valid_from: string | null
  valid_to: string | null
  influencer_id: string | null
  created_at: string
}

export function useInfluencers() {
  return useQuery({
    queryKey: ['influencers'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Influencer[]
    },
  })
}

export function useInfluencer(id?: string) {
  return useQuery({
    queryKey: ['influencer', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Influencer
    },
    enabled: !!id,
  })
}

export function useInfluencerSales(influencerId?: string) {
  return useQuery({
    queryKey: ['influencer-sales', influencerId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('influencer_commissions')
        .select('*, order:order_id(order_number, final_total, status, created_at, shipping_address)')
        .eq('influencer_id', influencerId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as InfluencerCommission[]
    },
    enabled: !!influencerId,
  })
}

export function useInfluencerCoupons(influencerId?: string) {
  return useQuery({
    queryKey: ['influencer-coupons', influencerId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('influencer_id', influencerId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as InfluencerCoupon[]
    },
    enabled: !!influencerId,
  })
}

export function useCreateInfluencer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('influencers')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Influencer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] })
      toast.success('Influencer created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateInfluencer() {
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
      const { data, error } = await supabase
        .from('influencers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Influencer
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] })
      queryClient.invalidateQueries({ queryKey: ['influencer', variables.id] })
      toast.success('Influencer updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteInfluencer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('influencers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] })
      toast.success('Influencer deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useCreateInfluencerCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('coupons')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as InfluencerCoupon
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      queryClient.invalidateQueries({ queryKey: ['influencer-coupons'] })
      toast.success('Coupon created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function usePayCommission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      commissionIds,
      influencerId,
    }: {
      commissionIds: string[]
      influencerId: string
    }) => {
      const supabase = createClient()

      // Get total commission amount being paid
      const { data: commissions } = await supabase
        .from('influencer_commissions')
        .select('commission_amount')
        .in('id', commissionIds)
        .eq('status', 'pending')

      const totalPay = (commissions || []).reduce((s, c) => s + (c.commission_amount || 0), 0)

      // Mark commissions as paid
      const { error } = await supabase
        .from('influencer_commissions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .in('id', commissionIds)

      if (error) throw error

      // Update influencer totals
      const { data: influencer } = await supabase
        .from('influencers')
        .select('total_commission_paid')
        .eq('id', influencerId)
        .single()

      const newPaid = (influencer?.total_commission_paid || 0) + totalPay
      const { error: updError } = await supabase
        .from('influencers')
        .update({ total_commission_paid: newPaid })
        .eq('id', influencerId)

      if (updError) console.error('Influencer total update error:', updError)

      return { totalPay }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['influencer-sales', variables.influencerId] })
      queryClient.invalidateQueries({ queryKey: ['influencer', variables.influencerId] })
      queryClient.invalidateQueries({ queryKey: ['influencers'] })
      toast.success('Commission marked as paid')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
