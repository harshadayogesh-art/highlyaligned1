import { createClient } from '@supabase/supabase-js'

/**
 * Returns a Supabase service-role client.
 * @param reason - Human-readable reason for using the service client (logged for audit)
 */
export function getServiceClient(reason: string) {
  if (!reason || typeof reason !== 'string') {
    throw new Error('getServiceClient requires a reason string for auditability')
  }
  console.warn(`[SERVICE_CLIENT] Used for: ${reason}`)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase service-role credentials are not configured')
  }
  return createClient(url, key)
}
