'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useMyReferrals } from '@/hooks/use-referrals'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gift, Copy, MessageCircle, IndianRupee, ShoppingBag, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function MyReferralPage() {
  const router = useRouter()
  const { profile, user, isLoading } = useAuth()
  const { data: referrals } = useMyReferrals(profile?.id)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/account/referral')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const code = profile?.referral_code || 'N/A'
  const totalOrders = referrals?.filter((r) => r.order_id).length || 0
  const totalEarnings = referrals?.reduce((s, r) => s + (r.commission_amount || 0), 0) || 0
  const pendingEarnings = referrals?.filter((r) => r.status === 'pending').reduce((s, r) => s + (r.commission_amount || 0), 0) || 0

  const shareText = encodeURIComponent(`Join me on HighlyAligned! Use my code ${code} and get a special discount on your first order.`)
  const [shareUrl, setShareUrl] = useState('')
  useEffect(() => { setShareUrl(`${window.location.origin}/?ref=${code}`) }, [code])

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied!')
  }

  return (
    <div className='max-w-4xl space-y-6'>
      <h1 className='text-xl font-bold text-slate-900'>My Referral</h1>

      {/* Code Card */}
      <div className='bg-gradient-to-br from-[#f59e0b] to-amber-600 rounded-xl p-6 text-white text-center space-y-3'>
        <Gift className='h-8 w-8 mx-auto' />
        <p className='text-sm opacity-90'>Your Referral Code</p>
        <p className='text-3xl font-bold tracking-wider'>{code}</p>
        <div className='flex gap-2 justify-center'>
          <Button size='sm' variant='secondary' onClick={copyCode}>
            <Copy className='h-4 w-4 mr-1' /> Copy
          </Button>
          <Button size='sm' variant='secondary' onClick={() => window.open(`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`, '_blank')}>
            <MessageCircle className='h-4 w-4 mr-1' /> WhatsApp
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 gap-3'>
        <div className='bg-white border border-slate-100 rounded-xl p-4 text-center'>
          <Users className='h-5 w-5 text-blue-500 mx-auto mb-1' />
          <p className='text-xl font-bold'>{referrals?.length || 0}</p>
          <p className='text-xs text-slate-500'>Total Referrals</p>
        </div>
        <div className='bg-white border border-slate-100 rounded-xl p-4 text-center'>
          <ShoppingBag className='h-5 w-5 text-emerald-500 mx-auto mb-1' />
          <p className='text-xl font-bold'>{totalOrders}</p>
          <p className='text-xs text-slate-500'>Conversions</p>
        </div>
        <div className='bg-white border border-slate-100 rounded-xl p-4 text-center'>
          <IndianRupee className='h-5 w-5 text-[#f59e0b] mx-auto mb-1' />
          <p className='text-xl font-bold'>₹{totalEarnings}</p>
          <p className='text-xs text-slate-500'>Total Earnings</p>
        </div>
        <div className='bg-white border border-slate-100 rounded-xl p-4 text-center'>
          <IndianRupee className='h-5 w-5 text-purple-500 mx-auto mb-1' />
          <p className='text-xl font-bold'>₹{pendingEarnings}</p>
          <p className='text-xs text-slate-500'>Pending</p>
        </div>
      </div>

      {/* Earnings History */}
      <div className='space-y-2'>
        <h2 className='font-semibold text-slate-900'>Earnings History</h2>
        {referrals && referrals.length > 0 ? (
          <div className='space-y-2'>
            {referrals.map((r) => (
              <div key={r.id} className='bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium'>{r.code_used}</p>
                  <p className='text-xs text-slate-500'>{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-bold'>₹{r.commission_amount}</p>
                  <Badge className={r.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                    {r.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-8 bg-slate-50 rounded-xl'>
            <p className='text-slate-500 text-sm'>No referrals yet. Share your code to start earning!</p>
          </div>
        )}
      </div>
    </div>
  )
}
