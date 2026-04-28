'use client'

import { useState } from 'react'
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, type Coupon } from '@/hooks/use-coupons'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function CouponsPage() {
  const { data: coupons } = useCoupons()
  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon()
  const deleteCoupon = useDeleteCoupon()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({
    code: '',
    type: 'percentage',
    value: 0,
    min_order_amount: 0,
    max_uses: null,
    per_customer_limit: 1,
    valid_from: '',
    valid_to: '',
    applicable_to: ['all'],
    is_active: true,
  })

  const reset = () => {
    setEditing(null)
    setForm({
      code: '',
      type: 'percentage',
      value: 0,
      min_order_amount: 0,
      max_uses: null,
      per_customer_limit: 1,
      valid_from: '',
      valid_to: '',
      applicable_to: ['all'],
      is_active: true,
    })
  }

  const handleSave = () => {
    const payload = { ...form }
    if (editing) {
      updateCoupon.mutate({ id: editing.id, updates: payload }, { onSuccess: () => setOpen(false) })
    } else {
      createCoupon.mutate(payload, { onSuccess: () => { setOpen(false); reset() } })
    }
  }

  const openEdit = (c: Coupon) => {
    setEditing(c)
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      min_order_amount: c.min_order_amount,
      max_uses: c.max_uses,
      per_customer_limit: c.per_customer_limit,
      valid_from: c.valid_from || '',
      valid_to: c.valid_to || '',
      applicable_to: c.applicable_to,
      is_active: c.is_active,
    })
    setOpen(true)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-slate-900'>Coupons & Offers</h1>
        <Button onClick={() => { reset(); setOpen(true) }}>
          <Plus className='h-4 w-4 mr-1' /> Add Coupon
        </Button>
      </div>

      <div className='bg-white border border-slate-100 rounded-xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-slate-500'>
              <tr>
                <th className='text-left px-4 py-3 font-medium'>Code</th>
                <th className='text-left px-4 py-3 font-medium'>Type</th>
                <th className='text-left px-4 py-3 font-medium'>Value</th>
                <th className='text-left px-4 py-3 font-medium'>Min Order</th>
                <th className='text-left px-4 py-3 font-medium'>Usage</th>
                <th className='text-left px-4 py-3 font-medium'>Valid Until</th>
                <th className='text-left px-4 py-3 font-medium'>Status</th>
                <th className='text-right px-4 py-3 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {coupons?.map((c) => (
                <tr key={c.id} className='hover:bg-slate-50'>
                  <td className='px-4 py-3 font-mono font-medium'>{c.code}</td>
                  <td className='px-4 py-3 capitalize'>{c.type.replace('_', ' ')}</td>
                  <td className='px-4 py-3'>
                    {c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? `Rs.${c.value}` : 'Free'}
                  </td>
                  <td className='px-4 py-3'>Rs.{c.min_order_amount}</td>
                  <td className='px-4 py-3'>
                    {c.usage_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ''}
                  </td>
                  <td className='px-4 py-3'>{c.valid_to ? new Date(c.valid_to).toLocaleDateString() : '—'}</td>
                  <td className='px-4 py-3'>
                    <Badge className={c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                      {c.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button size='sm' variant='ghost' onClick={() => openEdit(c)}>
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button size='sm' variant='ghost' className='text-red-600' onClick={() => deleteCoupon.mutate(c.id)}>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Code</Label>
              <Input
                value={form.code as string}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder='ALIGN20'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Type</Label>
                <Select value={form.type as string} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='percentage'>Percentage</SelectItem>
                    <SelectItem value='fixed'>Fixed Amount</SelectItem>
                    <SelectItem value='free_shipping'>Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Value</Label>
                <Input
                  type='number'
                  value={form.value as number}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Min Order</Label>
                <Input type='number' value={form.min_order_amount as number} onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })} />
              </div>
              <div className='space-y-1'>
                <Label>Max Uses</Label>
                <Input type='number' value={(form.max_uses as number | null) ?? ''} onChange={(e) => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })} />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Valid From</Label>
                <Input type='date' value={form.valid_from as string} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
              </div>
              <div className='space-y-1'>
                <Label>Valid To</Label>
                <Input type='date' value={form.valid_to as string} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} />
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <Label>Active</Label>
              <Switch checked={form.is_active as boolean} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
            <Button className='w-full bg-[#f59e0b] text-slate-900' onClick={handleSave}>
              {editing ? 'Update' : 'Create'} Coupon
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
