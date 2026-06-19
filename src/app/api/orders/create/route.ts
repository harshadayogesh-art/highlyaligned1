import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initiatePhonePePayment } from '@/lib/phonepe'
import { z } from 'zod'
import { getServiceClient } from '@/lib/supabase/service'

const STATE_TO_GST_CODE: Record<string, string> = {
  'Andhra Pradesh': '37',
  'Assam': '18',
  'Bihar': '10',
  'Chhattisgarh': '22',
  'Delhi': '07',
  'Goa': '30',
  'Gujarat': '24',
  'Haryana': '06',
  'Himachal Pradesh': '02',
  'Jharkhand': '20',
  'Karnataka': '29',
  'Kerala': '32',
  'Madhya Pradesh': '23',
  'Maharashtra': '27',
  'Manipur': '14',
  'Meghalaya': '17',
  'Mizoram': '15',
  'Nagaland': '13',
  'Odisha': '21',
  'Punjab': '03',
  'Rajasthan': '08',
  'Sikkim': '11',
  'Tamil Nadu': '33',
  'Telangana': '36',
  'Tripura': '16',
  'Uttar Pradesh': '09',
  'Uttarakhand': '05',
  'West Bengal': '19',
  'Andaman and Nicobar Islands': '35',
  'Chandigarh': '04',
  'Dadra and Nagar Haveli and Daman and Diu': '26',
  'Jammu and Kashmir': '01',
  'Ladakh': '38',
  'Lakshadweep': '31',
  'Puducherry': '34',
}

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
})

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  address: z.object({
    name: z.string().min(1),
    phone: z.string().regex(/^[6-9]\d{9}$/),
    email: z.string().email(),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/),
    landmark: z.string().optional(),
  }),
  paymentMode: z.enum(['online', 'cod']),
  couponCode: z.string().optional().nullable(),
  idempotencyKey: z.string().uuid().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { items, address, paymentMode, couponCode, idempotencyKey } = parsed.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const customerId = user?.id ?? null

    if (idempotencyKey) {
      try {
        const { data: existing } = await supabase
          .from('orders')
          .select('id')
          .eq('idempotency_key', idempotencyKey)
          .maybeSingle()
        if (existing) {
          return NextResponse.json({ orderId: existing.id, idempotencyKey })
        }
      } catch {
        // Column may not exist yet — continue with order creation
      }
    }

    const productIds = items.map((i) => i.productId)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, mrp, stock, gst_applicable, gst_rate, status')
      .in('id', productIds)

    if (productsError || !products) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    const productMap = new Map(products.map((p) => [p.id, p]))

    let subtotal = 0
    let gstAmount = 0
    let savings = 0
    const orderItems = []
    const stockRollback: { id: string; qty: number }[] = []

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      }
      if (product.status === 'out_of_stock' || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `${product.name} is out of stock or insufficient quantity` },
          { status: 400 }
        )
      }

      const itemTotal = product.price * item.quantity
      const itemMrpTotal = product.mrp * item.quantity
      subtotal += itemTotal
      savings += itemMrpTotal - itemTotal

      if (product.gst_applicable && product.gst_rate) {
        gstAmount += itemTotal * (product.gst_rate / 100)
      }

      orderItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
        gst_rate: product.gst_applicable ? product.gst_rate : 0,
        gst_amount: product.gst_applicable ? itemTotal * (product.gst_rate / 100) : 0,
      })
    }

    const service = getServiceClient('orders-create-stock')

    for (const item of items) {
      const product = productMap.get(item.productId)!
      const { data: updated } = await service
        .from('products')
        .update({ stock: product.stock - item.quantity })
        .eq('id', product.id)
        .gte('stock', item.quantity)
        .select('stock')
        .single()

      if (!updated) {
        for (const rb of stockRollback) {
          const p = productMap.get(rb.id)!
          await service.from('products').update({ stock: p.stock }).eq('id', rb.id)
        }
        return NextResponse.json({ error: 'Stock changed during checkout. Please try again.' }, { status: 409 })
      }
      stockRollback.push({ id: product.id, qty: item.quantity })
    }

    const shipping = subtotal >= 999 ? 0 : 50  // will be overridden below after fetching settings

    let discount = 0
    let appliedCouponCode: string | null = null

    if (couponCode) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (!couponError && coupon) {
        const now = new Date()
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null
        const validTo = coupon.valid_to ? new Date(coupon.valid_to) : null

        const isValid =
          (!validFrom || validFrom <= now) &&
          (!validTo || validTo >= now) &&
          (coupon.max_uses === null || coupon.usage_count < coupon.max_uses) &&
          subtotal >= coupon.min_order_amount

        if (isValid) {
          if (coupon.type === 'percentage') {
            discount = subtotal * (coupon.value / 100)
          } else if (coupon.type === 'fixed') {
            discount = Math.min(coupon.value, subtotal)
          } else if (coupon.type === 'free_shipping') {
            discount = shipping
          }
          appliedCouponCode = coupon.code
        }
      }
    }

    const { data: gstSettings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'gst_config')
      .single()
    const gstConfig = (gstSettings?.value as Record<string, unknown>) || {}
    const sellerStateCode = String(gstConfig.state_code || '07')
    const buyerStateCode = STATE_TO_GST_CODE[address.state] ?? sellerStateCode

    // Fetch cod_enabled setting
    const { data: codSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'cod_enabled')
      .maybeSingle()
    const codEnabled = (codSetting?.value as boolean) ?? true

    if (paymentMode === 'cod' && !codEnabled) {
      return NextResponse.json({ error: 'Cash on Delivery is currently not available' }, { status: 400 })
    }

    // Fetch delivery_config setting
    const { data: deliverySetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'delivery_config')
      .maybeSingle()
    const deliveryConfig = deliverySetting?.value as { enabled?: boolean; charge?: number; free_above?: number } | null

    // Compute actual shipping from settings
    let actualShipping: number
    if (deliveryConfig) {
      if (deliveryConfig.enabled === false) {
        actualShipping = 0
      } else {
        const freeAbove = deliveryConfig.free_above ?? 999
        const charge = deliveryConfig.charge ?? 50
        actualShipping = subtotal >= freeAbove ? 0 : charge
      }
    } else {
      actualShipping = subtotal >= 999 ? 0 : 50
    }
    // Override the initial shipping variable
    const resolvedShipping = actualShipping

    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0
    if (gstAmount > 0) {
      if (sellerStateCode === buyerStateCode) {
        cgstAmount = Math.round((gstAmount / 2) * 100) / 100
        sgstAmount = Math.round((gstAmount / 2) * 100) / 100
      } else {
        igstAmount = gstAmount
      }
    }

    const finalTotal = Math.max(0, subtotal + resolvedShipping + gstAmount - discount)
    const orderNumber = `HA-${Date.now()}`

    const insertPayload: Record<string, unknown> = {
      order_number: orderNumber,
      customer_id: customerId,
      status: 'pending',
      subtotal,
      gst_amount: gstAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      discount_amount: discount,
      coupon_code: appliedCouponCode,
      shipping_amount: resolvedShipping,
      final_total: finalTotal,
      payment_mode: paymentMode,
      payment_status: 'pending',
      shipping_address: address,
      place_of_supply: address.state,
      gst_enabled_at_checkout: gstAmount > 0,
    }

    if (idempotencyKey) {
      insertPayload.idempotency_key = idempotencyKey
    }

    let orderResult = await service
      .from('orders')
      .insert(insertPayload)
      .select()
      .single()

    // If idempotency_key column doesn't exist yet, retry without it
    if (orderResult.error && idempotencyKey && orderResult.error.message?.includes('idempotency_key')) {
      const { idempotency_key, ...payloadWithoutIdempotency } = insertPayload
      orderResult = await service
        .from('orders')
        .insert(payloadWithoutIdempotency)
        .select()
        .single()
    }

    const { data: order, error: orderError } = orderResult

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: orderError?.message || 'Failed to create order' }, { status: 500 })
    }

    const { error: itemsError } = await service.from('order_items').insert(
      orderItems.map((oi) => ({ ...oi, order_id: order.id }))
    )

    if (itemsError) {
      console.error('Order items error:', itemsError)
    }

    if (appliedCouponCode) {
      try {
        const service = getServiceClient('orders-create-coupon-increment')
        const { data: couponRow } = await service
          .from('coupons')
          .select('usage_count')
          .eq('code', appliedCouponCode)
          .single()

        if (couponRow) {
          const { error: incError } = await service
            .from('coupons')
            .update({ usage_count: (couponRow.usage_count || 0) + 1 })
            .eq('code', appliedCouponCode)
            .eq('usage_count', couponRow.usage_count || 0)

          if (incError) {
            console.error('Coupon race condition (safe to ignore if another request won):', incError)
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('Coupon usage increment error:', message)
      }
    }

    let phonePeRedirectUrl: string | null = null
    if (paymentMode === 'online') {
      try {
        const amountInPaise = Math.round(finalTotal * 100)
        if (amountInPaise < 100) {
          return NextResponse.json(
            { error: 'Order total must be at least ₹1 for online payment' },
            { status: 400 }
          )
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const redirectUrl = `${siteUrl}/payment-redirect?orderId=${order.id}`

        phonePeRedirectUrl = await initiatePhonePePayment({
          merchantOrderId: order.id,
          amountInPaise,
          redirectUrl,
        })
      } catch (err: unknown) {
        const ppErr = err as { message?: string }
        console.error('PhonePe payment initiation error:', err)
        const msg = ppErr?.message || 'Failed to initiate payment'
        return NextResponse.json({ error: msg, orderId: order.id }, { status: 500 })
      }
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      subtotal,
      shipping: resolvedShipping,
      gstAmount,
      discount,
      finalTotal,
      phonePeRedirectUrl,
      paymentMode,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Create order API error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
