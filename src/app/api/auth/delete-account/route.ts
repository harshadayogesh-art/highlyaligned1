import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = getServiceClient('delete-account')

    // 1. Anonymize user-created records (set customer_id to NULL)
    // to avoid foreign key constraint violations when profile is deleted.
    const tablesToAnonymize = [
      'orders',
      'bookings',
      'referrals',
      'remedies',
      'remedy_logs',
    ]

    for (const table of tablesToAnonymize) {
      const { error } = await service
        .from(table)
        .update({ customer_id: null })
        .eq('customer_id', user.id)

      if (error) {
        console.error(`Failed to anonymize ${table}:`, error)
      }
    }

    // 2. Delete user's leads
    await service.from('leads').delete().eq('converted_to_customer_id', user.id)

    // 3. Delete auth user (cascades to profiles and addresses via FK on delete cascade)
    const { error: deleteError } = await service.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Auth delete error:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Delete account error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
