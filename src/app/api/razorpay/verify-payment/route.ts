import { createClient } from '@/lib/supabase/server'
import { triggerOrderNotification, triggerBookingNotification } from '@/app/actions/notifications'
import crypto from 'crypto'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderId,
      bookingId,
    } = await req.json()

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 })
    }

    if (!orderId && !bookingId) {
      return NextResponse.json({ error: 'Missing orderId or bookingId' }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Razorpay secret not configured' }, { status: 500 })
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const supabase = await createClient()

    if (orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('id, razorpay_order_id')
        .eq('id', orderId)
        .maybeSingle()

      if (!order || order.razorpay_order_id !== razorpay_order_id) {
        return NextResponse.json({ error: 'Order not found or payment mismatch' }, { status: 400 })
      }

      await supabase
        .from('orders')
        .update({
          payment_status: 'captured',
          razorpay_payment_id,
          razorpay_order_id,
          status: 'accepted',
        })
        .eq('id', orderId)

      await triggerOrderNotification(orderId, 'placed')
    }

    if (bookingId) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('id, razorpay_order_id')
        .eq('id', bookingId)
        .maybeSingle()

      if (!booking || booking.razorpay_order_id !== razorpay_order_id) {
        return NextResponse.json({ error: 'Booking not found or payment mismatch' }, { status: 400 })
      }

      await supabase
        .from('bookings')
        .update({
          payment_status: 'captured',
          razorpay_payment_id,
          razorpay_order_id,
          status: 'confirmed',
        })
        .eq('id', bookingId)

      await triggerBookingNotification(bookingId)
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment verification failed'
    console.error('Razorpay verify payment error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
