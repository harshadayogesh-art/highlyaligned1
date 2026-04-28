import { notFound } from 'next/navigation'
import { supabaseService } from '@/lib/supabase/service'
import { PrintButton } from '@/components/shared/print-button'

interface LabelPageProps {
  params: Promise<{ id: string }>
}

export default async function LabelPage({ params }: LabelPageProps) {
  const { id } = await params

  const { data: order } = await supabaseService
    .from('orders')
    .select('*, profiles(name, email, phone), order_items(*, products(name))')
    .eq('id', id)
    .single()

  if (!order) {
    notFound()
  }

  const { data: settingsRows } = await supabaseService
    .from('settings')
    .select('key, value')
    .in('key', ['business_info'])

  const settings = Object.fromEntries(
    (settingsRows || []).map((r) => [r.key, r.value])
  ) as Record<string, any>

  const business = settings.business_info || {}
  const address = order.shipping_address as Record<string, string> | undefined

  const itemNames = order.order_items?.map((item: any) => item.products?.name || 'Item').join(', ')

  return (
    <div className='min-h-screen bg-slate-100 p-4 print:p-0 flex items-center justify-center'>
      <style>{`
        @media print {
          @page { size: 100mm 150mm; margin: 0; }
          body { background: white; }
          .label-container { box-shadow: none !important; border: 1px solid #000 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Print Button */}
      <div className='no-print fixed top-4 right-4 z-50'>
        <PrintButton label='Print Label' />
      </div>

      <div className='label-container bg-white border-2 border-slate-900 w-full max-w-[400px] p-5 space-y-4'>
        {/* From */}
        <div className='border-b-2 border-dashed border-slate-300 pb-3'>
          <p className='text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1'>From</p>
          <p className='font-bold text-sm text-slate-900 leading-tight'>{business.name || 'HighlyAligned'}</p>
          <p className='text-xs text-slate-700 leading-tight'>{business.address}</p>
          <p className='text-xs text-slate-700 leading-tight'>{business.phone}</p>
        </div>

        {/* To */}
        <div className='border-b-2 border-dashed border-slate-300 pb-3'>
          <p className='text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1'>Ship To</p>
          <p className='font-bold text-base text-slate-900 leading-tight'>{address?.name}</p>
          <p className='text-sm text-slate-800 leading-tight mt-0.5'>{address?.line1}</p>
          {address?.line2 && <p className='text-sm text-slate-800 leading-tight'>{address.line2}</p>}
          <p className='text-sm text-slate-800 leading-tight'>
            {address?.city}, {address?.state}
          </p>
          <p className='text-sm font-bold text-slate-900 leading-tight'>{address?.pincode}</p>
          <p className='text-xs text-slate-600 mt-1'>📞 {address?.phone}</p>
        </div>

        {/* Order Info */}
        <div className='space-y-1'>
          <div className='flex justify-between items-center'>
            <span className='text-[10px] font-bold text-slate-500 uppercase'>Order #</span>
            <span className='text-sm font-bold font-mono text-slate-900'>{order.order_number}</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-[10px] font-bold text-slate-500 uppercase'>Date</span>
            <span className='text-xs text-slate-700'>
              {new Date(order.created_at).toLocaleDateString('en-IN')}
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-[10px] font-bold text-slate-500 uppercase'>Payment</span>
            <span className='text-xs font-bold text-slate-900 uppercase'>{order.payment_mode}</span>
          </div>
          {order.courier_name && (
            <div className='flex justify-between items-center'>
              <span className='text-[10px] font-bold text-slate-500 uppercase'>Courier</span>
              <span className='text-xs text-slate-700'>{order.courier_name}</span>
            </div>
          )}
          {order.tracking_id && (
            <div className='flex justify-between items-center'>
              <span className='text-[10px] font-bold text-slate-500 uppercase'>Tracking</span>
              <span className='text-xs font-mono text-slate-900'>{order.tracking_id}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className='border-t-2 border-dashed border-slate-300 pt-2'>
          <p className='text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1'>Contents</p>
          <p className='text-xs text-slate-800 line-clamp-3'>{itemNames}</p>
          <p className='text-xs text-slate-500 mt-0.5'>
            {order.order_items?.length} item(s) | ₹{order.final_total}
          </p>
        </div>

        {/* COD */}
        {order.payment_mode === 'cod' && (
          <div className='bg-amber-100 border-2 border-amber-300 rounded px-3 py-2 text-center'>
            <p className='text-lg font-bold text-amber-900'>COD</p>
            <p className='text-sm font-bold text-amber-900'>₹{order.final_total}</p>
            <p className='text-[10px] text-amber-700'>Collect on delivery</p>
          </div>
        )}

        {/* Fragile */}
        <div className='border-2 border-red-400 rounded px-3 py-1.5 text-center'>
          <p className='text-xs font-bold text-red-600 uppercase'>Handle with Care — Fragile</p>
        </div>

        {/* QR Placeholder */}
        <div className='flex items-center justify-center gap-3 pt-1'>
          <div className='w-16 h-16 border border-slate-300 bg-slate-50 flex items-center justify-center'>
            <span className='text-[8px] text-slate-400 text-center leading-tight'>QR<br/>CODE</span>
          </div>
          <div className='text-[8px] text-slate-400 text-center'>
            Scan to verify<br/>authenticity
          </div>
        </div>
      </div>
    </div>
  )
}
