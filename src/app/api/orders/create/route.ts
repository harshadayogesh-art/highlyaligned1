import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured')
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items, address, paymentMode, couponCode, customerId } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }
    if (!address || !paymentMode) {
      return NextResponse.json({ error: 'Missing address or payment mode' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch products from DB to get current prices and stock
    const productIds = items.map((i: { productId: string }) => i.productId)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, mrp, stock, gst_applicable, gst_rate, status')
      .in('id', productIds)

    if (productsError || !products) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    const productMap = new Map(products.map((p) => [p.id, p]))

    // 2. Validate stock and calculate totals
    let subtotal = 0
    let gstAmount = 0
    let savings = 0
    const orderItems = []

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

    // 3. Calculate shipping
    const shipping = subtotal >= 999 ? 0 : 50

    // 4. Validate and apply coupon server-side
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

    // 5. Fetch GST config for CGST/SGST/IGST split
    const { data: gstSettings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'gst_config')
      .single()
    const gstConfig = (gstSettings?.value as Record<string, unknown>) || {}
    const sellerStateCode = String(gstConfig.state_code || '07')
    const buyerState = String(address?.state || address?.city || '').trim()
    const buyerStateCode = buyerState ? buyerState.substring(0, 2) : sellerStateCode

    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0
    if (gstAmount > 0) {
      if (sellerStateCode === buyerStateCode) {
        cgstAmount = Math.round((gstAmount / 2) * 100) / 100
        sgstAmount = Math.round((gstAmount / 2) * 100) / 100
      } else {
        igstAmount = gstAmount
      }
    }

    // 6. Calculate final total
    const finalTotal = Math.max(0, subtotal + shipping + gstAmount - discount)

    // 7. Generate order number
    const orderNumber = `HA-${Date.now()}`

    // 8. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId || null,
        status: 'pending',
        subtotal,
        gst_amount: gstAmount,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        discount_amount: discount,
        coupon_code: appliedCouponCode,
        shipping_amount: shipping,
        final_total: finalTotal,
        payment_mode: paymentMode,
        payment_status: 'pending',
        shipping_address: address,
        place_of_supply: buyerState,
        gst_enabled_at_checkout: gstAmount > 0,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: orderError?.message || 'Failed to create order' }, { status: 500 })
    }

    // 9. Create order items
    const { error: itemsError } = await supabase.from('order_items').insert(
      orderItems.map((oi) => ({ ...oi, order_id: order.id }))
    )

    if (itemsError) {
      console.error('Order items error:', itemsError)
    }

    // 8b. Increment coupon usage count if applicable
    if (appliedCouponCode) {
      try {
        const { data: cdata } = await supabase
          .from('coupons')
          .select('usage_count')
          .eq('code', appliedCouponCode)
          .single()
        if (cdata) {
          await supabase
            .from('coupons')
            .update({ usage_count: (cdata.usage_count || 0) + 1 })
            .eq('code', appliedCouponCode)
        }
      } catch (err) {
        console.error('Coupon usage increment error:', err)
      }
    }

    // 10. If online payment, create Razorpay order
    let razorpayOrderId: string | null = null
    let razorpayAmount: number | null = null
    if (paymentMode === 'online') {
      try {
        razorpayAmount = Math.round(finalTotal * 100)
        if (razorpayAmount < 100) {
          return NextResponse.json(
            { error: 'Order total must be at least Rs.1 for online payment' },
            { status: 400 }
          )
        }
        const razorpay = getRazorpay()
        const rzpOrder = await razorpay.orders.create({
          amount: razorpayAmount,
          currency: 'INR',
          receipt: orderNumber.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40),
          notes: { source: 'highlyaligned', order_id: order.id },
        })
        razorpayOrderId = rzpOrder.id

        await supabase.from('orders').update({
          razorpay_order_id: rzpOrder.id,
        }).eq('id', order.id)
      } catch (rzpErr: any) {
        console.error('Razorpay order creation error:', rzpErr)
        const msg = rzpErr?.error?.description || rzpErr?.message || 'Failed to create payment order'
        return NextResponse.json(
          { error: msg, orderId: order.id },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      subtotal,
      shipping,
      gstAmount,
      discount,
      finalTotal,
      razorpayOrderId,
      razorpayAmount,
      paymentMode,
    })
  } catch (err) {
    console.error('Create order API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
