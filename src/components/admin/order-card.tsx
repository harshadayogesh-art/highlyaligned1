'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import type { OrderWithItems } from '@/hooks/use-orders'

interface OrderCardProps {
  order: OrderWithItems
  onClick: () => void
  onStatusChange: (status: string, extra?: Record<string, unknown>) => void
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  packed: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-sky-100 text-sky-800',
  out_for_delivery: 'bg-teal-100 text-teal-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-slate-100 text-slate-800',
}

const nextActions: Record<string, { label: string; next: string; variant?: string }[]> = {
  pending: [{ label: 'Accept', next: 'accepted', variant: 'default' }, { label: 'Cancel', next: 'cancelled', variant: 'destructive' }],
  accepted: [{ label: 'Process', next: 'processing' }],
  processing: [{ label: 'Pack', next: 'packed' }],
  packed: [{ label: 'Ship', next: 'shipped' }],
  shipped: [{ label: 'Deliver', next: 'delivered' }, { label: 'Out for Delivery', next: 'out_for_delivery' }],
  out_for_delivery: [{ label: 'Deliver', next: 'delivered' }],
}

export function OrderCard({ order, onClick, onStatusChange }: OrderCardProps) {
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true })
  const actions = nextActions[order.status] || []

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 cursor-pointer hover:shadow-sm transition-shadow" onClick={onClick}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">#{order.order_number}</span>
        <Badge className={`text-xs ${statusColors[order.status] || 'bg-slate-100'}`}>
          {order.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="text-xs text-slate-500">
        {order.profiles?.name || 'Guest'} • {timeAgo}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">₹{order.final_total}</span>
        <Badge variant="outline" className="text-xs">
          {order.payment_mode.toUpperCase()}
        </Badge>
      </div>

      {actions.length > 0 && (
        <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          {actions.map((action) => (
            <Button
              key={action.next}
              size="sm"
              variant={action.variant as 'default' | 'destructive' | 'outline' || 'default'}
              className="text-xs h-7"
              onClick={() => onStatusChange(action.next)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {order.status === 'delivered' && order.payment_mode === 'cod' && !order.cod_collected && (
        <Button
          size="sm"
          className="w-full text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
          onClick={(e) => {
            e.stopPropagation()
            onStatusChange('delivered', { cod_collected: true, cod_collection_date: new Date().toISOString() })
          }}
        >
          Mark COD Collected
        </Button>
      )}
    </div>
  )
}
