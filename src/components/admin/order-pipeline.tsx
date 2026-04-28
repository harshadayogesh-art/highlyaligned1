'use client'

import { OrderCard } from './order-card'
import { useOrders, useUpdateOrderStatus, type OrderWithItems } from '@/hooks/use-orders'
import { Button } from '@/components/ui/button'

const columns = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'processing', label: 'Processing' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

interface OrderPipelineProps {
  onSelectOrder: (id: string) => void
  onRequestShip: (orderId: string) => void
}

export function OrderPipeline({ onSelectOrder, onRequestShip }: OrderPipelineProps) {
  const { data } = useOrders({})
  const updateStatus = useUpdateOrderStatus()

  const ordersByStatus = columns.reduce<Record<string, OrderWithItems[]>>((acc, col) => {
    acc[col.key] = data?.data?.filter((o) => o.status === col.key) || []
    return acc
  }, {})

  const handleStatusChange = (orderId: string, status: string, extra?: Record<string, unknown>) => {
    if (status === 'shipped') {
      onRequestShip(orderId)
      return
    }
    updateStatus.mutate({ orderId, status, extra })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {columns.map((col) => (
        <div key={col.key} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {ordersByStatus[col.key]?.length || 0}
            </span>
          </div>
          <div className="space-y-3 min-h-[100px]">
            {ordersByStatus[col.key]?.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => onSelectOrder(order.id)}
                onStatusChange={(status, extra) =>
                  handleStatusChange(order.id, status, extra)
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
