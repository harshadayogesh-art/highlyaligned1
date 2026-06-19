import { NextResponse } from 'next/server'
import { initiatePhonePePayment } from '@/lib/phonepe'

export async function POST(req: Request) {
  try {
    const { orderId, amountInPaise, mobileNumber } = await req.json()

    if (!orderId || !amountInPaise) {
      return NextResponse.json({ error: 'Missing orderId or amountInPaise' }, { status: 400 })
    }

    if (amountInPaise < 100) {
      return NextResponse.json({ error: 'Amount must be at least ₹1' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectUrl = `${siteUrl}/payment-redirect?orderId=${orderId}`

    const phonePeRedirectUrl = await initiatePhonePePayment({
      merchantOrderId: orderId,
      amountInPaise,
      redirectUrl,
      mobileNumber,
    })

    return NextResponse.json({ redirectUrl: phonePeRedirectUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to initiate PhonePe payment'
    console.error('PhonePe initiate error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
