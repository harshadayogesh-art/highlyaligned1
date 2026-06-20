import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { initiatePhonePePayment } from '@/lib/phonepe'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const supabase = getServiceClient('retry-payment-email-link')
    
    // Fetch the order to verify it's still pending
    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_status, payment_mode, final_total')
      .eq('id', orderId)
      .maybeSingle()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.payment_status === 'captured' || order.payment_status === 'collected') {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      // Already paid, redirect to success page
      return NextResponse.redirect(`${siteUrl}/order-success?order_id=${order.id}`)
    }

    if (order.payment_mode !== 'online') {
      return NextResponse.json({ error: 'This order does not require online payment' }, { status: 400 })
    }

    const amountInPaise = Math.round(order.final_total * 100)
    if (amountInPaise < 100) {
      return NextResponse.json({ error: 'Amount must be at least ₹1' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectUrl = `${siteUrl}/payment-redirect?orderId=${order.id}`

    // Re-initiate PhonePe payment for the existing order
    const phonePeRedirectUrl = await initiatePhonePePayment({
      merchantOrderId: order.id,
      amountInPaise,
      redirectUrl,
    })

    if (!phonePeRedirectUrl) {
      throw new Error('Failed to generate PhonePe URL')
    }

    // Immediately redirect the user to the PhonePe checkout page
    return NextResponse.redirect(phonePeRedirectUrl)
  } catch (err: unknown) {
    console.error('PhonePe retry error:', err)
    // If it fails, redirect them to the generic checkout with an error message
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${siteUrl}/checkout?error=retry_failed`)
  }
}
