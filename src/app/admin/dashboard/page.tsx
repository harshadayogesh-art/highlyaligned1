import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Users, Calendar, Package, AlertTriangle } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: ordersData },
    { data: bookingsData },
    { data: customersData },
    { data: productsData },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('final_total, status')
      .gte('created_at', thirtyDaysAgo),
    supabase
      .from('bookings')
      .select('status')
      .gte('created_at', thirtyDaysAgo),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('id, stock, status')
      .eq('status', 'published'),
  ])

  const totalRevenue =
    ordersData?.reduce((sum, o) => sum + Number(o.final_total || 0), 0) || 0
  const totalOrders = ordersData?.length || 0
  const totalBookings = bookingsData?.length || 0
  const totalCustomers = customersData?.length || 0
  const lowStockProducts =
    productsData?.filter((p) => p.stock < 10).length || 0

  const kpis = [
    {
      label: 'Revenue (30d)',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: <DollarSign className="h-4 w-4 text-[#f59e0b]" />,
    },
    {
      label: 'Orders (30d)',
      value: String(totalOrders),
      icon: <Package className="h-4 w-4 text-[#f59e0b]" />,
    },
    {
      label: 'Bookings (30d)',
      value: String(totalBookings),
      icon: <Calendar className="h-4 w-4 text-[#f59e0b]" />,
    },
    {
      label: 'Customers',
      value: String(totalCustomers),
      icon: <Users className="h-4 w-4 text-[#f59e0b]" />,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {kpi.label}
              </CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {lowStockProducts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Low Stock Alert
            </p>
            <p className="text-xs text-amber-700">
              {lowStockProducts} published product(s) have less than 10 units in
              stock.{' '}
              <a
                href="/admin/products"
                className="underline font-medium"
              >
                Review now →
              </a>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              {totalOrders > 0
                ? `${totalOrders} orders in the last 30 days.`
                : 'No orders in the last 30 days.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              {totalBookings > 0
                ? `${totalBookings} bookings in the last 30 days.`
                : 'No bookings in the last 30 days.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
