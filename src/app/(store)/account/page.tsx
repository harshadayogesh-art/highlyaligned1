'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useOrders } from '@/hooks/use-orders'
import { useBookings } from '@/hooks/use-bookings'
import { useRemedies } from '@/hooks/use-remedies'
import { useMyReferrals } from '@/hooks/use-referrals'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingBag,
  CalendarDays,
  Sparkles,
  Gift,
  ArrowRight,
  Loader2,
  Package,
  Star,
  MapPin,
  User,
} from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  packed: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-sky-100 text-sky-800',
  out_for_delivery: 'bg-teal-100 text-teal-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AccountDashboardPage() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  const { data: ordersData } = useOrders({ customerId: user?.id, limit: 3 })
  const { data: bookings } = useBookings({ customerId: user?.id })
  const { data: remedies } = useRemedies({ customerId: user?.id })
  const { data: referrals } = useMyReferrals(profile?.id)

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const orders = ordersData?.data || []
  const today = new Date().toISOString().split('T')[0]
  const upcomingBookings = (bookings || []).filter((b) => b.date >= today && b.status !== 'cancelled')
  const activeRemedies = (remedies || []).filter((r) => r.status === 'active')
  const totalEarnings = referrals?.reduce((s, r) => s + (r.commission_amount || 0), 0) || 0

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {profile?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here&apos;s what&apos;s happening with your account.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/account/orders" className="block">
          <div className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Package className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-xs text-slate-500">Orders</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{orders.length}</p>
          </div>
        </Link>

        <Link href="/account/bookings" className="block">
          <div className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-xs text-slate-500">Bookings</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{upcomingBookings.length}</p>
          </div>
        </Link>

        <Link href="/account/remedies" className="block">
          <div className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-xs text-slate-500">Remedies</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{activeRemedies.length}</p>
          </div>
        </Link>

        <Link href="/account/referral" className="block">
          <div className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Gift className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-xs text-slate-500">Earnings</span>
            </div>
            <p className="text-xl font-bold text-slate-900">₹{totalEarnings}</p>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/shop">
          <Button size="sm" className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900">
            <ShoppingBag className="h-4 w-4 mr-1" /> Shop Now
          </Button>
        </Link>
        <Link href="/services">
          <Button size="sm" variant="outline">
            <CalendarDays className="h-4 w-4 mr-1" /> Book Session
          </Button>
        </Link>
        <Link href="/kundali">
          <Button size="sm" variant="outline">
            <Star className="h-4 w-4 mr-1" /> Kundali
          </Button>
        </Link>
        <Link href="/account/addresses">
          <Button size="sm" variant="outline">
            <MapPin className="h-4 w-4 mr-1" /> Manage Addresses
          </Button>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="text-sm text-[#f59e0b] font-medium flex items-center gap-1 hover:underline"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 bg-white border border-slate-100 rounded-xl">
            <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-3">No orders yet</p>
            <Link href="/shop">
              <Button size="sm" className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="block">
                <div className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        #{order.order_number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge className={`text-xs ${statusColors[order.status] || 'bg-slate-100'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      {order.order_items?.reduce((s, i) => s + i.quantity, 0)} items
                    </p>
                    <p className="font-bold text-slate-900">₹{order.final_total}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Booking */}
      {upcomingBookings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Booking</h2>
            <Link
              href="/account/bookings"
              className="text-sm text-[#f59e0b] font-medium flex items-center gap-1 hover:underline"
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Link href="/account/bookings" className="block">
            <div className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: upcomingBookings[0].services?.color_code || '#999' }}
                >
                  {upcomingBookings[0].services?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {upcomingBookings[0].services?.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {upcomingBookings[0].date} at {upcomingBookings[0].time_slot}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
