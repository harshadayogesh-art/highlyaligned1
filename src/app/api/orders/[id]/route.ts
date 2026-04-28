import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const { data: order, error } = await supabaseAdmin
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

    const body = await req.json()
    const { status, extra } = body

    const update: Record<string, unknown> = { updated_at: new Date().toISOString(), ...extra }
    if (status) {
      update.status = status
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Order status update error:', error)
      return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ success: true, order })
  } catch (err) {
    console.error('Patch order API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
