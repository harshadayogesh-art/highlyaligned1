import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { logAudit, logOrderStatus } from '@/lib/audit'

const patchBodySchema = z.object({
  status: z.string().optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
})

function getAdmin() {
  return getServiceClient('orders-id-route')
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const { data: order, error } = await getAdmin()
      .from('orders')
      .select(
        '*, profiles(name, email, phone), order_items(*, products(name, images))'
      )
      .eq('id', id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (err) {
    console.error('Get order API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Authenticate admin
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor', 'support'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const rl = rateLimit(`order-update:${ip}`, 30, 60 * 1000)
    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please slow down.' }, { status: 429 })
    }

    const rawBody = await req.json()
    const parsed = patchBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { status, extra } = parsed.data

    // Fetch current order for status history
    const { data: currentOrder } = await getAdmin()
      .from('orders')
      .select('status')
      .eq('id', id)
      .single()

    const update: Record<string, unknown> = { updated_at: new Date().toISOString(), ...extra }
    if (status) {
      update.status = status
    }

    const { data: order, error } = await getAdmin()
      .from('orders')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Order status update error:', error)
      return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 })
    }

    // Log order status change
    if (status && currentOrder) {
      await logOrderStatus({
        orderId: id,
        status,
        previousStatus: currentOrder.status,
        changedBy: user.id,
        changedByName: user.email || '',
        notes: extra?.admin_notes as string || undefined,
        extra: extra || {},
      })
    }

    // Log audit trail
    await logAudit({
      userId: user.id,
      userEmail: user.email || '',
      action: 'UPDATE',
      tableName: 'orders',
      recordId: id,
      oldData: currentOrder ? { status: currentOrder.status } : undefined,
      newData: { status, ...extra },
      ipAddress: ip,
    })

    return NextResponse.json({ success: true, order })
  } catch (err) {
    console.error('Patch order API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
