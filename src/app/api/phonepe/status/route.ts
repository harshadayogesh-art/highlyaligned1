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
