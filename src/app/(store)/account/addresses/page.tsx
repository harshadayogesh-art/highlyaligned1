'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  type Address,
} from '@/hooks/use-addresses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
  X,
} from 'lucide-react'

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

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
  is_default: false,
}

export default function MyAddressesPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { data: addresses, isLoading: addressesLoading } = useAddresses(user?.id)
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()
  const setDefaultAddress = useSetDefaultAddress()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/account/addresses')
    }
  }, [user, isLoading, router])

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setDialogOpen(true)
  }

  const openEdit = (addr: Address) => {
    setEditingId(addr.id)
    setForm({
      name: addr.name,
      phone: addr.phone,
      email: addr.email || '',
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      landmark: addr.landmark || '',
      is_default: addr.is_default,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!user) return
    const payload = {
      user_id: user.id,
      ...form,
    }

    if (editingId) {
      await updateAddress.mutateAsync({ id: editingId, updates: form })
    } else {
      await createAddress.mutateAsync(payload)
    }

    setDialogOpen(false)
    setForm({ ...emptyForm })
    setEditingId(null)
  }

  const handleSetDefault = (addrId: string) => {
    if (!user) return
    setDefaultAddress.mutate({ userId: user.id, addressId: addrId })
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">My Addresses</h1>
        <Button size="sm" onClick={openAdd} className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900">
          <Plus className="h-4 w-4 mr-1" /> Add Address
        </Button>
      </div>

      {addressesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-100 rounded-xl">
          <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No saved addresses</p>
          <Button
            size="sm"
            onClick={openAdd}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white border rounded-xl p-4 ${
                addr.is_default ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900">{addr.name}</p>
                    {addr.is_default && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700">
                    {addr.line1}
                    {addr.line2 && `, ${addr.line2}`}
                  </p>
                  <p className="text-sm text-slate-700">
                    {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                  {addr.landmark && (
                    <p className="text-xs text-slate-500">Landmark: {addr.landmark}</p>
                  )}
                  <p className="text-sm text-slate-600 mt-1">Phone: {addr.phone}</p>
                  {addr.email && (
                    <p className="text-sm text-slate-600">Email: {addr.email}</p>
                  )}
                </div>
                <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => openEdit(addr)}>
                    <Pencil className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => setDeleteId(addr.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {!addr.is_default && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100 mt-2 h-7"
                  onClick={() => handleSetDefault(addr.id)}
                  disabled={setDefaultAddress.isPending}
                >
                  <Star className="h-3 w-3 mr-1" /> Set as Default
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                type="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address Line 1 *</Label>
              <Input
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
                placeholder="House no, building, street"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address Line 2</Label>
              <Input
                value={form.line2}
                onChange={(e) => setForm({ ...form, line2: e.target.value })}
                placeholder="Area, colony"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City *</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Mumbai"
                />
              </div>
              <div className="space-y-1.5">
                <Label>PIN Code *</Label>
                <Input
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="400001"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>State *</Label>
              <Select
                value={form.state}
                onValueChange={(v) => setForm({ ...form, state: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Landmark</Label>
              <Input
                value={form.landmark}
                onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                placeholder="Near railway station"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                checked={form.is_default}
                onCheckedChange={(v) => setForm({ ...form, is_default: v as boolean })}
              />
              <Label className="text-sm font-normal">Set as default address</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-slate-900"
                onClick={handleSubmit}
                disabled={
                  !form.name ||
                  !form.phone ||
                  !form.line1 ||
                  !form.city ||
                  !form.state ||
                  !form.pincode ||
                  createAddress.isPending ||
                  updateAddress.isPending
                }
              >
                {createAddress.isPending || updateAddress.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  'Update'
                ) : (
                  'Save Address'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Are you sure you want to delete this address? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId) deleteAddress.mutate(deleteId)
                setDeleteId(null)
              }}
              disabled={deleteAddress.isPending}
            >
              {deleteAddress.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
