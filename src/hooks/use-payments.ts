'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface PaymentRecord {
  id: string
  type: 'order' | 'booking'
  number: string
  customer_name: string
  customer_phone: string | null
  amount: number
  payment_mode: 'online' | 'cod'
  payment_status: 'pending' | 'captured' | 'failed' | 'refunded'
  cod_collected: boolean
  cod_collection_date: string | null
  razorpay_id: string | null
  created_at: string
  source: string
}

export function usePayments(tab: 'all' | 'cod' | 'online') {
  return useQuery({
    queryKey: ['payments', tab],
    queryFn: async () => {
      const supabase = createClient()
      const records: PaymentRecord[] = []

      // Fetch orders
      let orderQuery = supabase
        .from('orders')
        .select(
          'id, order_number, final_total, payment_mode, payment_status, cod_collected, cod_collection_date, razorpay_payment_id, created_at, status, profiles(name, phone)'
        )
        .order('created_at', { ascending: false })

      if (tab === 'cod') {
        orderQuery = orderQuery.eq('payment_mode', 'cod')
      } else if (tab === 'online') {
        orderQuery = orderQuery.eq('payment_mode', 'online')
      }

      const { data: orders, error: ordersError } = await orderQuery
      if (ordersError) throw ordersError

      orders?.forEach((o: any) => {
        records.push({
          id: o.id,
          type: 'order',
          number: o.order_number,
          customer_name: o.profiles?.name || '—',
          customer_phone: o.profiles?.phone || null,
          amount: o.final_total || 0,
          payment_mode: o.payment_mode,
          payment_status: o.payment_status,
          cod_collected: o.cod_collected || false,
          cod_collection_date: o.cod_collection_date,
          razorpay_id: o.razorpay_payment_id,
          created_at: o.created_at,
          source: o.status,
        })
      })

      // Fetch bookings (only online payments)
      if (tab !== 'cod') {
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select(
            'id, booking_number, amount, payment_status, razorpay_order_id, created_at, status, services(name), profiles(name, phone)'
          )
          .order('created_at', { ascending: false })

        if (bookingsError) throw bookingsError

        bookings?.forEach((b: any) => {
          records.push({
            id: b.id,
            type: 'booking',
            number: b.booking_number,
            customer_name: b.profiles?.name || '—',
            customer_phone: b.profiles?.phone || null,
            amount: b.amount || 0,
            payment_mode: 'online',
            payment_status: b.payment_status,
            cod_collected: false,
            cod_collection_date: null,
            razorpay_id: b.razorpay_order_id,
            created_at: b.created_at,
            source: b.services?.name || b.status,
          })
        })
      }

      // Sort by created_at descending
      records.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      return records
    },
  })
}

export function useMarkCodCollected() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      amount,
    }: {
      orderId: string
      amount: number
    }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extra: {
            cod_collected: true,
            cod_collection_date: new Date().toISOString(),
            payment_status: 'captured',
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark COD collected')
      }
      return { orderId, amount }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('COD payment marked as collected')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
