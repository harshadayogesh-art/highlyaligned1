'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCartStore } from '@/stores/cart-store'
import { Minus, Plus, Trash2, ShoppingBag, X } from 'lucide-react'

interface MiniCartProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MiniCart({ open, onOpenChange }: MiniCartProps) {
  const items = useCartStore((s) => s.items)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const total = useCartStore((s) => s.total())
  const shipping = useCartStore((s) => s.shipping())
  const finalTotal = useCartStore((s) => s.finalTotal())
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold text-slate-900">
              Your Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-slate-300" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium text-slate-900">Your cart is empty</p>
              <p className="text-sm text-slate-500">Add something sacred to your cart</p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-[#f59e0b] text-slate-900 hover:bg-amber-50"
              asChild
            >
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 pb-4 border-b border-slate-50 last:border-0">
                  <div className="relative w-[60px] h-[60px] rounded-lg bg-slate-50 overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="60px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
                      {item.name}
                    </p>
                    <p className="text-sm text-emerald-600 font-semibold mt-0.5">
                      ₹{item.price}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.productId, item.quantity - 1)}
                          className="w-9 h-9 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.productId, item.quantity + 1)}
                          className="w-9 h-9 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-slate-400 hover:text-red-500 self-start p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-slate-100 px-4 py-4 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Link href="/checkout" onClick={() => onOpenChange(false)}>
                  <Button className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold">
                    Checkout
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
