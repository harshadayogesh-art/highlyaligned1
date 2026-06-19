'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart-store'
import { triggerOrderNotification } from '@/app/actions/notifications'

type PaymentState = 'checking' | 'success' | 'failed' | 'pending'

function PaymentRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const clearCart = useCartStore((s) => s.clearCart)

  const [state, setState] = useState<PaymentState>('checking')
  const [attempts, setAttempts] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  const checkStatus = useCallback(async () => {
    if (!orderId) {
      setState('failed')
      setErrorMessage('Missing order ID.')
      return
    }

    try {
      const res = await fetch(`/api/phonepe/status?orderId=${orderId}`)
      if (!res.ok) {
        throw new Error('Could not verify payment status')
      }
      const data = await res.json() as { state?: string; error?: string }

      if (data.state === 'COMPLETED') {
        clearCart()
        await triggerOrderNotification(orderId, 'placed')
        setState('success')
        setTimeout(() => {
          router.push(`/order-success?order_id=${orderId}`)
        }, 2000)
      } else if (data.state === 'FAILED' || data.state === 'CANCELLED') {
        setState('failed')
        setErrorMessage('Your payment was not successful. Please try again.')
      } else {
        // Still pending — retry up to 5 times
        setState('pending')
        if (attempts < 5) {
          setTimeout(() => {
            setAttempts((a) => a + 1)
          }, 3000)
        } else {
          setState('failed')
          setErrorMessage('Payment status could not be confirmed. If you were charged, please contact support.')
        }
      }
    } catch (err) {
      console.error('Status check error:', err)
      setState('failed')
      setErrorMessage('An error occurred while verifying your payment.')
    }
  }, [orderId, attempts, clearCart, router])

  useEffect(() => {
    checkStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempts])

  return (
    <div className='min-h-[80vh] flex flex-col items-center justify-center px-4'>
      <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12 max-w-md w-full text-center space-y-6'>

        {(state === 'checking' || state === 'pending') && (
          <>
            <div className='flex justify-center'>
              <div className='relative'>
                <div className='h-20 w-20 rounded-full bg-purple-50 flex items-center justify-center'>
                  <Loader2 className='h-10 w-10 text-[#5e35b1] animate-spin' />
                </div>
              </div>
            </div>
            <div>
              <h1 className='text-xl font-bold text-slate-900 mb-2'>Verifying Payment</h1>
              <p className='text-sm text-slate-500'>
                {state === 'pending'
                  ? 'Payment is being processed. Please wait a moment…'
                  : 'Confirming your payment with PhonePe…'}
              </p>
            </div>
            <div className='flex justify-center gap-1'>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className='h-2 w-2 rounded-full bg-[#5e35b1] animate-bounce'
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </>
        )}

        {state === 'success' && (
          <>
            <div className='flex justify-center'>
              <div className='h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center'>
                <CheckCircle2 className='h-10 w-10 text-emerald-600' />
              </div>
            </div>
            <div>
              <h1 className='text-xl font-bold text-slate-900 mb-2'>Payment Successful!</h1>
              <p className='text-sm text-slate-500'>
                Your order has been placed. Redirecting you now…
              </p>
            </div>
            <div className='flex justify-center gap-1'>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className='h-2 w-2 rounded-full bg-emerald-500 animate-bounce'
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className='flex justify-center'>
              <div className='h-20 w-20 rounded-full bg-red-50 flex items-center justify-center'>
                <XCircle className='h-10 w-10 text-red-500' />
              </div>
            </div>
            <div>
              <h1 className='text-xl font-bold text-slate-900 mb-2'>Payment Failed</h1>
              <p className='text-sm text-slate-500'>
                {errorMessage || 'Your payment could not be processed.'}
              </p>
            </div>
            <div className='flex flex-col gap-3'>
              <Button
                onClick={() => router.push('/checkout')}
                className='w-full bg-[#5e35b1] hover:bg-[#4527a0] text-white font-semibold'
              >
                Try Again
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setState('checking')
                  setAttempts(0)
                }}
                className='w-full gap-2'
              >
                <RefreshCw className='h-4 w-4' />
                Check Status Again
              </Button>
              <button
                onClick={() => router.push('/shop')}
                className='text-sm text-slate-500 hover:text-slate-800 underline underline-offset-2'
              >
                Back to Shop
              </button>
            </div>
            {orderId && (
              <p className='text-xs text-slate-400'>
                Order ID: {orderId}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentRedirectPage() {
  return (
    <Suspense fallback={
      <div className='min-h-[80vh] flex flex-col items-center justify-center px-4'>
        <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12 max-w-md w-full text-center space-y-6'>
          <div className='flex justify-center'>
            <div className='h-20 w-20 rounded-full bg-purple-50 flex items-center justify-center'>
              <Loader2 className='h-10 w-10 text-[#5e35b1] animate-spin' />
            </div>
          </div>
          <div>
            <h1 className='text-xl font-bold text-slate-900 mb-2'>Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <PaymentRedirectContent />
    </Suspense>
  )
}
