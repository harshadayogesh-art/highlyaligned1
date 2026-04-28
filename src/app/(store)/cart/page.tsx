'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart-store'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const total = useCartStore((s) => s.total())
  const totalMrp = useCartStore((s) => s.totalMrp())
  const shipping = useCartStore((s) => s.shipping())
  const finalTotal = useCartStore((s) => s.finalTotal())

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
          <ShoppingBag className="h-10 w-10 text-slate-300" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h1>
        <p className="text-slate-500 mb-6">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/shop">
          <Button className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold">
            Start Shopping
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items - Desktop Table / Mobile Cards */}
        <div className="lg:col-span-2">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 pb-3 border-b border-slate-100">
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="space-y-4 md:space-y-0">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex flex-col md:grid md:grid-cols-12 md:gap-4 bg-white border border-slate-100 rounded-xl p-4 md:rounded-none md:border-0 md:border-b md:border-slate-100 md:py-4"
              >
                {/* Product Info */}
                <div className="flex gap-3 md:col-span-6">
                  <div className="relative w-20 h-20 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      ₹{item.price} / unit
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-slate-400 hover:text-red-500 text-xs flex items-center gap-1 mt-2 md:hidden"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>

                {/* Price - Desktop */}
                <div className="hidden md:flex md:col-span-2 items-center justify-center text-sm text-slate-900">
                  ₹{item.price}
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between md:justify-center md:col-span-2 mt-3 md:mt-0">
                  <span className="text-sm text-slate-500 md:hidden">Quantity</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm w-6 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.productId, Math.min(item.maxStock, item.quantity + 1))}
                      className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Total + Remove - Desktop */}
                <div className="hidden md:flex md:col-span-2 items-center justify-end gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Mobile Total */}
                <div className="flex items-center justify-between mt-3 md:hidden">
                  <span className="text-sm text-slate-500">Total</span>
                  <p className="text-sm font-semibold text-slate-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-slate-900">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              {totalMrp > total && (
                <div className="flex justify-between text-emerald-600">
                  <span>You Save</span>
                  <span>-₹{(totalMrp - total).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    `₹${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                <span>Total</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
            {total < 999 && (
              <p className="text-xs text-slate-500">
                Add ₹{(999 - total).toFixed(0)} more for free shipping
              </p>
            )}
            <Link href="/checkout">
              <Button className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold h-12 text-base">
                Proceed to Checkout
              </Button>
            </Link>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-50 px-2 text-slate-500">or</span>
              </div>
            </div>
            <Link href="/shop" className="block text-center text-sm text-slate-600 hover:text-slate-900 underline underline-offset-4">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 md:hidden z-40">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-lg font-bold text-slate-900">₹{finalTotal.toFixed(2)}</p>
          </div>
          <Link href="/checkout">
            <Button className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold px-6">
              Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
