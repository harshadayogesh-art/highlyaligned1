'use client'

import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { useServices, type ServiceRow } from '@/hooks/use-services'
import { useCategories } from '@/hooks/use-categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, X, Loader2, Clock } from 'lucide-react'
import Image from 'next/image'

function CategorySelect({ value, onChange }: { value: string; onChange: (val: string | null) => void }) {
  const { data: categories } = useCategories('service')
  return (
    <select
      className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm bg-white"
      value={value}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">No Category</option>
      {categories?.map((cat) => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  )
}

export default function AdminServicesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const { data: services, isLoading } = useServices()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Partial<ServiceRow>>({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      price: 0,
      duration_minutes: 60,
      buffer_time_minutes: 15,
      mode: ['video'],
      color_code: '#8b5cf6',
      is_active: true,
      is_featured: false,
      image_url: '',
      category_id: null,
      sort_order: 0,
      working_hours_start: '10:00',
      working_hours_end: '19:00',
      slot_interval_minutes: 30,
      blocked_dates: [],
    },
  })

  const imageUrl = watch('image_url')

  const openAdd = () => {
    setEditingId(null)
    reset({
      name: '',
      slug: '',
      description: '',
      price: 0,
      duration_minutes: 60,
      buffer_time_minutes: 15,
      mode: ['video'],
      color_code: '#8b5cf6',
      is_active: true,
      is_featured: false,
      image_url: '',
      category_id: null,
      sort_order: 0,
      working_hours_start: '10:00',
      working_hours_end: '19:00',
      slot_interval_minutes: 30,
      blocked_dates: [],
    })
    setModalOpen(true)
  }

  const openEdit = (service: ServiceRow) => {
    setEditingId(service.id)
    reset({
      ...service,
    })
    setModalOpen(true)
  }

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')

  const saveMutation = useMutation({
    mutationFn: async (values: Partial<ServiceRow>) => {
      const supabase = createClient()
      const payload = { ...values }
      delete (payload as Record<string, unknown>).id
      delete (payload as Record<string, unknown>).created_at

      if (editingId) {
        const { error } = await supabase.from('services').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('services').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setModalOpen(false)
      toast.success(editingId ? 'Service updated' : 'Service created')
    },
    onError: (err: any) => {
      toast.error(err.message)
      // If table missing columns, we will see it here
      console.error(err)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('Service deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      if (url) setValue('image_url', url)
    } catch (err: any) {
      toast.error('Image upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Manage Services</h1>
        <Button onClick={openAdd} className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Service
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-slate-500">Loading services...</p>
        ) : services?.length === 0 ? (
          <p className="text-slate-500">No services found. Add one to get started.</p>
        ) : (
          services?.map((service) => (
            <div key={service.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              {service.image_url && (
                <div className="relative h-40 w-full bg-slate-100">
                  <Image src={service.image_url} alt={service.name} fill className="object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-900">{service.name}</h3>
                  <Badge variant="outline" className={service.is_active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500'}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{service.description || 'No description provided.'}</p>
                
                <div className="flex items-center gap-4 text-sm text-slate-700 font-medium mb-4">
                  <div>₹{service.price}</div>
                  <div>•</div>
                  <div>{service.duration_minutes} mins</div>
                  {service.color_code && (
                    <>
                      <div>•</div>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: service.color_code }} />
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button variant="outline" size="sm" onClick={() => openEdit(service)}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
                    if (window.confirm('Delete this service?')) deleteMutation.mutate(service.id)
                  }}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
            
            <div className="space-y-2">
              <Label>Service Image</Label>
              {imageUrl ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                  <Image src={imageUrl} alt="" fill className="object-cover" />
                  <button type="button" onClick={() => setValue('image_url', '')} className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="text-center">
                    <Plus className="mx-auto h-6 w-6 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500">Upload Image</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
              {uploading && <p className="text-xs text-slate-500 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Uploading...</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Name *</Label>
                <Input required {...register('name')} onChange={(e) => {
                  register('name').onChange(e)
                  if (!editingId) setValue('slug', generateSlug(e.target.value))
                }} />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input required {...register('slug')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={3} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Price (₹) *</Label>
                <Input type="number" required {...register('price', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Duration (mins) *</Label>
                <Input type="number" required {...register('duration_minutes', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Theme Color</Label>
                <Input type="color" className="h-10 p-1" {...register('color_code')} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Buffer Time (mins)</Label>
                <Input type="number" {...register('buffer_time_minutes', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" {...register('sort_order', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <CategorySelect value={watch('category_id') || ''} onChange={(v) => setValue('category_id', v || null)} />
              </div>
            </div>

            {/* Mode */}
            <div className="space-y-2">
              <Label>Session Modes</Label>
              <div className="flex flex-wrap gap-4">
                {(['video', 'phone', 'chat', 'in_person'] as const).map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={(watch('mode') || []).includes(m)}
                      onCheckedChange={(checked) => {
                        const current = watch('mode') || []
                        if (checked) {
                          setValue('mode', [...current, m])
                        } else {
                          setValue('mode', current.filter((x) => x !== m))
                        }
                      }}
                    />
                    <span className="capitalize">{m.replace('_', '-')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-3 pt-3 border-t">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Availability Settings
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Working Hours Start</Label>
                  <Input type="time" {...register('working_hours_start')} />
                </div>
                <div className="space-y-2">
                  <Label>Working Hours End</Label>
                  <Input type="time" {...register('working_hours_end')} />
                </div>
                <div className="space-y-2">
                  <Label>Slot Interval (mins)</Label>
                  <select
                    className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm"
                    value={watch('slot_interval_minutes') || 30}
                    onChange={(e) => setValue('slot_interval_minutes', Number(e.target.value))}
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2 border-t mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Active (Visible to customers)</Label>
                <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-base">Show on Home Page (Featured)</Label>
                <Switch checked={watch('is_featured')} onCheckedChange={(v) => setValue('is_featured', v)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending || uploading} className="bg-amber-500 hover:bg-amber-600 text-white">
                {saveMutation.isPending ? 'Saving...' : 'Save Service'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
