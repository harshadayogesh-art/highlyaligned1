/**
 * Server-side audit logging utilities.
 * Use these in API routes to record admin actions.
 */

import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'

interface AuditPayload {
  userId: string
  userEmail?: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT'
  tableName: string
  recordId?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  ipAddress?: string
}

export async function logAudit(payload: AuditPayload) {
  try {
    const service = getServiceClient('audit-log')
    await service.from('audit_logs').insert({
      user_id: payload.userId,
      user_email: payload.userEmail,
      action: payload.action,
      table_name: payload.tableName,
      record_id: payload.recordId,
      old_data: payload.oldData,
      new_data: payload.newData,
      ip_address: payload.ipAddress,
    })
  } catch (err) {
    // Audit logging should never break the main operation
    console.error('[AUDIT] Failed to log:', err)
  }
}

interface OrderStatusPayload {
  orderId: string
  status: string
  previousStatus?: string | null
  changedBy: string
  changedByName?: string
  notes?: string
  extra?: Record<string, unknown>
}

export async function logOrderStatus(payload: OrderStatusPayload) {
  try {
    const service = getServiceClient('order-status-history')
    await service.from('order_status_history').insert({
      order_id: payload.orderId,
      status: payload.status,
      previous_status: payload.previousStatus,
      changed_by: payload.changedBy,
      changed_by_name: payload.changedByName,
      notes: payload.notes,
      extra: payload.extra,
    })
  } catch (err) {
    console.error('[ORDER_STATUS] Failed to log:', err)
  }
}

export async function getCurrentUser(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, role')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email || profile?.email || '',
    name: profile?.name || '',
    role: profile?.role || 'customer',
  }
}
