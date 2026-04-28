'use client'

import { useState } from 'react'
import { useOrders, useUpdateOrderStatus } from '@/hooks/use-orders'
import { OrderPipeline } from '@/components/admin/order-pipeline'
import { OrderDetailDrawer } from '@/components/admin/order-detail-drawer'
import { CourierModal } from '@/components/admin/courier-modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [shipOrderId, setShipOrderId] = useState<string | null>(null)

  const { data } = useOrders({ status: statusFilter || undefined, search })
  const updateStatus = useUpdateOrderStatus()

  const openDetail = (id: string) => {
    setDetailOrderId(id)
    setDetailOpen(true)
  }

  const handleShip = (shipData: {
    courier_name: string
    tracking_id: string
    shipping_label_url: string
  }) => {
    if (!shipOrderId) return
    updateStatus.mutate({
      orderId: shipOrderId,
      status: 'shipped',
      extra: {
        courier_name: shipData.courier_name,
        tracking_id: shipData.tracking_id,
        shipping_label_url: shipData.shipping_label_url,
      },
    })
    setShipOrderId(null)
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
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === 'kanban' ? 'default' : 'outline'}
            onClick={() => setView('kanban')}
          >
            Kanban
          </Button>
          <Button
            size="sm"
            variant={view === 'table' ? 'default' : 'outline'}
            onClick={() => setView('table')}
          >
            Table
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="packed">Packed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {view === 'kanban' ? (
        <OrderPipeline
          onSelectOrder={openDetail}
          onRequestShip={setShipOrderId}
        />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Order #</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Date</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Customer</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Total</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Payment</th>
                <th className="px-3 py-2 text-right font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((order) => (
                <tr
                  key={order.id}
                  className="border-t hover:bg-slate-50 cursor-pointer"
                  onClick={() => openDetail(order.id)}
                >
                  <td className="px-3 py-2 font-medium">#{order.order_number}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">{order.profiles?.name || 'Guest'}</td>
                  <td className="px-3 py-2 font-semibold">₹{order.final_total}</td>
                  <td className="px-3 py-2">
                    <Badge className={`text-xs ${statusColors[order.status] || 'bg-slate-100'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-xs">
                      {order.payment_mode.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {order.status === 'pending' && (
                      <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatus.mutate({
                              orderId: order.id,
                              status: 'accepted',
                            })
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            updateStatus.mutate({
                              orderId: order.id,
                              status: 'cancelled',
                            })
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <OrderDetailDrawer
        orderId={detailOrderId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRequestShip={setShipOrderId}
      />

      <CourierModal
        open={!!shipOrderId}
        onOpenChange={() => setShipOrderId(null)}
        onSubmit={handleShip}
      />
    </div>
  )
}
