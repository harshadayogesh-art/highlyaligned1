'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useOrder } from '@/hooks/use-orders'
import { useCartStore } from '@/stores/cart-store'
import { CheckCircle, Package, ShoppingBag, MessageCircle, Loader2, AlertCircle } from 'lucide-react'

function OrderSuccessPageContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const clearCart = useCartStore((s) => s.clearCart)
  const { data: order, isPending, error } = useOrder(orderId || '')

  // Ensure cart is cleared when success page loads (safety net)
  useEffect(() => {
    clearCart()
  }, [clearCart])

  if (!orderId) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <div className='text-center space-y-4 max-w-md'>
          <AlertCircle className='h-12 w-12 text-red-500 mx-auto' />
          <h1 className='text-xl font-bold text-slate-900'>Order ID Missing</h1>
          <p className='text-slate-500'>We couldn&apos;t find your order reference. Please check your email or visit your account page.</p>
          <Link href='/shop'>
            <Button className='bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold'>
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center space-y-3'>
          <Loader2 className='h-8 w-8 animate-spin text-[#f59e0b] mx-auto' />
          <p className='text-slate-500'>Loading your order...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <div className='text-center space-y-4 max-w-md'>
          <AlertCircle className='h-12 w-12 text-red-500 mx-auto' />
          <h1 className='text-xl font-bold text-slate-900'>Order Not Found</h1>
          <p className='text-slate-500'>
            {error instanceof Error ? error.message : "We couldn't load your order details."}
          </p>
          <div className='flex gap-3 justify-center'>
            <Link href='/account'>
              <Button variant='outline'>My Account</Button>
            </Link>
            <Link href='/shop'>
              <Button className='bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold'>
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isPaid = order.payment_status === 'captured'
  const shareText = encodeURIComponent(
    `I just placed an order #${order.order_number} on HighlyAligned!`
  )

  return (
    <div className='min-h-screen bg-slate-50 px-4 py-8'>
      <div className='max-w-md mx-auto space-y-6'>
        <div className='text-center space-y-2'>
          <CheckCircle className='h-16 w-16 text-emerald-500 mx-auto' />
          <h1 className='text-2xl font-bold text-slate-900'>
            {isPaid ? 'Order Confirmed!' : 'Order Placed!'}
          </h1>
          <p className='text-slate-500'>
            {isPaid
              ? 'Your payment was successful.'
              : 'You will pay on delivery.'}
          </p>
        </div>

        <div className='bg-white rounded-xl border border-slate-100 p-4 space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-slate-500'>Order Number</span>
            <span className='font-semibold'>#{order.order_number}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-slate-500'>Date</span>
            <span>{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-slate-500'>Total</span>
            <span className='font-bold'>Rs.{order.final_total}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-slate-500'>Payment</span>
            <Badge className={isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
              {isPaid ? 'Paid' : 'COD'}
            </Badge>
          </div>
        </div>

        {order.courier_name && (
          <div className='bg-white rounded-xl border border-slate-100 p-4 space-y-2'>
            <h3 className='font-semibold text-slate-900 flex items-center gap-2'>
              <Package className='h-4 w-4 text-slate-500' />
              Shipping
            </h3>
            <p className='text-sm text-slate-600'>
              <span className='font-medium'>{order.courier_name}</span> • {order.tracking_id}
            </p>
            {order.shipping_label_url && (
              <a
                href={order.shipping_label_url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm text-[#f59e0b] hover:underline inline-flex items-center gap-1'
              >
                Track your package →
              </a>
            )}
          </div>
        )}

        <div className='bg-white rounded-xl border border-slate-100 p-4 space-y-3'>
          <h3 className='font-semibold text-slate-900'>Items</h3>
          {order.order_items?.map((item) => (
            <div key={item.id} className='flex gap-3'>
              <div className='relative w-12 h-12 rounded bg-slate-50 overflow-hidden flex-shrink-0'>
                <Image
                  src={item.products?.images?.[0] || '/placeholder.svg'}
                  alt=''
                  fill
                  className='object-cover'
                  sizes='48px'
                />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium truncate'>
                  {item.products?.name || 'Product'}
                </p>
                <p className='text-xs text-slate-500'>
                  Qty: {item.quantity}
                </p>
              </div>
              <p className='text-sm font-semibold'>Rs.{item.total}</p>
            </div>
          ))}
        </div>

        <div className='bg-emerald-50 rounded-xl p-4 text-center'>
          <Package className='h-8 w-8 text-emerald-600 mx-auto mb-2' />
          <p className='text-sm text-emerald-800 font-medium'>Estimated Delivery</p>
          <p className='text-sm text-emerald-600'>3-5 business days</p>
        </div>

        <div className='space-y-2'>
          <Link href='/account'>
            <Button className='w-full bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold'>
              Track Order
            </Button>
          </Link>
          <Link href='/shop'>
            <Button variant='outline' className='w-full'>
              <ShoppingBag className='h-4 w-4 mr-2' />
              Continue Shopping
            </Button>
          </Link>
          <a
            href={`https://wa.me/?text=${shareText}`}
            target='_blank'
            rel='noopener noreferrer'
          >
            <Button variant='ghost' className='w-full'>
              <MessageCircle className='h-4 w-4 mr-2' />
              Share on WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className='min-h-screen flex items-center justify-center text-slate-500'>
        <div className='text-center space-y-3'>
          <Loader2 className='h-8 w-8 animate-spin text-[#f59e0b] mx-auto' />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <OrderSuccessPageContent />
    </Suspense>
  )
}
