'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { StatusTimeline } from './status-timeline'
import { formatDateTime } from '@/lib/utils/format'
import { useOrder, useUpdateAdminNotes, useUpdateOrderStatus } from '@/hooks/use-orders'
import {
  Printer,
  MessageCircle,
  Copy,
  Check,
  Truck,
  Package,
  User,
  MapPin,
  CreditCard,
  StickyNote,
  Loader2,
  X,
  CheckCircle,
  ArrowRight,
  Banknote,
} from 'lucide-react'
import { toast } from 'sonner'

interface OrderDetailDrawerProps {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestShip?: (orderId: string) => void
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  packed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  shipped: 'bg-sky-100 text-sky-800 border-sky-200',
  out_for_delivery: 'bg-teal-100 text-teal-800 border-teal-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  returned: 'bg-slate-100 text-slate-800 border-slate-200',
}

const statusActions: Record<string, { label: string; next: string; icon?: React.ReactNode; variant?: 'default' | 'outline' | 'destructive' }[]> = {
  pending: [
    { label: 'Accept Order', next: 'accepted', icon: <CheckCircle className='h-3.5 w-3.5' />, variant: 'default' },
    { label: 'Cancel', next: 'cancelled', icon: <X className='h-3.5 w-3.5' />, variant: 'destructive' },
  ],
  accepted: [
    { label: 'Start Processing', next: 'processing', icon: <Package className='h-3.5 w-3.5' />, variant: 'default' },
  ],
  processing: [
    { label: 'Mark Packed', next: 'packed', icon: <Package className='h-3.5 w-3.5' />, variant: 'default' },
  ],
  packed: [
    { label: 'Ship Order', next: 'shipped', icon: <Truck className='h-3.5 w-3.5' />, variant: 'default' },
  ],
  shipped: [
    { label: 'Out for Delivery', next: 'out_for_delivery', icon: <Truck className='h-3.5 w-3.5' />, variant: 'outline' },
    { label: 'Mark Delivered', next: 'delivered', icon: <CheckCircle className='h-3.5 w-3.5' />, variant: 'default' },
  ],
  out_for_delivery: [
    { label: 'Mark Delivered', next: 'delivered', icon: <CheckCircle className='h-3.5 w-3.5' />, variant: 'default' },
  ],
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`${label || 'Copied'} to clipboard`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }
  return (
    <button
      onClick={handleCopy}
      className='inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#f59e0b] transition-colors ml-1'
      title='Copy'
    >
      {copied ? <Check className='h-3 w-3' /> : <Copy className='h-3 w-3' />}
    </button>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2 text-slate-800'>
        {icon}
        <h3 className='font-semibold text-sm uppercase tracking-wide'>{title}</h3>
      </div>
      <div className='bg-slate-50 rounded-xl p-4 space-y-2'>
        {children}
      </div>
    </div>
  )
}

export function OrderDetailDrawer({ orderId, open, onOpenChange, onRequestShip }: OrderDetailDrawerProps) {
  const { data: order, isPending } = useOrder(orderId || '')
  const updateNotes = useUpdateAdminNotes()
  const updateStatus = useUpdateOrderStatus()
  const [notes, setNotes] = useState('')

  const address = order?.shipping_address as Record<string, string> | undefined
  const actions = order ? statusActions[order.status] || [] : []
  const isGuest = !order?.customer_id

  const handleSaveNotes = () => {
    if (!order) return
    updateNotes.mutate({ orderId: order.id, notes: notes || order.admin_notes || '' })
  }

  const handleStatusChange = (status: string, extra?: Record<string, unknown>) => {
    if (!order) return
    if (status === 'shipped' && onRequestShip) {
      onRequestShip(order.id)
      return
    }
    updateStatus.mutate({ orderId: order.id, status, extra })
  }

  const rawPhone = order?.profiles?.phone || address?.phone
  const whatsappLink = rawPhone ? `https://wa.me/91${rawPhone.replace(/\D/g, '')}` : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-2xl overflow-y-auto p-0'>
        <SheetTitle className='sr-only'>Order Details</SheetTitle>
        {isPending ? (
          <div className='h-full flex flex-col items-center justify-center gap-3 p-8'>
            <Loader2 className='h-8 w-8 animate-spin text-[#f59e0b]' />
            <p className='text-sm text-slate-500'>Loading order details...</p>
          </div>
        ) : !order ? (
          <div className='h-full flex flex-col items-center justify-center gap-3 p-8'>
            <Package className='h-10 w-10 text-slate-300' />
            <p className='text-sm text-slate-500'>Order not found</p>
          </div>
        ) : (
          <div className='flex flex-col h-full'>
            {/* Header */}
            <SheetHeader className='px-6 py-5 border-b bg-slate-50/50'>
              <div className='flex items-start justify-between'>
                <div className='space-y-1'>
                  <SheetTitle className='text-lg flex items-center gap-2'>
                    Order #{order.order_number}
                    <CopyButton text={order.order_number} label='Order number' />
                  </SheetTitle>
                  <p className='text-xs text-slate-500'>{formatDateTime(order.created_at)}</p>
                </div>
                <Badge className={`${statusColors[order.status] || 'bg-slate-100'} border`}>
                  {order.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              {/* Status Timeline */}
              <div className='pt-3'>
                <StatusTimeline status={order.status} />
              </div>
            </SheetHeader>

            {/* Body */}
            <div className='flex-1 px-6 py-5 space-y-6'>
              {/* Status Actions */}
              {actions.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {actions.map((action) => (
                    <Button
                      key={action.next}
                      size='sm'
                      variant={action.variant}
                      className='text-xs h-8 gap-1.5'
                      onClick={() => handleStatusChange(action.next)}
                      disabled={updateStatus.isPending}
                    >
                      {updateStatus.isPending ? <Loader2 className='h-3 w-3 animate-spin' /> : action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* COD Collection */}
              {order.status === 'delivered' && order.payment_mode === 'cod' && !order.cod_collected && (
                <div className='bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-emerald-800'>
                    <Banknote className='h-5 w-5' />
                    <span className='text-sm font-medium'>COD payment pending collection</span>
                  </div>
                  <Button
                    size='sm'
                    className='bg-emerald-600 hover:bg-emerald-700 text-white'
                    onClick={() =>
                      handleStatusChange('delivered', {
                        cod_collected: true,
                        cod_collection_date: new Date().toISOString(),
                      })
                    }
                    disabled={updateStatus.isPending}
                  >
                    {updateStatus.isPending ? <Loader2 className='h-3 w-3 animate-spin mr-1' /> : <Check className='h-3 w-3 mr-1' />}
                    Mark COD Collected
                  </Button>
                </div>
              )}

              {/* Items */}
              <Section title='Items' icon={<Package className='h-4 w-4 text-[#f59e0b]' />}>
                <div className='space-y-3'>
                  {order.order_items?.map((item) => (
                    <div key={item.id} className='flex gap-3 items-center'>
                      <div className='relative w-14 h-14 rounded-lg bg-white border overflow-hidden flex-shrink-0'>
                        <Image
                          src={item.products?.images?.[0] || '/placeholder.svg'}
                          alt={item.products?.name || 'Product'}
                          fill
                          className='object-cover'
                          sizes='56px'
                        />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-slate-900 truncate'>
                          {item.products?.name || 'Unknown Product'}
                        </p>
                        <p className='text-xs text-slate-500'>
                          Qty: {item.quantity} × ₹{item.price}
                          {item.gst_amount > 0 && <span className='ml-1 text-slate-400'>(GST: ₹{item.gst_amount.toFixed(2)})</span>}
                        </p>
                      </div>
                      <div className='text-sm font-semibold text-slate-900'>₹{item.total}</div>
                    </div>
                  ))}
                </div>

                <Separator className='my-2' />

                <div className='space-y-1.5 text-sm'>
                  <div className='flex justify-between text-slate-600'>
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  {order.gst_amount > 0 && (
                    <div className='flex justify-between text-slate-600'>
                      <span>GST</span>
                      <span>₹{order.gst_amount}</span>
                    </div>
                  )}
                  {order.discount_amount > 0 && (
                    <div className='flex justify-between text-emerald-600'>
                      <span>Discount {order.coupon_code && <span className='text-xs'>({order.coupon_code})</span>}</span>
                      <span>-₹{order.discount_amount}</span>
                    </div>
                  )}
                  <div className='flex justify-between text-slate-600'>
                    <span>Shipping</span>
                    <span>{order.shipping_amount === 0 ? 'Free' : `₹${order.shipping_amount}`}</span>
                  </div>
                  <div className='flex justify-between font-bold text-slate-900 pt-2 border-t'>
                    <span>Total</span>
                    <span>₹{order.final_total}</span>
                  </div>
                </div>
              </Section>

              {/* Customer */}
              <Section title='Customer' icon={<User className='h-4 w-4 text-[#f59e0b]' />}>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-500'>Name</span>
                  <span className='text-sm font-medium text-slate-900'>
                    {order.profiles?.name || address?.name || 'Guest'}
                    {isGuest && <Badge variant='outline' className='ml-2 text-[10px] h-5'>Guest</Badge>}
                  </span>
                </div>
                {(order.profiles?.email || address?.email) && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-500'>Email</span>
                    <span className='text-sm text-slate-900 flex items-center'>
                      {order.profiles?.email || address?.email}
                      <CopyButton text={order.profiles?.email || address?.email || ''} />
                    </span>
                  </div>
                )}
                {(order.profiles?.phone || address?.phone) && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-500'>Phone</span>
                    <span className='text-sm text-slate-900 flex items-center'>
                      {order.profiles?.phone || address?.phone}
                      <CopyButton text={order.profiles?.phone || address?.phone || ''} />
                    </span>
                  </div>
                )}
              </Section>

              {/* Shipping Address */}
              <Section title='Shipping Address' icon={<MapPin className='h-4 w-4 text-[#f59e0b]' />}>
                {address ? (
                  <div className='text-sm text-slate-700 space-y-0.5'>
                    <p className='font-medium'>{address.name}</p>
                    <p>{address.line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>{address.city}, {address.state} — {address.pincode}</p>
                    {address.landmark && <p className='text-slate-500 text-xs'>Landmark: {address.landmark}</p>}
                    {address.phone && (
                      <p className='text-slate-500 text-xs pt-1'>Contact: {address.phone}</p>
                    )}
                  </div>
                ) : (
                  <p className='text-sm text-slate-400'>No address on file</p>
                )}
              </Section>

              {/* Payment */}
              <Section title='Payment' icon={<CreditCard className='h-4 w-4 text-[#f59e0b]' />}>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-500'>Mode</span>
                  <Badge variant='outline' className='text-xs uppercase'>
                    {order.payment_mode}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-500'>Status</span>
                  <Badge
                    className={
                      order.payment_status === 'captured'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.payment_status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }
                  >
                    {order.payment_status}
                  </Badge>
                </div>
                {order.razorpay_order_id && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-500'>Razorpay Order</span>
                    <span className='text-xs font-mono text-slate-600 flex items-center'>
                      {order.razorpay_order_id}
                      <CopyButton text={order.razorpay_order_id} />
                    </span>
                  </div>
                )}
                {order.razorpay_payment_id && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-500'>Razorpay Payment</span>
                    <span className='text-xs font-mono text-slate-600 flex items-center'>
                      {order.razorpay_payment_id}
                      <CopyButton text={order.razorpay_payment_id} />
                    </span>
                  </div>
                )}
              </Section>

              {/* Shipping */}
              {order.courier_name && (
                <Section title='Shipping Details' icon={<Truck className='h-4 w-4 text-[#f59e0b]' />}>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-500'>Courier</span>
                    <span className='text-sm font-medium text-slate-900'>{order.courier_name}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-500'>Tracking ID</span>
                    <span className='text-sm font-mono text-slate-900 flex items-center'>
                      {order.tracking_id}
                      <CopyButton text={order.tracking_id || ''} />
                    </span>
                  </div>
                  {order.shipping_label_url && (
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-slate-500'>Tracking URL</span>
                      <a
                        href={order.shipping_label_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-[#f59e0b] hover:underline flex items-center gap-1'
                      >
                        Open Link <ArrowRight className='h-3 w-3' />
                      </a>
                    </div>
                  )}
                </Section>
              )}

              {/* Admin Notes */}
              <Section title='Admin Notes' icon={<StickyNote className='h-4 w-4 text-[#f59e0b]' />}>
                <Textarea
                  value={notes || order.admin_notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Add internal notes about this order...'
                  className='text-sm bg-white'
                  rows={3}
                />
                <div className='flex justify-end'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={handleSaveNotes}
                    disabled={updateNotes.isPending}
                  >
                    {updateNotes.isPending ? <Loader2 className='h-3 w-3 animate-spin mr-1' /> : null}
                    Save Notes
                  </Button>
                </div>
              </Section>
            </div>

            {/* Footer Actions */}
            <div className='px-6 py-4 border-t bg-slate-50/50 flex gap-2 flex-wrap'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => window.open(`/admin/orders/invoice/${order.id}`, '_blank')}
              >
                <Printer className='h-4 w-4 mr-1.5' />
                Print Invoice
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => window.open(`/admin/orders/label/${order.id}`, '_blank')}
              >
                <Package className='h-4 w-4 mr-1.5' />
                Print Label
              </Button>
              {whatsappLink && (
                <Button size='sm' variant='outline' asChild>
                  <a href={whatsappLink} target='_blank' rel='noopener noreferrer'>
                    <MessageCircle className='h-4 w-4 mr-1.5' />
                    WhatsApp Customer
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
