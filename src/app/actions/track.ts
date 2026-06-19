'use server'

import { createClient } from '@supabase/supabase-js'

export async function trackOrder(orderNumber: string, emailOrPhone: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const cleanOrderNumber = orderNumber.trim().replace(/^#/, '')

    // Find the order by order number (bypassing RLS with service role key)
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, profiles(email, phone), order_items(*, products(name, images))')
      .ilike('order_number', cleanOrderNumber)
      .single()

    if (error || !order) {
      return { error: 'Order not found with that number.' }
    }

    // Verify ownership
    const searchVal = emailOrPhone.trim().toLowerCase()
    
    const profileEmail = order.profiles?.email?.toLowerCase() || ''
    const profilePhone = order.profiles?.phone?.toLowerCase() || ''
    
    const shippingAddress = order.shipping_address as Record<string, any> | null
    const shippingEmail = shippingAddress?.email?.toLowerCase() || ''
    const shippingPhone = shippingAddress?.phone?.toLowerCase() || ''

    const isMatch = [profileEmail, profilePhone, shippingEmail, shippingPhone].some(
      (val) => val && val === searchVal
    )

    if (!isMatch) {
      return { error: 'Order found, but the provided email/phone does not match our records.' }
    }

    // Don't send everything to the client, just what's needed for tracking
    return {
      success: true,
      order: {
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
        payment_mode: order.payment_mode,
        payment_status: order.payment_status,
        final_total: order.final_total,
        courier_name: order.courier_name,
        tracking_id: order.tracking_id,
        shipping_label_url: order.shipping_label_url,
        items: order.order_items?.map((item: any) => ({
          name: item.products?.name,
          quantity: item.quantity,
          image: item.products?.images?.[0] || null,
        })) || []
      }
    }
  } catch (err: unknown) {
    console.error('Track order error:', err)
    return { error: 'Failed to track order. Please try again later.' }
  }
}
