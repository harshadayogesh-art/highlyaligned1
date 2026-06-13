'use server'

import { createClient } from '@supabase/supabase-js'

export async function forceDeleteProducts(ids: string[]) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 1. Forcefully remove product references from order_items
  const { error: oiError } = await supabase
    .from('order_items')
    .update({ product_id: null })
    .in('product_id', ids)

  if (oiError) throw new Error('Failed to unlink from orders: ' + oiError.message)

  // 2. Delete the products
  const { error: delError } = await supabase
    .from('products')
    .delete()
    .in('id', ids)

  if (delError) throw new Error('Failed to delete product: ' + delError.message)

  return { success: true }
}
