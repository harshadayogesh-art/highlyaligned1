'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useOrders } from '@/hooks/use-orders'
import { useBookings } from '@/hooks/use-bookings'
import { useCreateRemedy } from '@/hooks/use-remedies'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  User,
  Phone,
  Mail,
  MessageCircle,
  ShoppingBag,
  Calendar,
  Star,
  Copy,
  Check,
  Loader2,
  Plus,
  Package,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface CustomerDetailDrawerProps {
  customer: {
    id: string
    name: string
    email: string
    phone: string | null
    role: string
    referral_code: string | null
    created_at: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className='bg-white border border-slate-100 rounded-xl p-3 text-center'>
      <div className={`mx-auto w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        {icon}
      </div>
      <p className='text-lg font-bold text-slate-900'>{value}</p>
      <p className='text-[10px] text-slate-500 uppercase tracking-wide'>{label}</p>
    </div>
  )
}

function getSegment(orders: any[], totalSpent: number, createdAt: string) {
  const daysSinceJoined = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))

  if (orders.length >= 3 || totalSpent >= 5000) {
    return { label: 'VIP', color: 'bg-purple-100 text-purple-800 border-purple-200' }
  }
  if (orders.length >= 1) {
    const lastOrder = orders[0]
    const daysSinceLastOrder = lastOrder ? Math.floor((Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 999
    if (daysSinceLastOrder > 90) {
      return { label: 'At Risk', color: 'bg-red-100 text-red-800 border-red-200' }
    }
    return { label: 'Regular', color: 'bg-blue-100 text-blue-800 border-blue-200' }
  }
  if (daysSinceJoined <= 30) {
    return { label: 'New', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  }
  return { label: 'Guest', color: 'bg-slate-100 text-slate-800 border-slate-200' }
}

export function CustomerDetailDrawer({ customer, open, onOpenChange }: CustomerDetailDrawerProps) {
  const { data: ordersData, isPending: ordersLoading } = useOrders({ customerId: customer?.id })
  const { data: bookingsData, isPending: bookingsLoading } = useBookings({ customerId: customer?.id })
  const createRemedy = useCreateRemedy()

  const [remedyOpen, setRemedyOpen] = useState(false)
  const [remedyForm, setRemedyForm] = useState({
    title: '', description: '', duration_days: 21, frequency: 'Daily', instructions: '', attachment_url: '',
  })

  const orders = ordersData?.data || []
  const bookings = bookingsData || []

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.final_total), 0)
    const totalBookings = bookings.length
    const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0
    return { totalSpent, totalBookings, avgOrderValue, orderCount: orders.length }
  }, [orders, bookings])

  const segment = customer ? getSegment(orders, stats.totalSpent, customer.created_at) : null

  const whatsappLink = customer?.phone
    ? `https://wa.me/91${customer.phone.replace(/\D/g, '')}`
    : null

  const isLoading = ordersLoading || bookingsLoading

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-2xl overflow-y-auto p-0'>
        <SheetTitle className='sr-only'>Customer Details</SheetTitle>

        {!customer ? (
          <div className='h-full flex flex-col items-center justify-center gap-3 p-8'>
            <User className='h-10 w-10 text-slate-300' />
            <p className='text-sm text-slate-500'>Customer not found</p>
          </div>
        ) : (
          <div className='flex flex-col h-full'>
            {/* Header */}
            <SheetHeader className='px-6 py-5 border-b bg-slate-50/50'>
              <div className='flex items-start justify-between'>
                <div className='space-y-1'>
                  <SheetTitle className='text-lg flex items-center gap-2'>
                    {customer.name}
                    <CopyButton text={customer.name} label='Name' />
                  </SheetTitle>
                  <p className='text-xs text-slate-500'>
                    Customer since {new Date(customer.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                {segment && (
                  <Badge className={`${segment.color} border`}>
                    {segment.label}
                  </Badge>
                )}
              </div>
            </SheetHeader>

            {/* Body */}
            <div className='flex-1 px-6 py-5 space-y-6'>
              {/* Stats */}
              <div className='grid grid-cols-4 gap-3'>
                <StatCard
                  label='Orders'
                  value={String(stats.orderCount)}
                  icon={<ShoppingBag className='h-4 w-4 text-amber-600' />}
                  color='bg-amber-50'
                />
                <StatCard
                  label='Total Spent'
                  value={`₹${Math.round(stats.totalSpent)}`}
                  icon={<TrendingUp className='h-4 w-4 text-emerald-600' />}
                  color='bg-emerald-50'
                />
                <StatCard
                  label='Bookings'
                  value={String(stats.totalBookings)}
                  icon={<Calendar className='h-4 w-4 text-violet-600' />}
                  color='bg-violet-50'
                />
                <StatCard
                  label='Avg Order'
                  value={`₹${Math.round(stats.avgOrderValue)}`}
                  icon={<Star className='h-4 w-4 text-blue-600' />}
                  color='bg-blue-50'
                />
              </div>

              {/* Profile */}
              <Section title='Contact' icon={<User className='h-4 w-4 text-[#f59e0b]' />}>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-500'>Email</span>
                  <span className='text-sm text-slate-900 flex items-center'>
                    {customer.email}
                    <CopyButton text={customer.email} />
                  </span>
                </div>
                {customer.phone && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-500'>Phone</span>
                    <span className='text-sm text-slate-900 flex items-center'>
                      {customer.phone}
                      <CopyButton text={customer.phone} />
                    </span>
                  </div>
                )}
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-500'>Referral Code</span>
                  <span className='text-sm font-mono text-slate-900 flex items-center'>
                    {customer.referral_code || '—'}
                    {customer.referral_code && <CopyButton text={customer.referral_code} />}
                  </span>
                </div>
              </Section>

              {/* Product Orders */}
              <Section title='Product Purchase History' icon={<Package className='h-4 w-4 text-[#f59e0b]' />}>
                {isLoading ? (
                  <div className='flex items-center justify-center py-4'>
                    <Loader2 className='h-5 w-5 animate-spin text-slate-400' />
                  </div>
                ) : orders.length === 0 ? (
                  <p className='text-sm text-slate-400 text-center py-2'>No product orders yet</p>
                ) : (
                  <div className='space-y-3'>
                    {orders.map((order) => (
                      <div key={order.id} className='bg-white border border-slate-100 rounded-lg p-3 space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-slate-900'>#{order.order_number}</span>
                          <Badge className='text-[10px]'>
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className='text-xs text-slate-500'>
                          {new Date(order.created_at).toLocaleDateString('en-IN')} • {order.payment_mode.toUpperCase()}
                        </p>
                        <div className='flex gap-2 overflow-x-auto pb-1'>
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className='flex items-center gap-2 min-w-0'>
                              <div className='relative w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0'>
                                <Image
                                  src={item.products?.images?.[0] || '/placeholder.svg'}
                                  alt=''
                                  fill
                                  className='object-cover'
                                  sizes='32px'
                                />
                              </div>
                              <p className='text-xs text-slate-700 truncate'>
                                {item.products?.name}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className='flex justify-between text-xs pt-1 border-t border-slate-50'>
                          <span className='text-slate-500'>{order.order_items?.length || 0} items</span>
                          <span className='font-semibold text-slate-900'>₹{order.final_total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Service Bookings */}
              <Section title='Service History' icon={<Calendar className='h-4 w-4 text-[#f59e0b]' />}>
                {isLoading ? (
                  <div className='flex items-center justify-center py-4'>
                    <Loader2 className='h-5 w-5 animate-spin text-slate-400' />
                  </div>
                ) : bookings.length === 0 ? (
                  <p className='text-sm text-slate-400 text-center py-2'>No service bookings yet</p>
                ) : (
                  <div className='space-y-3'>
                    {bookings.map((booking) => (
                      <div key={booking.id} className='bg-white border border-slate-100 rounded-lg p-3 space-y-1'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-slate-900'>{booking.services?.name}</span>
                          <Badge className='text-[10px]'>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className='text-xs text-slate-500'>
                          {new Date(booking.date).toLocaleDateString('en-IN')} at {booking.time_slot}
                        </p>
                        <div className='flex justify-between text-xs pt-1'>
                          <span className='text-slate-500 capitalize'>{booking.mode} session</span>
                          <span className='font-semibold text-slate-900'>₹{booking.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            {/* Footer */}
            <div className='px-6 py-4 border-t bg-slate-50/50 flex gap-2 flex-wrap'>
              {whatsappLink && (
                <Button size='sm' variant='outline' asChild>
                  <a href={whatsappLink} target='_blank' rel='noopener noreferrer'>
                    <MessageCircle className='h-4 w-4 mr-1.5' />
                    WhatsApp
                  </a>
                </Button>
              )}
              <Button size='sm' variant='outline' asChild>
                <a href={`mailto:${customer.email}`}>
                  <Mail className='h-4 w-4 mr-1.5' />
                  Email
                </a>
              </Button>
              <Button size='sm' variant='outline' onClick={() => setRemedyOpen(true)}>
                <Plus className='h-4 w-4 mr-1.5' />
                Add Remedy
              </Button>
            </div>
          </div>
        )}
      </SheetContent>

      {/* Add Remedy Dialog */}
      <Dialog open={remedyOpen} onOpenChange={setRemedyOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader><DialogTitle>Add Remedy</DialogTitle></DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'><Label>Title *</Label><Input value={remedyForm.title} onChange={(e) => setRemedyForm({ ...remedyForm, title: e.target.value })} placeholder='e.g. Hanuman Chalisa' /></div>
            <div className='space-y-1'><Label>Description</Label><Textarea value={remedyForm.description} onChange={(e) => setRemedyForm({ ...remedyForm, description: e.target.value })} /></div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'><Label>Duration (days)</Label><Input type='number' value={remedyForm.duration_days} onChange={(e) => setRemedyForm({ ...remedyForm, duration_days: Number(e.target.value) })} /></div>
              <div className='space-y-1'><Label>Frequency</Label>
                <select className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm' value={remedyForm.frequency} onChange={(e) => setRemedyForm({ ...remedyForm, frequency: e.target.value })}>
                  <option>Daily</option><option>Twice a day</option><option>Specific days</option>
                </select>
              </div>
            </div>
            <div className='space-y-1'><Label>Instructions</Label><Textarea value={remedyForm.instructions} onChange={(e) => setRemedyForm({ ...remedyForm, instructions: e.target.value })} placeholder='Step by step instructions...' /></div>
            <div className='space-y-1'><Label>Attachment URL</Label><Input value={remedyForm.attachment_url} onChange={(e) => setRemedyForm({ ...remedyForm, attachment_url: e.target.value })} placeholder='https://...' /></div>
            <Button
              className='w-full bg-[#f59e0b] text-slate-900'
              onClick={() => {
                if (!remedyForm.title || !customer) return
                createRemedy.mutate({
                  ...remedyForm,
                  customer_id: customer.id,
                  booking_id: null,
                  status: 'active',
                }, { onSuccess: () => { setRemedyOpen(false); setRemedyForm({ title: '', description: '', duration_days: 21, frequency: 'Daily', instructions: '', attachment_url: '' }) } })
              }}
            >
              Save Remedy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
