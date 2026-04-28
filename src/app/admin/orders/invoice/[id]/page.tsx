import { notFound } from 'next/navigation'
import { supabaseService } from '@/lib/supabase/service'
import { PrintButton } from '@/components/shared/print-button'

interface InvoicePageProps {
  params: Promise<{ id: string }>
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params

  const { data: order } = await supabaseService
    .from('orders')
    .select('*, profiles(name, email, phone), order_items(*, products(name, images))')
    .eq('id', id)
    .single()

  if (!order) {
    notFound()
  }

  const { data: settingsRows } = await supabaseService
    .from('settings')
    .select('key, value')
    .in('key', ['business_info', 'gst_config', 'gst_enabled'])

  const settings = Object.fromEntries(
    (settingsRows || []).map((r) => [r.key, r.value])
  ) as Record<string, any>

  const business = settings.business_info || {}
  const gstConfig = settings.gst_config || {}
  const gstEnabled = settings.gst_enabled?.enabled ?? false

  const address = order.shipping_address as Record<string, string> | undefined
  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div className='min-h-screen bg-white p-8 print:p-0'>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      {/* Print Button */}
      <div className='no-print flex justify-end mb-6'>
        <PrintButton label='Print Invoice' />
      </div>

      <div className='max-w-3xl mx-auto border border-slate-200 rounded-xl overflow-hidden'>
        {/* Header */}
        <div className='bg-slate-900 text-white p-6 flex justify-between items-start'>
          <div>
            <h1 className='text-2xl font-bold'>{business.name || 'HighlyAligned'}</h1>
            <p className='text-sm text-slate-300 mt-1'>{business.address}</p>
            <p className='text-sm text-slate-300'>Phone: {business.phone}</p>
            <p className='text-sm text-slate-300'>Email: {business.email}</p>
            {gstEnabled && gstConfig.gstin && (
              <p className='text-sm text-slate-300'>GSTIN: {gstConfig.gstin}</p>
            )}
          </div>
          <div className='text-right'>
            <h2 className='text-xl font-bold text-[#f59e0b]'>TAX INVOICE</h2>
            <p className='text-sm text-slate-300 mt-1'>#{order.order_number}</p>
            <p className='text-sm text-slate-300'>Date: {date}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className='p-6 border-b border-slate-100 grid grid-cols-2 gap-6'>
          <div>
            <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>Bill To</p>
            <p className='font-semibold text-slate-900'>{address?.name || order.profiles?.name || 'Customer'}</p>
            <p className='text-sm text-slate-600'>{address?.line1}</p>
            {address?.line2 && <p className='text-sm text-slate-600'>{address.line2}</p>}
            <p className='text-sm text-slate-600'>
              {address?.city}, {address?.state} — {address?.pincode}
            </p>
            <p className='text-sm text-slate-600 mt-1'>Phone: {address?.phone || order.profiles?.phone}</p>
            <p className='text-sm text-slate-600'>Email: {address?.email || order.profiles?.email}</p>
          </div>
          <div>
            <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>Payment</p>
            <p className='text-sm text-slate-700'>
              <span className='font-medium'>Mode:</span> {order.payment_mode.toUpperCase()}
            </p>
            <p className='text-sm text-slate-700'>
              <span className='font-medium'>Status:</span> {order.payment_status}
            </p>
            <p className='text-sm text-slate-700 mt-1'>
              <span className='font-medium'>Order Status:</span>{' '}
              <span className='capitalize'>{order.status.replace(/_/g, ' ')}</span>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className='p-6'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b-2 border-slate-200'>
                <th className='text-left py-2 font-semibold text-slate-700'>#</th>
                <th className='text-left py-2 font-semibold text-slate-700'>Item</th>
                <th className='text-right py-2 font-semibold text-slate-700'>Qty</th>
                <th className='text-right py-2 font-semibold text-slate-700'>Price</th>
                {gstEnabled && <th className='text-right py-2 font-semibold text-slate-700'>GST</th>}
                <th className='text-right py-2 font-semibold text-slate-700'>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items?.map((item: any, idx: number) => (
                <tr key={item.id} className='border-b border-slate-100'>
                  <td className='py-3 text-slate-500'>{idx + 1}</td>
                  <td className='py-3'>
                    <p className='font-medium text-slate-900'>{item.products?.name || 'Product'}</p>
                    {gstEnabled && item.gst_rate > 0 && (
                      <p className='text-xs text-slate-400'>GST @{item.gst_rate}%</p>
                    )}
                  </td>
                  <td className='py-3 text-right text-slate-700'>{item.quantity}</td>
                  <td className='py-3 text-right text-slate-700'>₹{item.price}</td>
                  {gstEnabled && (
                    <td className='py-3 text-right text-slate-700'>₹{item.gst_amount?.toFixed(2) || '0.00'}</td>
                  )}
                  <td className='py-3 text-right font-medium text-slate-900'>₹{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className='p-6 bg-slate-50 border-t border-slate-100'>
          <div className='max-w-xs ml-auto space-y-2 text-sm'>
            <div className='flex justify-between text-slate-700'>
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            {gstEnabled && order.gst_amount > 0 && (
              <div className='flex justify-between text-slate-700'>
                <span>GST</span>
                <span>₹{order.gst_amount}</span>
              </div>
            )}
            {order.discount_amount > 0 && (
              <div className='flex justify-between text-emerald-700'>
                <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                <span>-₹{order.discount_amount}</span>
              </div>
            )}
            <div className='flex justify-between text-slate-700'>
              <span>Shipping</span>
              <span>{order.shipping_amount === 0 ? 'Free' : `₹${order.shipping_amount}`}</span>
            </div>
            <div className='flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-base'>
              <span>Grand Total</span>
              <span>₹{order.final_total}</span>
            </div>
            <p className='text-xs text-slate-500 pt-1 text-right'>
              (Incl. of all taxes)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-slate-100 text-center text-xs text-slate-500 space-y-1'>
          <p>Thank you for shopping with {business.name || 'HighlyAligned'}!</p>
          <p>For any queries, contact us at {business.email} or {business.phone}</p>
        </div>
      </div>
    </div>
  )
}
