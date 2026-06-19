import { useCartStore } from '@/stores/cart-store'

export interface DeliveryConfig {
  enabled: boolean
  charge: number
  free_above: number
}

export function calculateOrderTotals(
  items: ReturnType<typeof useCartStore.getState>['items'],
  gstEnabled = false,
  gstRate = 0,
  deliveryConfig?: DeliveryConfig,
) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalMrp = items.reduce((sum, item) => sum + item.mrp * item.quantity, 0)

  // Delivery charge: if config provided use it, else fall back to legacy behaviour
  let shipping: number
  if (deliveryConfig) {
    if (!deliveryConfig.enabled) {
      shipping = 0
    } else {
      shipping = subtotal >= deliveryConfig.free_above ? 0 : deliveryConfig.charge
    }
  } else {
    shipping = subtotal >= 999 ? 0 : 50
  }

  let gstAmount = 0
  if (gstEnabled) {
    gstAmount = items.reduce((sum, item) => {
      const itemGst = (item.price * item.quantity * gstRate) / 100
      return sum + itemGst
    }, 0)
  }

  const finalTotal = subtotal + shipping + gstAmount

  return {
    subtotal,
    totalMrp,
    shipping,
    gstAmount,
    finalTotal,
    savings: totalMrp - subtotal,
  }
}
