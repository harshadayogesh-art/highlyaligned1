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
      await supabase
        .from('bookings')
        .update({
          payment_status: 'captured',
          razorpay_payment_id,
          razorpay_order_id,
          status: 'confirmed',
        })
        .eq('id', bookingId)

      const { data: booking } = await supabase
        .from('bookings')
        .select('id')
        .eq('id', bookingId)
        .single()
      if (booking) await triggerBookingNotification(booking.id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Razorpay verify payment error:', err)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
