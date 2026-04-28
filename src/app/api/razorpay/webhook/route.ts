import { createClient } from '@/lib/supabase/server'
import { triggerOrderNotification, triggerBookingNotification } from '@/app/actions/notifications'
import crypto from 'crypto'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
    return new Response('Missing signature or secret', { status: 400 })
  }

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(body)

  if (event.event === 'payment.captured') {
    const supabase = await createClient()
    const payment = event.payload.payment.entity

    await supabase
      .from('orders')
      .update({
        payment_status: 'captured',
        razorpay_payment_id: payment.id,
        status: 'accepted',
      })
      .eq('razorpay_order_id', payment.order_id)

    await supabase
      .from('bookings')
      .update({
        payment_status: 'captured',
        status: 'confirmed',
      })
      .eq('razorpay_order_id', payment.order_id)

    // Find the order id
    const { data: order } = await supabase.from('orders').select('id').eq('razorpay_order_id', payment.order_id).single()
    if (order) await triggerOrderNotification(order.id, 'placed')

    const { data: booking } = await supabase.from('bookings').select('id').eq('razorpay_order_id', payment.order_id).single()
    if (booking) await triggerBookingNotification(booking.id)
  }

  return new Response('OK')
}
