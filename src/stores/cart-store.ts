import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  name: string
  image: string
  price: number
  mrp: number
  quantity: number
  maxStock: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  totalMrp: () => number
  itemCount: () => number
  shipping: () => number
  finalTotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            const newQty = Math.min(existing.quantity + qty, item.maxStock)
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: newQty } : i
              ),
            }
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(qty, item.maxStock) }],
          }
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      updateQty: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.productId !== productId) }
          }
          const item = state.items.find((i) => i.productId === productId)
          const max = item?.maxStock ?? quantity
          return {
            items: state.items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.min(quantity, max) }
                : i
            ),
          }
        }),
      clearCart: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      totalMrp: () =>
        get().items.reduce((sum, i) => sum + i.mrp * i.quantity, 0),
      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
      shipping: () => {
        const t = get().total()
        return t >= 999 ? 0 : 50
      },
      finalTotal: () => {
        const g = get()
        return g.total() + g.shipping()
      },
    }),
    {
      name: 'highlyaligned-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
