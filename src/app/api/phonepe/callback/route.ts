import { createClient } from '@/lib/supabase/server'
import { triggerOrderNotification, triggerBookingNotification } from '@/app/actions/notifications'
import { getPhonePeClient } from '@/lib/phonepe'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const authorization = req.headers.get('authorization') ?? ''

    const username = process.env.PHONEPE_CALLBACK_USERNAME ?? ''
    const password = process.env.PHONEPE_CALLBACK_PASSWORD ?? ''

    if (!username || !password) {
      console.warn('PhonePe callback credentials not configured; skipping signature validation')
    } else {
      const client = getPhonePeClient()
      try {
        client.validateCallback(username, password, authorization, body)
      } catch {
        console.error('PhonePe callback validation failed')
        return new Response('Invalid callback signature', { status: 400 })
      }
    }

    const event = JSON.parse(body) as {
      type?: string
      payload?: {
        orderId?: string
        merchantOrderId?: string
        state?: string
        paymentDetails?: Array<{ transactionId?: string }>
      }
    }

    const merchantOrderId = event?.payload?.merchantOrderId
    const state = event?.payload?.state
    const transactionId = event?.payload?.paymentDetails?.[0]?.transactionId

    if (!merchantOrderId || (state !== 'COMPLETED' && state !== 'FAILED')) {
      // Not a completed or failed payment — acknowledge and ignore
      return new Response('OK')
    }

    const supabase = await createClient()

    // Try to match orders table
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('id', merchantOrderId)
      .maybeSingle()

    if (order) {
      if (state === 'FAILED') {
        const { data: updated } = await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
          })
          .eq('id', order.id)
          .eq('payment_status', 'pending')
          .select('id')

        if (updated && updated.length > 0) {
          await triggerOrderNotification(order.id, 'payment_failed')
        }
        return new Response('OK')
      }

      const { data: updated } = await supabase
        .from('orders')
        .update({
          payment_status: 'captured',
          razorpay_payment_id: transactionId ?? null,
          status: 'accepted',
        })
        .eq('id', order.id)
        .eq('payment_status', 'pending')
        .select('id')

      if (updated && updated.length > 0) {
        await triggerOrderNotification(order.id, 'placed')
        await triggerOrderNotification(order.id, 'payment_captured')
      } else if (transactionId) {
        // Ensure transaction ID is recorded even if state was already updated
        await supabase
          .from('orders')
          .update({ razorpay_payment_id: transactionId })
          .eq('id', order.id)
          .is('razorpay_payment_id', null)
      }
      
      return new Response('OK')
    }

    // Try to match bookings table
    const { data: booking } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', merchantOrderId)
      .maybeSingle()

    if (booking) {
      if (state === 'FAILED') {
        await supabase
          .from('bookings')
          .update({ payment_status: 'failed' })
          .eq('id', booking.id)
          .eq('payment_status', 'pending')
        return new Response('OK')
      }

      const { data: updated } = await supabase
        .from('bookings')
        .update({
          payment_status: 'captured',
          status: 'confirmed',
        })
        .eq('id', booking.id)
        .eq('payment_status', 'pending')
        .select('id')

      if (updated && updated.length > 0) {
        await triggerBookingNotification(booking.id)
      }
      return new Response('OK')
    }

    return new Response('OK')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Callback handling failed'
    console.error('PhonePe callback error:', message)
    return new Response('Internal Server Error', { status: 500 })
  }
}
