'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface Coupon {
  id: string
  code: string
  type: string
  value: number
  min_order_amount: number
  max_uses: number | null
  usage_count: number
  per_customer_limit: number
  valid_from: string | null
  valid_to: string | null
  applicable_to: string[]
  is_active: boolean
  created_at: string
}

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Coupon[]
    },
  })
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async ({
      code,
      subtotal,
    }: {
      code: string
      subtotal: number
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !data) throw new Error('Invalid coupon code')

      const coupon = data as Coupon
      const now = new Date()
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        throw new Error('Coupon not yet valid')
      }
      if (coupon.valid_to && new Date(coupon.valid_to) < now) {
        throw new Error('Coupon expired')
      }
      if (coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses) {
        throw new Error('Coupon usage limit reached')
      }
      if (subtotal < coupon.min_order_amount) {
        throw new Error(`Minimum order ₹${coupon.min_order_amount} required`)
      }

      return coupon
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useCreateCoupon() {
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
      return data as Coupon
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      toast.success('Coupon created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateCoupon() {
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
        .from('coupons')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      toast.success('Coupon updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('coupons').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      toast.success('Coupon deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
