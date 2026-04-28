'use client'

import { useState } from 'react'
import {
  useInfluencers,
  useInfluencer,
  useInfluencerSales,
  useInfluencerCoupons,
  useCreateInfluencer,
  useUpdateInfluencer,
  useDeleteInfluencer,
  useCreateInfluencerCoupon,
  usePayCommission,
  type Influencer,
  type InfluencerCommission,
} from '@/hooks/use-influencers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  IndianRupee,
  ShoppingBag,
  Tag,
  Plus,
  Pencil,
  Trash2,
  Eye,
  MessageCircle,
  Phone,
  X,
  CheckCircle,
  Loader2,
  Copy,
} from 'lucide-react'

export default function ReferralsPage() {
  const { data: influencers, isLoading } = useInfluencers()

  // Stats
  const totalInfluencers = influencers?.length || 0
  const activeCoupons = influencers?.reduce(
    (sum, inf) => sum + (inf.status === 'active' ? 1 : 0),
    0
  ) || 0
  const totalSales = influencers?.reduce((s, inf) => s + (inf.total_sales || 0), 0) || 0
  const pendingPayout = influencers?.reduce(
    (s, inf) => s + ((inf.total_commission_earned || 0) - (inf.total_commission_paid || 0)),
    0
  ) || 0

  // Create / Edit Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Influencer | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({
    name: '',
    email: '',
    phone: '',
    commission_rate: 10,
    bio: '',
    avatar_url: '',
    status: 'active',
  })

  const createInfluencer = useCreateInfluencer()
  const updateInfluencer = useUpdateInfluencer()
  const deleteInfluencer = useDeleteInfluencer()

  const resetForm = () => {
    setEditing(null)
    setForm({
      name: '',
      email: '',
      phone: '',
      commission_rate: 10,
      bio: '',
      avatar_url: '',
      status: 'active',
    })
  }

  const openCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (inf: Influencer) => {
    setEditing(inf)
    setForm({
      name: inf.name,
      email: inf.email || '',
      phone: inf.phone || '',
      commission_rate: inf.commission_rate,
      bio: inf.bio || '',
      avatar_url: inf.avatar_url || '',
      status: inf.status,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.name) return
    if (editing) {
      updateInfluencer.mutate(
        { id: editing.id, updates: form },
        { onSuccess: () => setDialogOpen(false) }
      )
    } else {
      createInfluencer.mutate(form, { onSuccess: () => setDialogOpen(false) })
    }
  }

  // Detail Sheet
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const openDetail = (id: string) => {
    setSelectedId(id)
    setDetailOpen(true)
  }

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const handleDelete = (id: string) => {
    deleteInfluencer.mutate(id, { onSuccess: () => setDeleteId(null) })
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-slate-900'>Influencer Program</h1>
        <Button
          className='bg-[#f59e0b] text-slate-900 hover:bg-amber-500'
          onClick={openCreate}
        >
          <Plus className='h-4 w-4 mr-1' /> Add Influencer
        </Button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          icon={<Users className='h-5 w-5 text-blue-500' />}
          value={totalInfluencers}
          label='Influencers'
        />
        <StatCard
          icon={<Tag className='h-5 w-5 text-purple-500' />}
          value={activeCoupons}
          label='Active'
        />
        <StatCard
          icon={<ShoppingBag className='h-5 w-5 text-emerald-500' />}
          value={`Rs.${totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          label='Total Sales'
        />
        <StatCard
          icon={<IndianRupee className='h-5 w-5 text-[#f59e0b]' />}
          value={`Rs.${pendingPayout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          label='Pending Payout'
        />
      </div>

      {/* Table */}
      <div className='bg-white border border-slate-100 rounded-xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-slate-500'>
              <tr>
                <th className='text-left px-4 py-3 font-medium'>Name</th>
                <th className='text-left px-4 py-3 font-medium'>Code</th>
                <th className='text-left px-4 py-3 font-medium'>Comm. %</th>
                <th className='text-left px-4 py-3 font-medium'>Sales</th>
                <th className='text-left px-4 py-3 font-medium'>Earned</th>
                <th className='text-left px-4 py-3 font-medium'>Paid</th>
                <th className='text-left px-4 py-3 font-medium'>Balance</th>
                <th className='text-left px-4 py-3 font-medium'>Status</th>
                <th className='text-right px-4 py-3 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className='px-4 py-8 text-center text-slate-400'>
                    <Loader2 className='h-6 w-6 animate-spin mx-auto mb-2' />
                    Loading influencers...
                  </td>
                </tr>
              ) : influencers?.length === 0 ? (
                <tr>
                  <td colSpan={9} className='px-4 py-8 text-center text-slate-400'>
                    No influencers yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                influencers?.map((inf) => {
                  const balance =
                    (inf.total_commission_earned || 0) -
                    (inf.total_commission_paid || 0)
                  return (
                    <tr
                      key={inf.id}
                      className='hover:bg-slate-50 cursor-pointer'
                      onClick={() => openDetail(inf.id)}
                    >
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-3'>
                          <div className='w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold'>
                            {inf.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className='font-medium text-slate-900'>
                              {inf.name}
                            </p>
                            <p className='text-xs text-slate-400'>
                              {inf.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-3 font-mono text-xs'>
                        —
                      </td>
                      <td className='px-4 py-3'>{inf.commission_rate}%</td>
                      <td className='px-4 py-3'>
                        Rs.{(inf.total_sales || 0).toLocaleString('en-IN')}
                      </td>
                      <td className='px-4 py-3'>
                        Rs.
                        {(
                          inf.total_commission_earned || 0
                        ).toLocaleString('en-IN')}
                      </td>
                      <td className='px-4 py-3'>
                        Rs.
                        {(
                          inf.total_commission_paid || 0
                        ).toLocaleString('en-IN')}
                      </td>
                      <td className='px-4 py-3 font-medium'>
                        Rs.{balance.toLocaleString('en-IN')}
                      </td>
                      <td className='px-4 py-3'>
                        <Badge
                          className={
                            inf.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }
                        >
                          {inf.status}
                        </Badge>
                      </td>
                      <td className='px-4 py-3 text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={(e) => {
                              e.stopPropagation()
                              openDetail(inf.id)
                            }}
                          >
                            <Eye className='h-4 w-4 text-slate-500' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(inf)
                            }}
                          >
                            <Pencil className='h-4 w-4 text-slate-500' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteId(inf.id)
                            }}
                          >
                            <Trash2 className='h-4 w-4 text-red-500' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit Influencer' : 'Add Influencer'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Name *</Label>
                <Input
                  value={String(form.name || '')}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder='Ashok Sharma'
                />
              </div>
              <div className='space-y-1'>
                <Label>Commission Rate (%)</Label>
                <Input
                  type='number'
                  value={String(form.commission_rate || 10)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      commission_rate: Number(e.target.value),
                    }))
                  }
                  placeholder='20'
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Email</Label>
                <Input
                  type='email'
                  value={String(form.email || '')}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder='ashok@example.com'
                />
              </div>
              <div className='space-y-1'>
                <Label>Phone</Label>
                <Input
                  value={String(form.phone || '')}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder='9876543210'
                />
              </div>
            </div>
            <div className='space-y-1'>
              <Label>Bio</Label>
              <Input
                value={String(form.bio || '')}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bio: e.target.value }))
                }
                placeholder='Short bio or description'
              />
            </div>
            <div className='space-y-1'>
              <Label>Avatar URL</Label>
              <Input
                value={String(form.avatar_url || '')}
                onChange={(e) =>
                  setForm((f) => ({ ...f, avatar_url: e.target.value }))
                }
                placeholder='https://...'
              />
            </div>
            <div className='flex items-center gap-3'>
              <Switch
                checked={form.status === 'active'}
                onCheckedChange={(checked) =>
                  setForm((f) => ({
                    ...f,
                    status: checked ? 'active' : 'inactive',
                  }))
                }
              />
              <Label className='cursor-pointer'>Active</Label>
            </div>
            <Button
              className='w-full bg-[#f59e0b] text-slate-900'
              onClick={handleSave}
              disabled={
                createInfluencer.isPending || updateInfluencer.isPending
              }
            >
              {createInfluencer.isPending || updateInfluencer.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin mr-1' />
              ) : (
                <CheckCircle className='h-4 w-4 mr-1' />
              )}
              {editing ? 'Save Changes' : 'Create Influencer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete Influencer?</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-slate-500'>
            This will permanently delete this influencer and unlink their
            coupons. Historical sales data will remain.
          </p>
          <div className='flex gap-3 pt-2'>
            <Button
              variant='outline'
              className='flex-1'
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              className='flex-1 bg-red-500 hover:bg-red-600 text-white'
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleteInfluencer.isPending}
            >
              {deleteInfluencer.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Trash2 className='h-4 w-4 mr-1' />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <InfluencerDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        influencerId={selectedId}
      />
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
}) {
  return (
    <div className='bg-white border border-slate-100 rounded-xl p-4'>
      {icon}
      <p className='text-2xl font-bold mt-2'>{value}</p>
      <p className='text-xs text-slate-500'>{label}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Influencer Detail Sheet
// ═══════════════════════════════════════════════════════════════

function InfluencerDetailSheet({
  open,
  onOpenChange,
  influencerId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  influencerId: string | null
}) {
  const { data: influencer } = useInfluencer(influencerId || undefined)
  const { data: sales } = useInfluencerSales(influencerId || undefined)
  const { data: coupons } = useInfluencerCoupons(influencerId || undefined)
  const payCommission = usePayCommission()
  const createCoupon = useCreateInfluencerCoupon()

  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'coupons'>('overview')
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([])
  const [couponFormOpen, setCouponFormOpen] = useState(false)
  const [couponForm, setCouponForm] = useState<Record<string, unknown>>({
    code: '',
    type: 'percentage',
    value: 0,
    min_order_amount: 0,
    max_uses: null,
    valid_from: '',
    valid_to: '',
    is_active: true,
  })

  const balance =
    (influencer?.total_commission_earned || 0) -
    (influencer?.total_commission_paid || 0)
  const totalOrders = sales?.length || 0
  const pendingCommissions =
    sales?.filter((s) => s.status === 'pending') || []

  const toggleCommission = (id: string) => {
    setSelectedCommissions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handlePaySelected = () => {
    if (!influencerId || selectedCommissions.length === 0) return
    payCommission.mutate(
      { commissionIds: selectedCommissions, influencerId: influencerId },
      { onSuccess: () => setSelectedCommissions([]) }
    )
  }

  const handleCreateCoupon = () => {
    if (!influencerId || !couponForm.code) return
    createCoupon.mutate(
      { ...couponForm, influencer_id: influencerId },
      { onSuccess: () => { setCouponFormOpen(false); setCouponForm({ code: '', type: 'percentage', value: 0, min_order_amount: 0, max_uses: null, valid_from: '', valid_to: '', is_active: true }) } }
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-xl overflow-y-auto p-0'>
        <SheetTitle className='sr-only'>Influencer Detail</SheetTitle>
        {influencer && (
          <>
            {/* Header */}
            <div className='bg-gradient-to-br from-violet-900 to-indigo-900 text-white p-6'>
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-lg font-bold border border-white/20'>
                    {influencer.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2 className='text-xl font-bold'>{influencer.name}</h2>
                    <div className='flex items-center gap-2 mt-1.5'>
                      <Badge className='bg-white/20 text-white border-0'>
                        {influencer.commission_rate}% commission
                      </Badge>
                      <Badge
                        className={
                          influencer.status === 'active'
                            ? 'bg-emerald-400/20 text-emerald-100 border-0'
                            : 'bg-slate-400/20 text-slate-200 border-0'
                        }
                      >
                        {influencer.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className='flex gap-2 mt-4'>
                {influencer.phone && (
                  <Button
                    size='sm'
                    className='bg-emerald-500 hover:bg-emerald-600 text-white rounded-full'
                    onClick={() =>
                      window.open(
                        `https://wa.me/91${influencer.phone}`,
                        '_blank'
                      )
                    }
                  >
                    <MessageCircle className='h-4 w-4 mr-1' /> WhatsApp
                  </Button>
                )}
                {influencer.phone && (
                  <Button
                    size='sm'
                    variant='outline'
                    className='border-white/30 text-white hover:bg-white/10 rounded-full'
                    onClick={() =>
                      window.open(`tel:${influencer.phone}`, '_self')
                    }
                  >
                    <Phone className='h-4 w-4 mr-1' /> Call
                  </Button>
                )}
              </div>
              {influencer.bio && (
                <p className='mt-3 text-sm text-white/70'>{influencer.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className='grid grid-cols-3 gap-3 px-6 pt-4'>
              <div className='bg-slate-50 rounded-xl p-3 text-center'>
                <p className='text-lg font-bold text-slate-900'>
                  Rs.
                  {(influencer.total_sales || 0).toLocaleString('en-IN')}
                </p>
                <p className='text-xs text-slate-500'>Total Sales</p>
              </div>
              <div className='bg-slate-50 rounded-xl p-3 text-center'>
                <p className='text-lg font-bold text-slate-900'>{totalOrders}</p>
                <p className='text-xs text-slate-500'>Orders</p>
              </div>
              <div className='bg-slate-50 rounded-xl p-3 text-center'>
                <p className='text-lg font-bold text-emerald-600'>
                  Rs.{balance.toLocaleString('en-IN')}
                </p>
                <p className='text-xs text-slate-500'>Balance</p>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3 px-6 pt-3'>
              <div className='bg-slate-50 rounded-xl p-3 text-center'>
                <p className='text-lg font-bold text-slate-900'>
                  Rs.
                  {(
                    influencer.total_commission_earned || 0
                  ).toLocaleString('en-IN')}
                </p>
                <p className='text-xs text-slate-500'>Earned</p>
              </div>
              <div className='bg-slate-50 rounded-xl p-3 text-center'>
                <p className='text-lg font-bold text-slate-900'>
                  Rs.
                  {(
                    influencer.total_commission_paid || 0
                  ).toLocaleString('en-IN')}
                </p>
                <p className='text-xs text-slate-500'>Paid</p>
              </div>
            </div>

            {/* Tabs */}
            <div className='px-6 pt-4'>
              <div className='flex gap-2 border-b border-slate-200'>
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'sales', label: 'Sales History' },
                  { key: 'coupons', label: 'Coupons' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key as typeof activeTab)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === t.key
                        ? 'border-[#f59e0b] text-[#f59e0b]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className='px-6 py-4'>
              {activeTab === 'overview' && (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <h3 className='text-sm font-semibold text-slate-700'>
                      Contact Information
                    </h3>
                    <div className='bg-slate-50 rounded-lg p-3 space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-slate-500'>Email</span>
                        <span className='text-slate-900'>
                          {influencer.email || '—'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-slate-500'>Phone</span>
                        <span className='text-slate-900'>
                          {influencer.phone || '—'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-slate-500'>Commission Rate</span>
                        <span className='text-slate-900'>
                          {influencer.commission_rate}%
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-slate-500'>Joined</span>
                        <span className='text-slate-900'>
                          {new Date(influencer.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Sales */}
                  <div className='space-y-2'>
                    <h3 className='text-sm font-semibold text-slate-700'>
                      Recent Sales
                    </h3>
                    {sales && sales.length > 0 ? (
                      <div className='space-y-2'>
                        {sales.slice(0, 5).map((s) => (
                          <div
                            key={s.id}
                            className='flex items-center justify-between bg-slate-50 rounded-lg p-3 text-sm'
                          >
                            <div>
                              <p className='font-medium text-slate-900'>
                                {s.order?.order_number || '—'}
                              </p>
                              <p className='text-xs text-slate-400'>
                                {new Date(s.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className='text-right'>
                              <p className='font-medium text-slate-900'>
                                Rs.{s.commission_amount}
                              </p>
                              <Badge
                                className={
                                  s.status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }
                              >
                                {s.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-slate-400'>
                        No sales recorded yet.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'sales' && (
                <div className='space-y-3'>
                  {pendingCommissions.length > 0 && (
                    <div className='flex items-center justify-between'>
                      <p className='text-sm text-slate-500'>
                        {selectedCommissions.length} selected
                      </p>
                      <Button
                        size='sm'
                        className='bg-emerald-500 hover:bg-emerald-600 text-white'
                        onClick={handlePaySelected}
                        disabled={
                          payCommission.isPending ||
                          selectedCommissions.length === 0
                        }
                      >
                        {payCommission.isPending ? (
                          <Loader2 className='h-4 w-4 animate-spin mr-1' />
                        ) : (
                          <CheckCircle className='h-4 w-4 mr-1' />
                        )}
                        Mark Paid
                      </Button>
                    </div>
                  )}

                  {sales && sales.length > 0 ? (
                    <div className='space-y-2'>
                      {sales.map((s) => (
                        <div
                          key={s.id}
                          className={`flex items-center gap-3 bg-slate-50 rounded-lg p-3 text-sm ${
                            s.status === 'pending'
                              ? 'cursor-pointer hover:bg-slate-100'
                              : ''
                          }`}
                          onClick={() =>
                            s.status === 'pending' && toggleCommission(s.id)
                          }
                        >
                          {s.status === 'pending' && (
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedCommissions.includes(s.id)
                                  ? 'bg-[#f59e0b] border-[#f59e0b]'
                                  : 'border-slate-300'
                              }`}
                            >
                              {selectedCommissions.includes(s.id) && (
                                <CheckCircle className='h-3.5 w-3.5 text-white' />
                              )}
                            </div>
                          )}
                          <div className='flex-1'>
                            <p className='font-medium text-slate-900'>
                              {s.order?.order_number || '—'}
                            </p>
                            <p className='text-xs text-slate-400'>
                              {new Date(s.created_at).toLocaleDateString()} ·
                              Sale: Rs.{s.sale_amount}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='font-medium text-slate-900'>
                              Rs.{s.commission_amount}
                            </p>
                            <Badge
                              className={
                                s.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }
                            >
                              {s.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-slate-400 text-center py-8'>
                      No sales recorded yet.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'coupons' && (
                <div className='space-y-3'>
                  <Button
                    size='sm'
                    variant='outline'
                    className='w-full'
                    onClick={() => setCouponFormOpen(true)}
                  >
                    <Plus className='h-4 w-4 mr-1' /> Add Coupon Code
                  </Button>

                  {couponFormOpen && (
                    <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
                      <div className='flex items-center justify-between'>
                        <h4 className='text-sm font-semibold'>New Coupon</h4>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          onClick={() => setCouponFormOpen(false)}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                      <div className='grid grid-cols-2 gap-3'>
                        <div className='space-y-1'>
                          <Label className='text-xs'>Code *</Label>
                          <Input
                            value={String(couponForm.code || '')}
                            onChange={(e) =>
                              setCouponForm((f) => ({
                                ...f,
                                code: e.target.value.toUpperCase(),
                              }))
                            }
                            placeholder='ASHOK20'
                          />
                        </div>
                        <div className='space-y-1'>
                          <Label className='text-xs'>Type</Label>
                          <Select
                            value={String(couponForm.type || 'percentage')}
                            onValueChange={(v) =>
                              setCouponForm((f) => ({ ...f, type: v }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='percentage'>
                                Percentage
                              </SelectItem>
                              <SelectItem value='fixed'>Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-3'>
                        <div className='space-y-1'>
                          <Label className='text-xs'>
                            {couponForm.type === 'percentage'
                              ? 'Discount %'
                              : 'Discount Amount'}
                          </Label>
                          <Input
                            type='number'
                            value={String(couponForm.value || 0)}
                            onChange={(e) =>
                              setCouponForm((f) => ({
                                ...f,
                                value: Number(e.target.value),
                              }))
                            }
                          />
                        </div>
                        <div className='space-y-1'>
                          <Label className='text-xs'>Min Order (Rs.)</Label>
                          <Input
                            type='number'
                            value={String(couponForm.min_order_amount || 0)}
                            onChange={(e) =>
                              setCouponForm((f) => ({
                                ...f,
                                min_order_amount: Number(e.target.value),
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-3'>
                        <div className='space-y-1'>
                          <Label className='text-xs'>Valid From</Label>
                          <Input
                            type='date'
                            value={String(couponForm.valid_from || '')}
                            onChange={(e) =>
                              setCouponForm((f) => ({
                                ...f,
                                valid_from: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className='space-y-1'>
                          <Label className='text-xs'>Valid To</Label>
                          <Input
                            type='date'
                            value={String(couponForm.valid_to || '')}
                            onChange={(e) =>
                              setCouponForm((f) => ({
                                ...f,
                                valid_to: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <Label className='text-xs'>Max Uses</Label>
                        <Input
                          type='number'
                          value={
                            couponForm.max_uses === null
                              ? ''
                              : String(couponForm.max_uses)
                          }
                          onChange={(e) =>
                            setCouponForm((f) => ({
                              ...f,
                              max_uses: e.target.value
                                ? Number(e.target.value)
                                : null,
                            }))
                          }
                          placeholder='Unlimited'
                        />
                      </div>
                      <Button
                        size='sm'
                        className='w-full bg-[#f59e0b] text-slate-900'
                        onClick={handleCreateCoupon}
                        disabled={createCoupon.isPending || !couponForm.code}
                      >
                        {createCoupon.isPending ? (
                          <Loader2 className='h-4 w-4 animate-spin mr-1' />
                        ) : (
                          <Plus className='h-4 w-4 mr-1' />
                        )}
                        Create Coupon
                      </Button>
                    </div>
                  )}

                  {coupons && coupons.length > 0 ? (
                    <div className='space-y-2'>
                      {coupons.map((c) => (
                        <div
                          key={c.id}
                          className='flex items-center justify-between bg-slate-50 rounded-lg p-3'
                        >
                          <div>
                            <div className='flex items-center gap-2'>
                              <p className='font-mono text-sm font-medium text-slate-900'>
                                {c.code}
                              </p>
                              <Badge
                                className={
                                  c.is_active
                                    ? 'bg-emerald-100 text-emerald-800 text-xs'
                                    : 'bg-slate-100 text-slate-600 text-xs'
                                }
                              >
                                {c.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className='text-xs text-slate-400 mt-0.5'>
                              {c.type === 'percentage'
                                ? `${c.value}% off`
                                : `Rs.${c.value} off`}{' '}
                              · Used {c.usage_count || 0}
                              {c.max_uses ? ` / ${c.max_uses}` : ''} times
                            </p>
                          </div>
                          <Button
                            size='icon-sm'
                            variant='ghost'
                            onClick={() =>
                              navigator.clipboard.writeText(c.code)
                            }
                            title='Copy code'
                          >
                            <Copy className='h-4 w-4 text-slate-400' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-slate-400 text-center py-8'>
                      No coupons yet. Create one for this influencer.
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
