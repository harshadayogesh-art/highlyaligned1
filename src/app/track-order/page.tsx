'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, Search, Package, CheckCircle, Truck, Info, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { trackOrder } from '@/app/actions/track'

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const initialOrderId = searchParams.get('order_id') || searchParams.get('orderNumber') || ''

  const [orderNumber, setOrderNumber] = useState(initialOrderId)
  const [contactInfo, setContactInfo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNumber || !contactInfo) return

    setIsLoading(true)
    setError('')
    setResult(null)

    const res = await trackOrder(orderNumber, contactInfo)
    
    if (res.error) {
      setError(res.error)
    } else if (res.success && res.order) {
      setResult(res.order)
    }
    
    setIsLoading(false)
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Order Placed', color: 'bg-slate-100 text-slate-700', icon: Package }
      case 'accepted': return { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle }
      case 'processing': return { label: 'Processing', color: 'bg-indigo-100 text-indigo-700', icon: Package }
      case 'packed': return { label: 'Packed', color: 'bg-indigo-100 text-indigo-700', icon: Package }
      case 'shipped': return { label: 'Shipped', color: 'bg-amber-100 text-amber-800', icon: Truck }
      case 'out_for_delivery': return { label: 'Out for Delivery', color: 'bg-amber-100 text-amber-800', icon: Truck }
      case 'delivered': return { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
      case 'cancelled': return { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: Info }
      case 'returned': return { label: 'Returned', color: 'bg-red-100 text-red-800', icon: Info }
      default: return { label: status, color: 'bg-slate-100 text-slate-700', icon: Info }
    }
  }

  return (
    <div className="min-h-[70vh] bg-slate-50 py-12 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Track Your Order</h1>
          <p className="text-slate-500">Enter your order number and email/phone to see the latest updates.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                placeholder="e.g. HA-123456789"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactInfo">Email Address or Phone Number</Label>
              <Input
                id="contactInfo"
                placeholder="Entered during checkout"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                required
              />
              <p className="text-xs text-slate-400">Used for verification.</p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#5e35b1] hover:bg-[#4527a0] text-white"
              disabled={isLoading || !orderNumber || !contactInfo}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Track Order
            </Button>
            
            {error && (
              <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">{error}</p>
            )}
          </form>
        </div>

        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm text-slate-500">Order</p>
                <p className="font-bold text-lg text-slate-900">{result.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Date</p>
                <p className="font-medium text-slate-900">{new Date(result.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Current Status</h3>
              
              {(() => {
                const s = getStatusDisplay(result.status)
                const Icon = s.icon
                return (
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className={\`h-10 w-10 rounded-full flex items-center justify-center \${s.color.replace('text-', 'bg-').replace('100', '200')}\`}>
                      <Icon className={\`h-5 w-5 \${s.color.split(' ')[1]}\`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{s.label}</p>
                      <p className="text-xs text-slate-500 capitalize">Payment: {result.payment_mode} ({result.payment_status})</p>
                    </div>
                  </div>
                )
              })()}
              
              {result.courier_name && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <Truck className="h-4 w-4" /> Shipping Details
                  </h4>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{result.courier_name}</span> • Tracking: {result.tracking_id || 'Pending'}
                  </p>
                  {result.shipping_label_url && (
                    <a 
                      href={result.shipping_label_url}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      View Live Tracking →
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="font-semibold text-slate-900">Items Ordered</h3>
              {result.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-slate-100 rounded overflow-hidden relative flex-shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 font-semibold">
                <span>Total</span>
                <span>Rs.{result.final_total}</span>
              </div>
            </div>
            
          </div>
        )}
        
        <div className="text-center">
          <Link href="/shop" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>}>
      <TrackOrderContent />
    </Suspense>
  )
}
