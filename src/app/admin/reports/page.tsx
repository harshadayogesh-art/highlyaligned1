'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSalesReport, useGstReport } from '@/hooks/use-reports'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Download, TrendingUp, ShoppingBag, Users, CalendarDays, Sparkles, IndianRupee, FileText, Calculator } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6']

export default function ReportsPage() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-slate-900'>Reports & Analytics</h1>
      </div>

      <KpiCards />

      <Tabs defaultValue='sales'>
        <TabsList className='flex flex-wrap w-full h-auto'>
          <TabsTrigger value='sales'>Sales Report</TabsTrigger>
          <TabsTrigger value='gst'>GST Filing</TabsTrigger>
          <TabsTrigger value='revenue'>Revenue</TabsTrigger>
          <TabsTrigger value='products'>Products</TabsTrigger>
          <TabsTrigger value='bookings'>Bookings</TabsTrigger>
          <TabsTrigger value='leads'>Leads</TabsTrigger>
        </TabsList>

        <TabsContent value='sales'><SalesReportTab /></TabsContent>
        <TabsContent value='gst'><GstFilingTab /></TabsContent>
        <TabsContent value='revenue'><RevenueTab /></TabsContent>
        <TabsContent value='products'><ProductsTab /></TabsContent>
        <TabsContent value='bookings'><BookingsTab /></TabsContent>
        <TabsContent value='leads'><LeadsTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Sales Report Tab
// ═══════════════════════════════════════════════════════════════

function SalesReportTab() {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo)
  const [dateTo, setDateTo] = useState(today)

  const { data: records, isLoading } = useSalesReport(dateFrom, dateTo)

  const stats = useMemo(() => {
    if (!records) return { totalOrders: 0, totalRevenue: 0, totalGst: 0, avgOrder: 0, totalDiscount: 0 }
    const totalOrders = records.length
    const totalRevenue = records.reduce((s, r) => s + r.final_total, 0)
    const totalGst = records.reduce((s, r) => s + r.gst_amount, 0)
    const totalDiscount = records.reduce((s, r) => s + r.discount_amount, 0)
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0
    return { totalOrders, totalRevenue, totalGst, avgOrder, totalDiscount }
  }, [records])

  const exportPDF = () => {
    if (!records || records.length === 0) return
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(16)
    doc.text('Sales Report', 14, 20)
    doc.setFontSize(10)
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 28)
    doc.text(`Total Orders: ${stats.totalOrders} | Revenue: Rs.${stats.totalRevenue.toFixed(2)} | GST: Rs.${stats.totalGst.toFixed(2)}`, 14, 34)

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Order #', 'Customer', 'Mode', 'Subtotal', 'GST', 'Shipping', 'Discount', 'Total', 'Status']],
      body: records.map((r) => [
        new Date(r.created_at).toLocaleDateString(),
        r.order_number,
        r.customer_name,
        r.payment_mode,
        r.subtotal.toFixed(2),
        r.gst_amount.toFixed(2),
        r.shipping_amount.toFixed(2),
        r.discount_amount.toFixed(2),
        r.final_total.toFixed(2),
        r.status,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] },
    })

    doc.save(`sales-report-${dateFrom}-to-${dateTo}.pdf`)
  }

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='bg-white border border-slate-100 rounded-xl p-4 flex flex-wrap items-end gap-4'>
        <div className='space-y-1'>
          <Label className='text-xs text-slate-500'>From</Label>
          <Input type='date' value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs text-slate-500'>To</Label>
          <Input type='date' value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button variant='outline' onClick={exportPDF} disabled={!records || records.length === 0}>
          <Download className='h-4 w-4 mr-1' /> Export PDF
        </Button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-5 gap-4'>
        <StatCard icon={<ShoppingBag className='h-5 w-5 text-blue-500' />} value={stats.totalOrders} label='Orders' />
        <StatCard icon={<IndianRupee className='h-5 w-5 text-emerald-500' />} value={`Rs.${stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} label='Revenue' />
        <StatCard icon={<Calculator className='h-5 w-5 text-amber-500' />} value={`Rs.${stats.totalGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} label='Total GST' />
        <StatCard icon={<TrendingUp className='h-5 w-5 text-purple-500' />} value={`Rs.${Math.round(stats.avgOrder).toLocaleString('en-IN')}`} label='AOV' />
        <StatCard icon={<FileText className='h-5 w-5 text-red-500' />} value={`Rs.${stats.totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} label='Discounts' />
      </div>

      {/* Table */}
      <div className='bg-white border border-slate-100 rounded-xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-slate-500'>
              <tr>
                <th className='text-left px-4 py-3 font-medium'>Date</th>
                <th className='text-left px-4 py-3 font-medium'>Order #</th>
                <th className='text-left px-4 py-3 font-medium'>Customer</th>
                <th className='text-left px-4 py-3 font-medium'>Mode</th>
                <th className='text-right px-4 py-3 font-medium'>Subtotal</th>
                <th className='text-right px-4 py-3 font-medium'>GST</th>
                <th className='text-right px-4 py-3 font-medium'>Shipping</th>
                <th className='text-right px-4 py-3 font-medium'>Discount</th>
                <th className='text-right px-4 py-3 font-medium'>Total</th>
                <th className='text-left px-4 py-3 font-medium'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {isLoading ? (
                <tr><td colSpan={10} className='px-4 py-8 text-center text-slate-400'>Loading...</td></tr>
              ) : records?.length === 0 ? (
                <tr><td colSpan={10} className='px-4 py-8 text-center text-slate-400'>No orders in this period.</td></tr>
              ) : (
                records?.map((r) => (
                  <tr key={r.id} className='hover:bg-slate-50'>
                    <td className='px-4 py-3'>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className='px-4 py-3 font-mono text-xs'>{r.order_number}</td>
                    <td className='px-4 py-3'>{r.customer_name}</td>
                    <td className='px-4 py-3'><Badge className={r.payment_mode === 'cod' ? 'bg-amber-50 text-amber-700 border-0' : 'bg-indigo-50 text-indigo-700 border-0'}>{r.payment_mode}</Badge></td>
                    <td className='px-4 py-3 text-right'>Rs.{r.subtotal}</td>
                    <td className='px-4 py-3 text-right text-slate-500'>Rs.{r.gst_amount}</td>
                    <td className='px-4 py-3 text-right text-slate-500'>Rs.{r.shipping_amount}</td>
                    <td className='px-4 py-3 text-right text-slate-500'>Rs.{r.discount_amount}</td>
                    <td className='px-4 py-3 text-right font-medium'>Rs.{r.final_total}</td>
                    <td className='px-4 py-3'><Badge className='bg-slate-100 text-slate-600 border-0'>{r.status}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// GST Filing Tab
// ═══════════════════════════════════════════════════════════════

function GstFilingTab() {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo)
  const [dateTo, setDateTo] = useState(today)

  const { data: records, isLoading } = useGstReport(dateFrom, dateTo)

  const stats = useMemo(() => {
    if (!records) return { totalTaxable: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0, totalGst: 0, totalInvoices: 0 }
    const totalTaxable = records.reduce((s, r) => s + r.subtotal, 0)
    const totalCgst = records.reduce((s, r) => s + r.cgst_amount, 0)
    const totalSgst = records.reduce((s, r) => s + r.sgst_amount, 0)
    const totalIgst = records.reduce((s, r) => s + r.igst_amount, 0)
    const totalGst = records.reduce((s, r) => s + r.gst_amount, 0)
    return { totalTaxable, totalCgst, totalSgst, totalIgst, totalGst, totalInvoices: records.length }
  }, [records])

  const exportPDF = () => {
    if (!records || records.length === 0) return
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(16)
    doc.text('GST Filing Report', 14, 20)
    doc.setFontSize(10)
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 28)
    doc.text(`Total Taxable: Rs.${stats.totalTaxable.toFixed(2)} | CGST: Rs.${stats.totalCgst.toFixed(2)} | SGST: Rs.${stats.totalSgst.toFixed(2)} | IGST: Rs.${stats.totalIgst.toFixed(2)}`, 14, 34)

    autoTable(doc, {
      startY: 40,
      head: [['Invoice #', 'Date', 'Customer', 'Place of Supply', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total GST']],
      body: records.map((r) => [
        r.order_number,
        new Date(r.created_at).toLocaleDateString(),
        r.customer_name,
        r.place_of_supply || '-',
        r.subtotal.toFixed(2),
        r.cgst_amount.toFixed(2),
        r.sgst_amount.toFixed(2),
        r.igst_amount.toFixed(2),
        r.gst_amount.toFixed(2),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] },
    })

    doc.save(`gst-report-${dateFrom}-to-${dateTo}.pdf`)
  }

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='bg-white border border-slate-100 rounded-xl p-4 flex flex-wrap items-end gap-4'>
        <div className='space-y-1'>
          <Label className='text-xs text-slate-500'>From</Label>
          <Input type='date' value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs text-slate-500'>To</Label>
          <Input type='date' value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button variant='outline' onClick={exportPDF} disabled={!records || records.length === 0}>
          <Download className='h-4 w-4 mr-1' /> Export PDF
        </Button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-5 gap-4'>
        <StatCard icon={<FileText className='h-5 w-5 text-blue-500' />} value={stats.totalInvoices} label='Invoices' />
        <StatCard icon={<IndianRupee className='h-5 w-5 text-emerald-500' />} value={`Rs.${stats.totalTaxable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} label='Taxable Value' />
        <StatCard icon={<Calculator className='h-5 w-5 text-amber-500' />} value={`Rs.${stats.totalCgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} label='Total CGST' />
        <StatCard icon={<Calculator className='h-5 w-5 text-purple-500' />} value={`Rs.${stats.totalSgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} label='Total SGST' />
        <StatCard icon={<Calculator className='h-5 w-5 text-red-500' />} value={`Rs.${stats.totalIgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} label='Total IGST' />
      </div>

      {/* Table */}
      <div className='bg-white border border-slate-100 rounded-xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-slate-500'>
              <tr>
                <th className='text-left px-4 py-3 font-medium'>Invoice #</th>
                <th className='text-left px-4 py-3 font-medium'>Date</th>
                <th className='text-left px-4 py-3 font-medium'>Customer</th>
                <th className='text-left px-4 py-3 font-medium'>Place of Supply</th>
                <th className='text-right px-4 py-3 font-medium'>Taxable Value</th>
                <th className='text-right px-4 py-3 font-medium'>CGST</th>
                <th className='text-right px-4 py-3 font-medium'>SGST</th>
                <th className='text-right px-4 py-3 font-medium'>IGST</th>
                <th className='text-right px-4 py-3 font-medium'>Total GST</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {isLoading ? (
                <tr><td colSpan={9} className='px-4 py-8 text-center text-slate-400'>Loading...</td></tr>
              ) : records?.length === 0 ? (
                <tr><td colSpan={9} className='px-4 py-8 text-center text-slate-400'>No GST data in this period.</td></tr>
              ) : (
                records?.map((r) => (
                  <tr key={r.id} className='hover:bg-slate-50'>
                    <td className='px-4 py-3 font-mono text-xs'>{r.order_number}</td>
                    <td className='px-4 py-3'>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className='px-4 py-3'>{r.customer_name}</td>
                    <td className='px-4 py-3 text-slate-500'>{r.place_of_supply || '-'}</td>
                    <td className='px-4 py-3 text-right'>Rs.{r.subtotal}</td>
                    <td className='px-4 py-3 text-right text-emerald-600'>{r.cgst_amount > 0 ? `Rs.${r.cgst_amount}` : '-'}</td>
                    <td className='px-4 py-3 text-right text-emerald-600'>{r.sgst_amount > 0 ? `Rs.${r.sgst_amount}` : '-'}</td>
                    <td className='px-4 py-3 text-right text-red-500'>{r.igst_amount > 0 ? `Rs.${r.igst_amount}` : '-'}</td>
                    <td className='px-4 py-3 text-right font-medium'>Rs.{r.gst_amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Existing Tabs
// ═══════════════════════════════════════════════════════════════

function KpiCards() {
  const { data: kpis } = useQuery({
    queryKey: ['report-kpis'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: orders } = await supabase.from('orders').select('final_total, created_at, status')
      const { data: bookings } = await supabase.from('bookings').select('status')
      const { data: leads } = await supabase.from('leads').select('status')
      const { data: customers } = await supabase.from('profiles').select('id')

      const totalRevenue = orders?.reduce((s, o) => s + Number(o.final_total), 0) || 0
      const totalOrders = orders?.length || 0
      const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0
      const cancelledBookings = bookings?.filter((b) => b.status === 'cancelled').length || 0
      const bookingCancelRate = bookings?.length ? Math.round((cancelledBookings / bookings.length) * 100) : 0
      const convertedLeads = leads?.filter((l) => l.status === 'converted').length || 0
      const leadConvRate = leads?.length ? Math.round((convertedLeads / leads.length) * 100) : 0

      return { totalRevenue, totalOrders, aov, totalCustomers: customers?.length || 0, bookingCancelRate, leadConvRate }
    },
  })

  return (
    <div className='grid grid-cols-2 lg:grid-cols-3 gap-4'>
      <KpiCard icon={<TrendingUp className='h-5 w-5 text-emerald-500' />} label='Total Revenue' value={`Rs.${(kpis?.totalRevenue || 0).toFixed(0)}`} />
      <KpiCard icon={<ShoppingBag className='h-5 w-5 text-blue-500' />} label='Total Orders' value={String(kpis?.totalOrders || 0)} />
      <KpiCard icon={<Users className='h-5 w-5 text-purple-500' />} label='Customers' value={String(kpis?.totalCustomers || 0)} />
      <KpiCard icon={<TrendingUp className='h-5 w-5 text-[#f59e0b]' />} label='AOV' value={`Rs.${(kpis?.aov || 0).toFixed(0)}`} />
      <KpiCard icon={<CalendarDays className='h-5 w-5 text-red-500' />} label='Booking Cancel %' value={`${kpis?.bookingCancelRate || 0}%`} />
      <KpiCard icon={<Sparkles className='h-5 w-5 text-teal-500' />} label='Lead Conv %' value={`${kpis?.leadConvRate || 0}%`} />
    </div>
  )
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className='bg-white border border-slate-100 rounded-xl p-4'>
      <div className='flex items-center gap-2 mb-2'>{icon}<span className='text-xs text-slate-500'>{label}</span></div>
      <p className='text-2xl font-bold text-slate-900'>{value}</p>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className='bg-white border border-slate-100 rounded-xl p-4'>
      {icon}
      <p className='text-xl font-bold mt-2'>{value}</p>
      <p className='text-xs text-slate-500'>{label}</p>
    </div>
  )
}

function RevenueTab() {
  const { data } = useQuery({
    queryKey: ['report-revenue'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: orders } = await supabase.from('orders').select('final_total, created_at').order('created_at')
      const byMonth: Record<string, number> = {}
      orders?.forEach((o) => {
        const month = new Date(o.created_at).toLocaleString('default', { month: 'short' })
        byMonth[month] = (byMonth[month] || 0) + Number(o.final_total)
      })
      return Object.entries(byMonth).map(([name, value]) => ({ name, value: Math.round(value) }))
    },
  })

  return (
    <div className='bg-white border border-slate-100 rounded-xl p-4'>
      <h3 className='font-semibold mb-4'>Revenue by Month</h3>
      <ResponsiveContainer width='100%' height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='name' />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type='monotone' dataKey='value' stroke='#f59e0b' name='Revenue (Rs.)' />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function ProductsTab() {
  const { data } = useQuery({
    queryKey: ['report-products'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: items } = await supabase.from('order_items').select('quantity, products(name)')
      const byProduct: Record<string, number> = {}
      items?.forEach((i) => {
        const name = ((i.products as unknown) as { name: string } | null)?.name || 'Unknown'
        byProduct[name] = (byProduct[name] || 0) + i.quantity
      })
      return Object.entries(byProduct).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)
    },
  })

  return (
    <div className='bg-white border border-slate-100 rounded-xl p-4'>
      <h3 className='font-semibold mb-4'>Top Selling Products</h3>
      <ResponsiveContainer width='100%' height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='name' angle={-45} textAnchor='end' height={80} />
          <YAxis />
          <Tooltip />
          <Bar dataKey='value' fill='#3b82f6' name='Units Sold' />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function BookingsTab() {
  const { data } = useQuery({
    queryKey: ['report-bookings'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: bookings } = await supabase.from('bookings').select('status, services(name)')
      const byStatus: Record<string, number> = {}
      bookings?.forEach((b) => {
        byStatus[b.status] = (byStatus[b.status] || 0) + 1
      })
      return Object.entries(byStatus).map(([name, value]) => ({ name, value }))
    },
  })

  return (
    <div className='bg-white border border-slate-100 rounded-xl p-4'>
      <h3 className='font-semibold mb-4'>Bookings by Status</h3>
      <ResponsiveContainer width='100%' height={300}>
        <PieChart>
          <Pie data={data} dataKey='value' nameKey='name' cx='50%' cy='50%' outerRadius={100} label>
            {data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function LeadsTab() {
  const { data } = useQuery({
    queryKey: ['report-leads'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: leads } = await supabase.from('leads').select('status')
      const byStatus: Record<string, number> = {}
      leads?.forEach((l) => {
        byStatus[l.status] = (byStatus[l.status] || 0) + 1
      })
      return Object.entries(byStatus).map(([name, value]) => ({ name, value }))
    },
  })

  return (
    <div className='bg-white border border-slate-100 rounded-xl p-4'>
      <h3 className='font-semibold mb-4'>Lead Funnel</h3>
      <ResponsiveContainer width='100%' height={300}>
        <BarChart data={data} layout='vertical'>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis type='number' />
          <YAxis dataKey='name' type='category' width={80} />
          <Tooltip />
          <Bar dataKey='value' fill='#8b5cf6' name='Count' />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
