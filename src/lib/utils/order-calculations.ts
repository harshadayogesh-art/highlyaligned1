import { useCartStore } from '@/stores/cart-store'

export function calculateOrderTotals(items: ReturnType<typeof useCartStore.getState>['items'], gstEnabled = false, gstRate = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalMrp = items.reduce((sum, item) => sum + item.mrp * item.quantity, 0)
  const shipping = subtotal >= 999 ? 0 : 50

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
