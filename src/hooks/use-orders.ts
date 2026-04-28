'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { triggerOrderNotification } from '@/app/actions/notifications'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  quantity: number
  price: number
  total: number
  gst_rate: number
  gst_amount: number
  products: { name: string; images: string[] } | null
}

export interface OrderWithItems {
  id: string
  order_number: string
  customer_id: string | null
  status: string
  subtotal: number
  gst_amount: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  place_of_supply: string | null
  discount_amount: number
  shipping_amount: number
  final_total: number
  payment_mode: string
  payment_status: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  shipping_address: Record<string, unknown>
  courier_name: string | null
  tracking_id: string | null
  shipping_label_url: string | null
  cod_collected: boolean
  cod_collection_date: string | null
  coupon_code: string | null
  gst_enabled_at_checkout: boolean
  admin_notes: string | null
  created_at: string
  updated_at: string
  profiles: { name: string; email: string; phone: string | null } | null
  order_items: OrderItem[]
}

interface UseOrdersOptions {
  status?: string
  search?: string
  customerId?: string
  page?: number
  limit?: number
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { status, search, customerId, page = 1, limit = 50 } = options

  return useQuery({
    queryKey: ['orders', status, search, customerId, page, limit],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('orders')
        .select(
          '*, profiles(name, email, phone), order_items(*, products(name, images))',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })

      if (status) query = query.eq('status', status)
      if (customerId) query = query.eq('customer_id', customerId)
      if (search) {
        query = query.ilike('order_number', `%${search}%`)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error
      return { data: data as OrderWithItems[], count: count ?? 0 }
    },
  })
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch order' }))
        throw new Error(err.error || 'Failed to fetch order')
      }
      const data = await res.json()
      return data as OrderWithItems
    },
    enabled: !!orderId,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      extra,
    }: {
      orderId: string
      status: string
      extra?: Record<string, unknown>
    }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, extra }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order')
      }
      return { orderId, status }
    },
    onSuccess: ({ orderId, status }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      toast.success(`Order marked as ${status}`)

      if (['accepted', 'shipped', 'delivered'].includes(status)) {
        triggerOrderNotification(orderId, status as any).catch(console.error)
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update order')
    },
  })
}

export function useUpdateAdminNotes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      notes,
    }: {
      orderId: string
      notes: string
    }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: undefined, extra: { admin_notes: notes } }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save notes')
      }
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      toast.success('Notes saved')
    },
  })
}
