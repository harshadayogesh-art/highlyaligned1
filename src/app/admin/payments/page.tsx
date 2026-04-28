'use client'

import { useState } from 'react'
import { usePayments, useMarkCodCollected, type PaymentRecord } from '@/hooks/use-payments'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  IndianRupee,
  Banknote,
  CreditCard,
  RotateCcw,
  CheckCircle,
  Loader2,
  Copy,
  Truck,
  Package,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'

type TabKey = 'all' | 'cod' | 'online'

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const { data: payments, isLoading } = usePayments(activeTab)
  const markCollected = useMarkCodCollected()

  const [confirmOrder, setConfirmOrder] = useState<PaymentRecord | null>(null)

  // Stats
  const allPayments = payments || []
  const totalRevenue = allPayments
    .filter((p) => p.payment_status === 'captured')
    .reduce((s, p) => s + p.amount, 0)
  const pendingCod = allPayments
    .filter((p) => p.payment_mode === 'cod' && p.payment_status !== 'captured')
    .reduce((s, p) => s + p.amount, 0)
  const onlineCaptured = allPayments
    .filter((p) => p.payment_mode === 'online' && p.payment_status === 'captured')
    .reduce((s, p) => s + p.amount, 0)
  const refunds = allPayments
    .filter((p) => p.payment_status === 'refunded')
    .reduce((s, p) => s + p.amount, 0)

  const pendingCodCount = allPayments.filter(
    (p) => p.payment_mode === 'cod' && p.payment_status !== 'captured'
  ).length
  const onlineCapturedCount = allPayments.filter(
    (p) => p.payment_mode === 'online' && p.payment_status === 'captured'
  ).length
  const refundCount = allPayments.filter((p) => p.payment_status === 'refunded').length

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All Payments' },
    { key: 'cod', label: 'COD' },
    { key: 'online', label: 'Online' },
  ]

  const handleMarkCollected = (record: PaymentRecord) => {
    markCollected.mutate(
      { orderId: record.id, amount: record.amount },
      { onSuccess: () => setConfirmOrder(null) }
    )
  }

  const getStatusBadge = (record: PaymentRecord) => {
    if (record.payment_status === 'captured') {
      return (
        <Badge className='bg-emerald-100 text-emerald-800 border-0'>
          <CheckCircle className='h-3 w-3 mr-1' /> Collected
        </Badge>
      )
    }
    if (record.payment_status === 'refunded') {
      return (
        <Badge className='bg-purple-100 text-purple-800 border-0'>
          <RotateCcw className='h-3 w-3 mr-1' /> Refunded
        </Badge>
      )
    }
    if (record.payment_status === 'failed') {
      return (
        <Badge className='bg-red-100 text-red-800 border-0'>
          Failed
        </Badge>
      )
    }
    if (record.payment_mode === 'cod') {
      return (
        <Badge className='bg-amber-100 text-amber-800 border-0'>
          <Truck className='h-3 w-3 mr-1' /> Pending
        </Badge>
      )
    }
    return (
      <Badge className='bg-slate-100 text-slate-600 border-0'>
        Pending
      </Badge>
    )
  }

  const getCodAction = (record: PaymentRecord) => {
    if (record.payment_mode !== 'cod') return null
    if (record.payment_status === 'captured') {
      return (
        <span className='text-xs text-emerald-600 flex items-center gap-1'>
          <CheckCircle className='h-3.5 w-3.5' />
          {record.cod_collection_date
            ? new Date(record.cod_collection_date).toLocaleDateString()
            : 'Collected'}
        </span>
      )
    }
    // Only allow marking collected if order is delivered
    if (record.source === 'delivered') {
      return (
        <Button
          size='sm'
          className='bg-emerald-500 hover:bg-emerald-600 text-white h-7 text-xs'
          onClick={() => setConfirmOrder(record)}
        >
          <Banknote className='h-3.5 w-3.5 mr-1' /> Collect
        </Button>
      )
    }
    return (
      <span className='text-xs text-slate-400 flex items-center gap-1'>
        <Package className='h-3.5 w-3.5' /> {record.source}
      </span>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-slate-900'>Payments</h1>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          icon={<IndianRupee className='h-5 w-5 text-emerald-500' />}
          value={`Rs.${totalRevenue.toLocaleString('en-IN')}`}
          label='Total Revenue'
          sub='All time'
        />
        <StatCard
          icon={<Banknote className='h-5 w-5 text-amber-500' />}
          value={`Rs.${pendingCod.toLocaleString('en-IN')}`}
          label='Pending COD'
          sub={`${pendingCodCount} orders`}
        />
        <StatCard
          icon={<CreditCard className='h-5 w-5 text-blue-500' />}
          value={`Rs.${onlineCaptured.toLocaleString('en-IN')}`}
          label='Online Captured'
          sub={`${onlineCapturedCount} payments`}
        />
        <StatCard
          icon={<RotateCcw className='h-5 w-5 text-purple-500' />}
          value={`Rs.${refunds.toLocaleString('en-IN')}`}
          label='Refunds'
          sub={`${refundCount} orders`}
        />
      </div>

      {/* Tabs */}
      <div className='bg-white border border-slate-100 rounded-xl overflow-hidden'>
        <div className='flex border-b border-slate-100'>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-[#f59e0b] text-[#f59e0b]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-slate-500'>
              <tr>
                <th className='text-left px-4 py-3 font-medium'>Date</th>
                <th className='text-left px-4 py-3 font-medium'>Type</th>
                <th className='text-left px-4 py-3 font-medium'>Number</th>
                <th className='text-left px-4 py-3 font-medium'>Customer</th>
                <th className='text-left px-4 py-3 font-medium'>Mode</th>
                <th className='text-right px-4 py-3 font-medium'>Amount</th>
                <th className='text-left px-4 py-3 font-medium'>Status</th>
                <th className='text-left px-4 py-3 font-medium'>Action</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className='px-4 py-8 text-center text-slate-400'>
                    <Loader2 className='h-6 w-6 animate-spin mx-auto mb-2' />
                    Loading payments...
                  </td>
                </tr>
              ) : allPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className='px-4 py-8 text-center text-slate-400'>
                    No payments found.
                  </td>
                </tr>
              ) : (
                allPayments.map((p) => (
                  <tr key={`${p.type}-${p.id}`} className='hover:bg-slate-50'>
                    <td className='px-4 py-3 whitespace-nowrap'>
                      <div className='flex items-center gap-1.5 text-slate-600'>
                        <Calendar className='h-3.5 w-3.5 text-slate-400' />
                        {new Date(p.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <Badge
                        className={
                          p.type === 'order'
                            ? 'bg-blue-50 text-blue-700 border-0'
                            : 'bg-pink-50 text-pink-700 border-0'
                        }
                      >
                        {p.type === 'order' ? 'Order' : 'Booking'}
                      </Badge>
                    </td>
                    <td className='px-4 py-3 font-mono text-xs text-slate-700'>
                      {p.number}
                    </td>
                    <td className='px-4 py-3'>
                      <div>
                        <p className='text-slate-900'>{p.customer_name}</p>
                        {p.customer_phone && (
                          <p className='text-xs text-slate-400'>
                            {p.customer_phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <Badge
                        className={
                          p.payment_mode === 'cod'
                            ? 'bg-amber-50 text-amber-700 border-0'
                            : 'bg-indigo-50 text-indigo-700 border-0'
                        }
                      >
                        {p.payment_mode === 'cod' ? 'COD' : 'Online'}
                      </Badge>
                    </td>
                    <td className='px-4 py-3 text-right font-medium text-slate-900'>
                      Rs.{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className='px-4 py-3'>{getStatusBadge(p)}</td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        {getCodAction(p)}
                        {p.razorpay_id && (
                          <Button
                            size='icon-sm'
                            variant='ghost'
                            className='h-7 w-7'
                            onClick={() => {
                              navigator.clipboard.writeText(p.razorpay_id!)
                              toast.success('Razorpay ID copied')
                            }}
                            title={p.razorpay_id}
                          >
                            <Copy className='h-3.5 w-3.5 text-slate-400' />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm COD Collection Dialog */}
      <Dialog open={!!confirmOrder} onOpenChange={() => setConfirmOrder(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Mark COD as Collected?</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='bg-slate-50 rounded-lg p-3 text-sm space-y-1'>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Order</span>
                <span className='font-medium text-slate-900'>
                  {confirmOrder?.number}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Customer</span>
                <span className='font-medium text-slate-900'>
                  {confirmOrder?.customer_name}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Amount</span>
                <span className='font-bold text-slate-900'>
                  Rs.{confirmOrder?.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Date</span>
                <span className='text-slate-900'>
                  {new Date().toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
            <div className='flex gap-3'>
              <Button
                variant='outline'
                className='flex-1'
                onClick={() => setConfirmOrder(null)}
              >
                Cancel
              </Button>
              <Button
                className='flex-1 bg-emerald-500 hover:bg-emerald-600 text-white'
                onClick={() => confirmOrder && handleMarkCollected(confirmOrder)}
                disabled={markCollected.isPending}
              >
                {markCollected.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin mr-1' />
                ) : (
                  <CheckCircle className='h-4 w-4 mr-1' />
                )}
                Confirm Collection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode
  value: string
  label: string
  sub: string
}) {
  return (
    <div className='bg-white border border-slate-100 rounded-xl p-4'>
      {icon}
      <p className='text-xl font-bold mt-2'>{value}</p>
      <p className='text-sm font-medium text-slate-700'>{label}</p>
      <p className='text-xs text-slate-400'>{sub}</p>
    </div>
  )
}


