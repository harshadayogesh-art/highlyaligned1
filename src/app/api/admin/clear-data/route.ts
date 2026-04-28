import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'

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

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { tables } = body as { tables: string[] }

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json({ error: 'No tables selected' }, { status: 400 })
    }

    const results: Record<string, { success: boolean; count?: number; error?: string }> = {}

    for (const table of tables) {
      if (!ALLOWED_TABLES.includes(table)) {
        results[table] = { success: false, error: 'Invalid table name' }
        continue
      }

      try {
        const { error, count } = await supabaseService
          .from(table)
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (error) {
          results[table] = { success: false, error: error.message }
        } else {
          results[table] = { success: true, count: count || 0 }
        }
      } catch (err: any) {
        results[table] = { success: false, error: err.message }
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    console.error('Clear data error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
