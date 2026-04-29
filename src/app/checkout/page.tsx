'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCartStore } from '@/stores/cart-store'
import { useAuth } from '@/hooks/use-auth'
import { useSettings } from '@/hooks/use-settings'
import { checkoutSchema, type CheckoutFormValues } from '@/schemas/checkout'
import { calculateOrderTotals } from '@/lib/utils/order-calculations'
import { loadRazorpayScript, openRazorpayCheckout } from '@/lib/razorpay'
import { triggerOrderNotification } from '@/app/actions/notifications'
import { useValidateCoupon } from '@/hooks/use-coupons'
import { toast } from 'sonner'
import { CreditCard, Banknote, Tag, CheckCircle, LogIn, UserPlus, User, ShoppingBag, Loader2, MapPin, Plus, Info } from 'lucide-react'
import { useAddresses, useCreateAddress } from '@/hooks/use-addresses'

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]

type CheckoutStep = 'auth' | 'form'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, profile, isLoading } = useAuth()
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const { data: settings } = useSettings()
  const gstEnabled = settings?.gst_enabled ?? false
  const [step, setStep] = useState<CheckoutStep>('auth')
  const [placing, setPlacing] = useState(false)
  const [orderJustPlaced, setOrderJustPlaced] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number; discount: number } | null>(null)
  const validateCoupon = useValidateCoupon()
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const { data: savedAddresses } = useAddresses(user?.id)
  const createAddress = useCreateAddress()

  // Skip auth step if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      setStep('form')
    }
  }, [isLoading, user])

  // Redirect empty cart — but NOT right after placing an order
  useEffect(() => {
    if (items.length === 0 && !orderJustPlaced) {
      router.push('/shop')
    }
  }, [items, router, orderJustPlaced])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      address: {
        name: profile?.name || '',
        phone: profile?.phone || '',
        email: profile?.email || '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        saveAddress: false,
      },
      paymentMode: 'cod',
    },
  })

  // Update form defaults when profile loads
  useEffect(() => {
    if (profile) {
      setValue('address.name', profile.name || '')
      setValue('address.phone', profile.phone || '')
      setValue('address.email', profile.email || '')
    }
  }, [profile, setValue])

  const paymentMode = watch('paymentMode')
  const isTestMode = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_test_') ?? false

  const { subtotal, shipping, gstAmount, savings } = calculateOrderTotals(items, gstEnabled, 0)
  const discount = appliedCoupon?.discount || 0
  const finalTotal = Math.max(0, subtotal + shipping + gstAmount - discount)

  const fillAddress = (addr: {
    name: string
    phone: string
    email: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    landmark?: string
  }) => {
    setValue('address.name', addr.name)
    setValue('address.phone', addr.phone)
    setValue('address.email', addr.email)
    setValue('address.line1', addr.line1)
    setValue('address.line2', addr.line2 || '')
    setValue('address.city', addr.city)
    setValue('address.state', addr.state)
    setValue('address.pincode', addr.pincode)
    setValue('address.landmark', addr.landmark || '')
  }

  const onSubmit = async (values: CheckoutFormValues) => {
    setPlacing(true)
    try {
      // Save address if requested
      if (user && values.address.saveAddress) {
        await createAddress.mutateAsync({
          user_id: user.id,
          name: values.address.name,
          phone: values.address.phone,
          email: values.address.email,
          line1: values.address.line1,
          line2: values.address.line2 || '',
          city: values.address.city,
          state: values.address.state,
          pincode: values.address.pincode,
          landmark: values.address.landmark || '',
          is_default: savedAddresses?.length === 0,
        })
      }

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          address: values.address,
          paymentMode: values.paymentMode,
          couponCode: appliedCoupon?.code || null,
          customerId: user?.id || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      if (values.paymentMode === 'cod') {
        setOrderJustPlaced(true)
        clearCart()
        triggerOrderNotification(data.orderId, 'placed')
        window.location.href = `/order-success?order_id=${data.orderId}`
        return
      }

      // Online payment flow
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Payment failed to load')
        setPlacing(false)
        return
      }

      openRazorpayCheckout({
        orderId: data.razorpayOrderId,
        amountInPaise: data.razorpayAmount ?? Math.round(data.finalTotal * 100),
        name: 'HighlyAligned',
        description: `Order ${data.orderNumber}`,
        prefill: {
          name: values.address.name,
          email: values.address.email,
          contact: values.address.phone,
        },
        onSuccess: async (response) => {
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId: data.orderId,
            }),
          })
          if (!verifyRes.ok) {
            const err = await verifyRes.json().catch(() => ({ error: 'Verification failed' }))
            toast.error(err.error || 'Payment verification failed')
            setPlacing(false)
            return
          }
          clearCart()
          router.push(`/order-success?order_id=${data.orderId}`)
        },
        onDismiss: () => {
          setPlacing(false)
        },
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to place order')
      console.error(err)
      setPlacing(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className='min-h-[70vh] flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-slate-400' />
      </div>
    )
  }

  // Auth selection screen
  if (step === 'auth' && !user) {
    return (
      <div className='px-4 py-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col justify-center'>
        <div className='text-center mb-8'>
          <ShoppingBag className='h-12 w-12 text-[#f59e0b] mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-slate-900'>Checkout</h1>
          <p className='text-slate-500 mt-2'>How would you like to proceed?</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Card className='cursor-pointer hover:border-[#f59e0b] transition-colors' onClick={() => router.push('/login?redirect=/checkout')}>
            <CardHeader className='text-center pb-2'>
              <LogIn className='h-8 w-8 text-[#f59e0b] mx-auto mb-2' />
              <CardTitle className='text-lg'>Sign In</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-slate-500 text-center'>Already have an account? Sign in for faster checkout and order tracking.</p>
              <Button className='w-full mt-4 bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold'>
                Sign In
              </Button>
            </CardContent>
          </Card>

          <Card className='cursor-pointer hover:border-[#f59e0b] transition-colors' onClick={() => router.push('/login?redirect=/checkout')}>
            <CardHeader className='text-center pb-2'>
              <UserPlus className='h-8 w-8 text-emerald-600 mx-auto mb-2' />
              <CardTitle className='text-lg'>Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-slate-500 text-center'>Create an account with your email to save addresses and track orders.</p>
              <Button className='w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'>
                Create Account
              </Button>
            </CardContent>
          </Card>

          <Card className='cursor-pointer hover:border-[#f59e0b] transition-colors' onClick={() => setStep('form')}>
            <CardHeader className='text-center pb-2'>
              <User className='h-8 w-8 text-slate-600 mx-auto mb-2' />
              <CardTitle className='text-lg'>Guest Checkout</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-slate-500 text-center'>Checkout without an account. You can create one later to track your order.</p>
              <Button variant='outline' className='w-full mt-4 font-semibold'>
                Continue as Guest
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className='mt-8 text-center'>
          <Link href='/cart' className='text-sm text-slate-500 hover:text-slate-800'>
            ← Back to cart
          </Link>
        </div>
      </div>
    )
  }

  // Checkout form
  return (
    <>
    <div className='px-4 py-6 max-w-5xl mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold text-slate-900'>Checkout</h1>
        {!user && (
          <Button variant='ghost' size='sm' onClick={() => setStep('auth')}>
            ← Back
          </Button>
        )}
      </div>

      {user && (
        <div className='bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4 flex items-center gap-2'>
          <User className='h-4 w-4 text-amber-700' />
          <p className='text-sm text-amber-800'>
            Signed in as <span className='font-medium'>{profile?.email || user.email}</span>
          </p>
        </div>
      )}

      <form id='checkout-form' onSubmit={handleSubmit(onSubmit)} className='grid grid-cols-1 lg:grid-cols-2 gap-8 pb-24 md:pb-0'>
        <div className='space-y-6'>
          {/* Saved Addresses */}
          {user && savedAddresses && savedAddresses.length > 0 && (
            <div className='bg-white border border-slate-100 rounded-xl p-4 space-y-3'>
              <h2 className='font-semibold text-slate-900'>Select Saved Address</h2>
              <div className='grid gap-2'>
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type='button'
                    onClick={() => {
                      setSelectedAddressId(addr.id)
                      fillAddress({
                        name: addr.name,
                        phone: addr.phone,
                        email: addr.email || '',
                        line1: addr.line1,
                        line2: addr.line2 || undefined,
                        city: addr.city,
                        state: addr.state,
                        pincode: addr.pincode,
                        landmark: addr.landmark || undefined,
                      })
                      setShowAddressForm(false)
                    }}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      selectedAddressId === addr.id
                        ? 'border-[#f59e0b] bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className='flex items-start justify-between'>
                      <div>
                        <p className='text-sm font-medium text-slate-900'>{addr.name}</p>
                        <p className='text-xs text-slate-600'>
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                        </p>
                        <p className='text-xs text-slate-600'>
                          {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                        <p className='text-xs text-slate-500'>Phone: {addr.phone}</p>
                      </div>
                      {addr.is_default && (
                        <span className='text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium'>
                          Default
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                <button
                  type='button'
                  onClick={() => {
                    setSelectedAddressId(null)
                    setShowAddressForm(true)
                  }}
                  className={`text-left p-3 rounded-lg border border-dashed transition-colors flex items-center gap-2 ${
                    showAddressForm ? 'border-[#f59e0b] bg-amber-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Plus className='h-4 w-4 text-slate-400' />
                  <span className='text-sm text-slate-600'>Add New Address</span>
                </button>
              </div>
            </div>
          )}

          {/* Show form if no saved addresses, or if "Add New" is selected, or for guests */}
          {(!user || !savedAddresses?.length || showAddressForm || !selectedAddressId) && (
          <div className='bg-white border border-slate-100 rounded-xl p-4 space-y-4'>
            <h2 className='font-semibold text-slate-900'>
              {user && savedAddresses && savedAddresses.length > 0 ? 'New Address' : 'Shipping Details'}
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Full Name *</Label>
                <Input {...register('address.name')} />
                {errors.address?.name && <p className='text-xs text-red-500'>{errors.address.name.message}</p>}
              </div>
              <div className='space-y-2'>
                <Label>Mobile *</Label>
                <Input {...register('address.phone')} placeholder='9876543210' />
                {errors.address?.phone && <p className='text-xs text-red-500'>{errors.address.phone.message}</p>}
              </div>
              <div className='space-y-2 md:col-span-2'>
                <Label>Email *</Label>
                <Input {...register('address.email')} />
                {errors.address?.email && <p className='text-xs text-red-500'>{errors.address.email.message}</p>}
              </div>
              <div className='space-y-2 md:col-span-2'>
                <Label>Address Line 1 *</Label>
                <Input {...register('address.line1')} />
                {errors.address?.line1 && <p className='text-xs text-red-500'>{errors.address.line1.message}</p>}
              </div>
              <div className='space-y-2 md:col-span-2'>
                <Label>Address Line 2</Label>
                <Input {...register('address.line2')} />
              </div>
              <div className='space-y-2'>
                <Label>City *</Label>
                <Input {...register('address.city')} />
                {errors.address?.city && <p className='text-xs text-red-500'>{errors.address.city.message}</p>}
              </div>
              <div className='space-y-2'>
                <Label>State *</Label>
                <Select value={watch('address.state')} onValueChange={(v) => setValue('address.state', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select state' />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.address?.state && <p className='text-xs text-red-500'>{errors.address.state.message}</p>}
              </div>
              <div className='space-y-2'>
                <Label>PIN Code *</Label>
                <Input {...register('address.pincode')} placeholder='380009' />
                {errors.address?.pincode && <p className='text-xs text-red-500'>{errors.address.pincode.message}</p>}
              </div>
              <div className='space-y-2'>
                <Label>Landmark</Label>
                <Input {...register('address.landmark')} />
              </div>
            </div>
            {user && (
              <div className='flex items-center gap-2'>
                <Checkbox
                  checked={watch('address.saveAddress')}
                  onCheckedChange={(v) => setValue('address.saveAddress', v as boolean)}
                />
                <Label className='text-sm font-normal'>Save this address for future orders</Label>
              </div>
            )}
          </div>
          )}

          <div className='bg-white border border-slate-100 rounded-xl p-4 space-y-4'>
            <h2 className='font-semibold text-slate-900'>Payment Method</h2>
            <div className='space-y-2'>
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMode === 'cod' ? 'border-[#f59e0b] bg-amber-50' : 'border-slate-200'}`}>
                <input type='radio' value='cod' {...register('paymentMode')} className='hidden' />
                <Banknote className='h-5 w-5 text-emerald-600' />
                <div className='flex-1'>
                  <p className='font-medium text-sm'>Cash on Delivery</p>
                  <p className='text-xs text-slate-500'>Pay when you receive</p>
                </div>
                {finalTotal >= 5000 && (
                  <p className='text-xs text-red-500'>Not available for orders above Rs.5000</p>
                )}
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMode === 'online' ? 'border-[#f59e0b] bg-amber-50' : 'border-slate-200'}`}>
                <input type='radio' value='online' {...register('paymentMode')} className='hidden' />
                <CreditCard className='h-5 w-5 text-[#f59e0b]' />
                <div className='flex-1'>
                  <p className='font-medium text-sm flex items-center gap-2'>
                    Online Payment
                    {isTestMode && (
                      <span className='text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider'>
                        Test Mode
                      </span>
                    )}
                  </p>
                  <p className='text-xs text-slate-500'>Pay securely via Razorpay (Cards, UPI, Net Banking)</p>
                </div>
              </label>

              {paymentMode === 'online' && isTestMode && (
                <div className='bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Info className='h-4 w-4 text-blue-600 flex-shrink-0' />
                    <p className='text-xs font-semibold text-blue-800'>Test Card Details</p>
                  </div>
                  <div className='text-xs text-blue-700 space-y-1 pl-6'>
                    <p>• Card No: <span className='font-mono font-medium'>5267 3181 8797 5449</span></p>
                    <p>• Expiry: Any future date (e.g., 12/30)</p>
                    <p>• CVV: Any 3 digits (e.g., 123)</p>
                    <p>• OTP: <span className='font-mono font-medium'>1234</span></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='bg-slate-50 rounded-xl p-4 space-y-4'>
            <h2 className='font-semibold text-slate-900'>Order Summary</h2>

            {/* Coupon */}
            <div className='space-y-2'>
              {appliedCoupon ? (
                <div className='flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='h-4 w-4 text-emerald-600' />
                    <span className='text-sm font-medium text-emerald-800'>
                      {appliedCoupon.code} applied
                    </span>
                  </div>
                  <span className='text-sm text-emerald-700'>-Rs.{discount.toFixed(2)}</span>
                </div>
              ) : (
                <div className='flex gap-2'>
                  <div className='relative flex-1'>
                    <Tag className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder='Enter coupon code'
                      className='pl-9'
                    />
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={async () => {
                      if (!couponCode) return
                      try {
                        const coupon = await validateCoupon.mutateAsync({ code: couponCode, subtotal })
                        let disc = 0
                        if (coupon.type === 'percentage') {
                          disc = subtotal * (coupon.value / 100)
                        } else if (coupon.type === 'fixed') {
                          disc = coupon.value
                        } else if (coupon.type === 'free_shipping') {
                          disc = shipping
                        }
                        setAppliedCoupon({ code: coupon.code, type: coupon.type, value: coupon.value, discount: disc })
                        toast.success(`${coupon.code} applied — You saved Rs.${disc.toFixed(2)}!`)
                        setCouponCode('')
                      } catch {
                        // error toast handled by mutation
                      }
                    }}
                    disabled={validateCoupon.isPending || !couponCode}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>

            <div className='space-y-3'>
              {items.map((item) => (
                <div key={item.productId} className='flex gap-3'>
                  <div className='relative w-14 h-14 rounded bg-white overflow-hidden flex-shrink-0'>
                    <Image src={item.image} alt={item.name} fill className='object-cover' sizes='56px' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>{item.name}</p>
                    <p className='text-xs text-slate-500'>Qty: {item.quantity}</p>
                  </div>
                  <p className='text-sm font-semibold'>Rs.{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between text-slate-600'>
                <span>Subtotal</span>
                <span>Rs.{subtotal.toFixed(2)}</span>
              </div>
              {savings > 0 && (
                <div className='flex justify-between text-emerald-600'>
                  <span>You Save</span>
                  <span>-Rs.{savings.toFixed(2)}</span>
                </div>
              )}
              <div className='flex justify-between text-slate-600'>
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `Rs.${shipping.toFixed(2)}`}</span>
              </div>
              {discount > 0 && (
                <div className='flex justify-between text-emerald-600'>
                  <span>Coupon Discount</span>
                  <span>-Rs.{discount.toFixed(2)}</span>
                </div>
              )}
              <div className='flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200'>
                <span>Total</span>
                <span>Rs.{finalTotal.toFixed(2)}</span>
              </div>
            </div>
            <Button
              type='submit'
              className='w-full bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold h-12'
              disabled={placing || (paymentMode === 'cod' && finalTotal >= 5000)}
            >
              {placing ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </form>
    </div>

    {/* Mobile Sticky Place Order Bar */}
    <div className='fixed bottom-16 left-0 right-0 bg-white border-t border-slate-100 p-3 md:hidden z-40'>
      <div className='flex items-center justify-between max-w-5xl mx-auto gap-4'>
        <div>
          <p className='text-xs text-slate-500'>Total</p>
          <p className='text-lg font-bold text-slate-900'>Rs.{finalTotal.toFixed(2)}</p>
        </div>
        <Button
          type='submit'
          form='checkout-form'
          className='bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold px-8 h-12'
          disabled={placing || (paymentMode === 'cod' && finalTotal >= 5000)}
          onClick={handleSubmit(onSubmit)}
        >
          {placing ? 'Placing...' : 'Place Order'}
        </Button>
      </div>
    </div>
    </>
  )
}
