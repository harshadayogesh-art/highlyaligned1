'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/use-auth'
import { useOrder } from '@/hooks/use-orders'
import { useCancelOrder } from '@/hooks/use-cancel-order'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusTimeline } from '@/components/admin/status-timeline'
import {
  ArrowLeft,
  Loader2,
  X,
  Truck,
  RotateCcw,
  FileText,
  MapPin,
  CreditCard,
  Package,
  IndianRupee,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const cancelOrder = useCancelOrder()

  useEffect(() => {
    params.then((p) => setOrderId(p.id))
  }, [params])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  const { data: order, isLoading: orderLoading } = useOrder(orderId || '')

  if (authLoading || orderLoading || !orderId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Order not found</p>
        <Link href="/account/orders">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
          </Button>
        </Link>
      </div>
    )
  }

  const address = order.shipping_address as Record<string, string> | undefined
  const canCancel = ['pending', 'accepted'].includes(order.status)
  const canTrack = ['shipped', 'out_for_delivery', 'delivered'].includes(order.status)
  const hasGst = order.gst_enabled_at_checkout && order.gst_amount > 0

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Back link */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      {/* Order Header */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-400 shrink-0" />
              <h1 className="text-base md:text-lg font-bold text-slate-900 truncate">
                Order #{order.order_number}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Placed on{' '}
              {new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <Badge className={`text-xs shrink-0 ${statusColors[order.status] || 'bg-slate-100'}`}>
            {order.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <StatusTimeline status={order.status} size="sm" />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {canTrack && order.tracking_id && (
            <a
              href={order.shipping_label_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline">
                <Truck className="h-4 w-4 mr-1" /> Track Package
              </Button>
            </a>
          )}

          <Link href={`/admin/orders/invoice/${order.id}`} target="_blank">
            <Button size="sm" variant="outline">
              <FileText className="h-4 w-4 mr-1" /> View Invoice
            </Button>
          </Link>

          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowCancelDialog(true)}
            >
              <X className="h-4 w-4 mr-1" /> Cancel Order
            </Button>
          )}

          {order.status === 'delivered' && (
            <Button size="sm" variant="outline">
              <RotateCcw className="h-4 w-4 mr-1" /> Reorder
            </Button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Items ({order.order_items?.length || 0})</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-4">
              <div className="relative w-16 h-16 rounded-lg bg-slate-50 overflow-hidden shrink-0">
                <Image
                  src={item.products?.images?.[0] || '/placeholder.svg'}
                  alt={item.products?.name || 'Product'}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {item.products?.name || 'Product'}
                </p>
                <p className="text-xs text-slate-500">
                  Qty: {item.quantity} × ₹{item.price}
                  {item.gst_rate > 0 && (
                    <span className="ml-1 text-slate-400">(GST @{item.gst_rate}%)</span>
                  )}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900 shrink-0">
                ₹{item.total}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3"
          onClick={() => setShowBreakdown(!showBreakdown)}
        >
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Price Details</h2>
          </div>
          {showBreakdown ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {(showBreakdown || true) && (
          <div className="px-4 pb-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            {hasGst && (
              <>
                {order.cgst_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>CGST</span>
                    <span>₹{order.cgst_amount}</span>
                  </div>
                )}
                {order.sgst_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>SGST</span>
                    <span>₹{order.sgst_amount}</span>
                  </div>
                )}
                {order.igst_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST</span>
                    <span>₹{order.igst_amount}</span>
                  </div>
                )}
                {order.cgst_amount === 0 && order.sgst_amount === 0 && order.igst_amount === 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>GST</span>
                    <span>₹{order.gst_amount}</span>
                  </div>
                )}
              </>
            )}
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>
                  Discount {order.coupon_code && `(${order.coupon_code})`}
                </span>
                <span>-₹{order.discount_amount}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span>
                {order.shipping_amount === 0 ? (
                  <span className="text-emerald-600">Free</span>
                ) : (
                  `₹${order.shipping_amount}`
                )}
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100 text-base">
              <span>Total</span>
              <span>₹{order.final_total}</span>
            </div>
            {hasGst && (
              <p className="text-xs text-slate-400 text-right">
                Incl. of all taxes
                {order.place_of_supply && ` · Place of Supply: ${order.place_of_supply}`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Shipping Address */}
      {address && (
        <div className="bg-white border border-slate-100 rounded-xl p-3 md:p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Shipping Address</h2>
          </div>
          <div className="text-sm text-slate-700 space-y-0.5">
            <p className="font-medium">{address.name}</p>
            <p>{address.line1}</p>
            {address.line2 && <p>{address.line2}</p>}
            <p>
              {address.city}, {address.state} — {address.pincode}
            </p>
            {address.landmark && <p className="text-slate-500">Landmark: {address.landmark}</p>}
            <p className="pt-1">Phone: {address.phone}</p>
            {address.email && <p>Email: {address.email}</p>}
          </div>
        </div>
      )}

      {/* Payment Info */}
      <div className="bg-white border border-slate-100 rounded-xl p-3 md:p-4">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Payment Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
          <div>
            <p className="text-slate-500">Payment Mode</p>
            <p className="font-medium text-slate-900 capitalize">{order.payment_mode}</p>
          </div>
          <div>
            <p className="text-slate-500">Payment Status</p>
            <p className="font-medium text-slate-900 capitalize">{order.payment_status}</p>
          </div>
          {order.razorpay_payment_id && (
            <div>
              <p className="text-slate-500">Transaction ID</p>
              <p className="font-medium text-slate-900 text-xs font-mono">
                {order.razorpay_payment_id}
              </p>
            </div>
          )}
          {order.razorpay_order_id && (
            <div>
              <p className="text-slate-500">Razorpay Order ID</p>
              <p className="font-medium text-slate-900 text-xs font-mono">
                {order.razorpay_order_id}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tracking */}
      {order.courier_name && (
        <div className="bg-white border border-slate-100 rounded-xl p-3 md:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Shipping Details</h2>
          </div>
          <div className="text-sm space-y-1">
            <p className="text-slate-700">
              <span className="text-slate-500">Courier:</span>{' '}
              <span className="font-medium">{order.courier_name}</span>
            </p>
            {order.tracking_id && (
              <p className="text-slate-700">
                <span className="text-slate-500">Tracking ID:</span>{' '}
                <span className="font-medium font-mono">{order.tracking_id}</span>
              </p>
            )}
            {order.shipping_label_url && (
              <a
                href={order.shipping_label_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[#f59e0b] font-medium mt-1 hover:underline"
              >
                Track Package →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Admin Notes */}
      {order.admin_notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
            Note from Team
          </p>
          <p className="text-sm text-amber-800">{order.admin_notes}</p>
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Are you sure you want to cancel order{' '}
            <span className="font-semibold">#{order.order_number}</span>? This action cannot be
            undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                cancelOrder.mutate(order.id)
                setShowCancelDialog(false)
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
