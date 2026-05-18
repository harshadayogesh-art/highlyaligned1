'use client'

import { useQuery } from '@tanstack/react-query'

export interface OrderStatusHistoryEntry {
  id: string
  order_id: string
  new_status: string
  old_status: string | null
  user_id: string | null
  changed_by_name: string | null
  notes: string | null
  created_at: string
}

export function useOrderStatusHistory(orderId: string | null) {
  return useQuery({
    queryKey: ['order-status-history', orderId],
    queryFn: async () => {
      if (!orderId) return []
      const res = await fetch(`/api/orders/${orderId}/status-history`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load status history')
      return (data.history || []) as OrderStatusHistoryEntry[]
    },
    enabled: !!orderId,
  })
}
