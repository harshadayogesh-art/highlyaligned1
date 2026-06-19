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

    if (!merchantOrderId || state !== 'COMPLETED') {
      // Not a completed payment — acknowledge and ignore
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
      await supabase
        .from('orders')
        .update({
          payment_status: 'captured',
          phonepe_payment_id: transactionId ?? null,
          status: 'accepted',
        })
        .eq('id', order.id)

      await triggerOrderNotification(order.id, 'placed')
      return new Response('OK')
    }

    // Try to match bookings table
    const { data: booking } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', merchantOrderId)
      .maybeSingle()

    if (booking) {
      await supabase
        .from('bookings')
        .update({
          payment_status: 'captured',
          status: 'confirmed',
        })
        .eq('id', booking.id)

      await triggerBookingNotification(booking.id)
    }

    return new Response('OK')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Callback handling failed'
    console.error('PhonePe callback error:', message)
    return new Response('Internal Server Error', { status: 500 })
  }
}
