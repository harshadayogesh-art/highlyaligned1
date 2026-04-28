'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useOrders } from '@/hooks/use-orders'
import { useCancelOrder } from '@/hooks/use-cancel-order'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ShoppingBag,
  Search,
  ArrowRight,
  Loader2,
  X,
  Truck,
  RotateCcw,
} from 'lucide-react'

const statusFilters = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  packed: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-sky-100 text-sky-800',
  out_for_delivery: 'bg-teal-100 text-teal-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function MyOrdersPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const cancelOrder = useCancelOrder()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/account/orders')
    }
  }, [user, isLoading, router])

  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    customerId: user?.id,
    status: filter === 'all' ? undefined : filter,
  })

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const orders = (ordersData?.data || []).filter((order) => {
    if (!search.trim()) return true
    return order.order_number.toLowerCase().includes(search.trim().toLowerCase())
  })

  const canCancel = (status: string) => ['pending', 'accepted'].includes(status)
  const canTrack = (status: string) =>
    ['shipped', 'out_for_delivery', 'delivered'].includes(status)

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-bold text-slate-900">My Orders</h1>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {statusFilters.map((s) => (
            <Button
              key={s.key}
              size="sm"
              variant={filter === s.key ? 'default' : 'outline'}
              onClick={() => setFilter(s.key)}
              className={
                filter === s.key
                  ? 'bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 whitespace-nowrap'
                  : 'whitespace-nowrap'
              }
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {ordersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-100 rounded-xl">
          <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">
            {search ? 'No orders match your search' : 'No orders yet'}
          </p>
          {!search && (
            <Link href="/shop">
              <Button className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900">
                Start Shopping
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-100 rounded-xl p-3 md:p-4 space-y-2 md:space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">#{order.order_number}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Badge className={`text-xs shrink-0 ${statusColors[order.status] || 'bg-slate-100'}`}>
                  {order.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              {/* Items summary */}
              <div className="flex items-center justify-between text-sm">
                <p className="text-slate-600">
                  {order.order_items?.reduce((s, i) => s + i.quantity, 0)} items
                </p>
                <p className="font-bold text-slate-900">₹{order.final_total}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href={`/account/orders/${order.id}`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    View Details <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>

                {canTrack(order.status) && order.tracking_id && (
                  <a
                    href={order.shipping_label_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="text-xs">
                      <Truck className="h-3 w-3 mr-1" /> Track
                    </Button>
                  </a>
                )}

                {canCancel(order.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setCancelId(order.id)}
                  >
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                )}

                {order.status === 'delivered' && (
                  <Button size="sm" variant="outline" className="text-xs">
                    <RotateCcw className="h-3 w-3 mr-1" /> Reorder
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Are you sure you want to cancel this order? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (cancelId) cancelOrder.mutate(cancelId)
                setCancelId(null)
              }}
              disabled={cancelOrder.isPending}
            >
              {cancelOrder.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Yes, Cancel'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
