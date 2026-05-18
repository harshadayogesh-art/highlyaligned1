import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = ['admin', 'editor', 'support'].includes(profile?.role)
  if (!isAdmin) {
    // Non-admin can only view their own order's history
    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', id)
      .single()
    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const service = getServiceClient('order-status-history')
  const { data, error } = await service
    .from('order_status_history')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // Fetch names of users who made changes
  const userIds = [...new Set(data?.map((d) => d.user_id).filter(Boolean) || [])]
  let profilesMap = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await service
      .from('profiles')
      .select('id, name')
      .in('id', userIds)
    profiles?.forEach((p) => profilesMap.set(p.id, p.name))
  }

  const history = data?.map((entry) => ({
    ...entry,
    changed_by_name: profilesMap.get(entry.user_id) || null,
  }))

  return NextResponse.json({ history: history || [] })
}
