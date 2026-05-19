import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'

import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

const clearDataSchema = z.object({
  tables: z.array(z.string().min(1)).min(1),
})

const ALLOWED_TABLES = [
  'order_items',
  'orders',
  'bookings',
  'remedies',
  'influencer_commissions',
  'influencers',
  'referrals',
  'leads',
  'coupons',
  'blog_posts',
  'page_blocks',
]

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const rl = rateLimit(`clear-data:${ip}`, 3, 60 * 60 * 1000)
    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Max 3 attempts per hour.' }, { status: 429 })
    }

    const rawBody = await req.json()
    const parsed = clearDataSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { tables } = parsed.data

    const service = getServiceClient('admin-clear-data')
    const results: Record<string, { success: boolean; count?: number; error?: string }> = {}

    // Define deletion order: child tables must be deleted BEFORE parent tables
    // to avoid foreign key constraint violations.
    const deletionOrder = [
      'order_items',   // child of orders
      'remedies',      // child of bookings
      'influencer_commissions', // child of influencers
      'orders',
      'bookings',
      'influencers',
      'referrals',
      'leads',
      'coupons',
      'blog_posts',
      'page_blocks',
    ]

    // Sort requested tables by dependency order
    const sortedTables = tables
      .filter((t) => ALLOWED_TABLES.includes(t))
      .sort((a, b) => deletionOrder.indexOf(a) - deletionOrder.indexOf(b))

    // Reject invalid tables first
    for (const table of tables) {
      if (!ALLOWED_TABLES.includes(table)) {
        results[table] = { success: false, error: 'Invalid table name' }
      }
    }

    for (const table of sortedTables) {
      try {
        const { error, count } = await service
          .from(table)
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (error) {
          results[table] = { success: false, error: error.message }
        } else {
          results[table] = { success: true, count: count || 0 }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        results[table] = { success: false, error: message }
      }
    }

    // Log audit trail
    await logAudit({
      userId: user.id,
      userEmail: user.email || '',
      action: 'DELETE',
      tableName: tables.join(', '),
      recordId: undefined,
      oldData: { tables, results },
      newData: { cleared: true },
      ipAddress: ip,
    })

    return NextResponse.json({ success: true, results })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Clear data error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
