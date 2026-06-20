import { NextResponse } from 'next/server'
import { getPhonePeOrderStatus } from '@/lib/phonepe'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const status = await getPhonePeOrderStatus(orderId)

    if (status.state === 'COMPLETED') {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // Check if it's an order
      const { data: order } = await supabase.from('orders').select('id, payment_status').eq('id', orderId).maybeSingle()
      
      if (order && order.payment_status === 'pending') {
        const { data: updated } = await supabase.from('orders').update({
          payment_status: 'captured',
          razorpay_payment_id: status.paymentDetails?.[0]?.transactionId ?? null,
          status: 'accepted',
        }).eq('id', order.id).eq('payment_status', 'pending').select('id')

        if (updated && updated.length > 0) {
          const { triggerOrderNotification } = await import('@/app/actions/notifications')
          await triggerOrderNotification(order.id, 'placed')
          await triggerOrderNotification(order.id, 'payment_captured')
        }
      } else if (!order) {
        // Check if it's a booking
        const { data: booking } = await supabase.from('bookings').select('id, payment_status').eq('id', orderId).maybeSingle()
        if (booking && booking.payment_status === 'pending') {
          const { data: updated } = await supabase.from('bookings').update({
            payment_status: 'captured',
            status: 'confirmed',
          }).eq('id', booking.id).eq('payment_status', 'pending').select('id')

          if (updated && updated.length > 0) {
            const { triggerBookingNotification } = await import('@/app/actions/notifications')
            await triggerBookingNotification(booking.id)
          }
        }
      }
    }

    return NextResponse.json({
      state: status.state,
      orderId: status.orderId,
      merchantOrderId: status.merchantOrderId,
      amount: status.amount,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch payment status'
    console.error('PhonePe status error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
