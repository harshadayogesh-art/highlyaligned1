import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured')
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

export async function POST(req: Request) {
  try {
    const { amount, currency = 'INR', receipt } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const amountInPaise = Math.round(amount * 100)
    if (amountInPaise < 100) {
      return NextResponse.json({ error: 'Amount must be at least Rs.1' }, { status: 400 })
    }

    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt ? receipt.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) : undefined,
      notes: { source: 'highlyaligned' },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (err: any) {
    console.error('Razorpay create order error:', err)
    const msg = err?.error?.description || err?.message || 'Failed to create payment order'
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}
