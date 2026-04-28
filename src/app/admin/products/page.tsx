'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { productSchema, type ProductFormValues } from '@/schemas/product'
import { useCategories } from '@/hooks/use-categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Plus, Search, Trash2, Edit2, X, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react'

const statusColors: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-slate-100 text-slate-800',
  out_of_stock: 'bg-red-100 text-red-800',
  hidden: 'bg-orange-100 text-orange-800',
}

interface ProductRow {
  id: string
  name: string
  slug: string
  description: string | null
  how_to_use: string | null
  energization_process: string | null
  price: number
  mrp: number
  stock: number
  sku: string | null
  weight_grams: number | null
  gst_applicable: boolean
  gst_rate: number
  status: string
  images: string[]
  category_id: string | null
  categories: { name: string } | null
  metadata?: { is_featured?: boolean } & Record<string, unknown>
}

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [aiFilling, setAiFilling] = useState(false)
  const queryClient = useQueryClient()
  const limit = 20

  const { data: categories } = useCategories('product')

  const { data: productsData } = useQuery({
    queryKey: ['admin-products', search, categoryFilter, statusFilter, page],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('products')
        .select('id,name,slug,description,how_to_use,energization_process,price,mrp,stock,sku,weight_grams,gst_applicable,gst_rate,status,images,category_id,categories(name),metadata', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (categoryFilter) query = query.eq('category_id', categoryFilter)
      if (statusFilter) query = query.eq('status', statusFilter)
      if (search) query = query.ilike('name', `%${search}%`)

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error
      // Supabase returns joined relations as arrays; normalise categories to object | null
      const rows = (data ?? []).map((p: any) => ({
        ...p,
        categories: Array.isArray(p.categories) ? (p.categories[0] ?? null) : p.categories,
      })) as ProductRow[]
      return { data: rows, count: count ?? 0 }
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      how_to_use: '',
      energization_process: '',
      category_id: '',
      mrp: 0,
      price: 0,
      stock: 0,
      sku: '',
      weight_grams: 0,
      images: [],
      gst_applicable: false,
      gst_rate: 0,
      status: 'draft',
      is_featured: false,
    },
  })

  const gstApplicable = watch('gst_applicable')
  const images = watch('images')

  // ── AI Auto-Fill ──────────────────────────────────────────────────────────
  const handleAIFill = async () => {
    const name = watch('name')
    if (!name || name.trim().length < 2) {
      toast.error('Please enter a product name first')
      return
    }
    setAiFilling(true)
    try {
      const categoryId = watch('category_id')
      const categoryName = categories?.find((c) => c.id === categoryId)?.name
      const res = await fetch('/api/ai/fill-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: name.trim(), categoryName }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'AI fill failed')
      }
      const d = json.data
      if (d.description)          setValue('description', d.description)
      if (d.how_to_use)           setValue('how_to_use', d.how_to_use)
      if (d.energization_process) setValue('energization_process', d.energization_process)
      if (d.sku_suggestion)       setValue('sku', d.sku_suggestion)
      if (d.weight_estimate_grams) setValue('weight_grams', d.weight_estimate_grams)
      toast.success('✨ AI filled in the product details! Review and adjust as needed.')
    } catch (err: any) {
      toast.error('AI fill failed: ' + err.message)
    } finally {
      setAiFilling(false)
    }
  }

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const openAdd = () => {
    setEditingId(null)
    reset({
      name: '', slug: '', description: '', how_to_use: '', energization_process: '',
      category_id: '', mrp: 0, price: 0, stock: 0, sku: '', weight_grams: 0,
      images: [], gst_applicable: false, gst_rate: 0, status: 'draft', is_featured: false,
    })
    setModalOpen(true)
  }

  const openEdit = (product: ProductRow) => {
    setEditingId(product.id)
    reset({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      how_to_use: product.how_to_use || '',
      energization_process: product.energization_process || '',
      category_id: product.category_id || '',
      mrp: product.mrp,
      price: product.price,
      stock: product.stock,
      sku: product.sku || '',
      weight_grams: product.weight_grams || 0,
      images: product.images ?? [],
      gst_applicable: product.gst_applicable ?? false,
      gst_rate: product.gst_rate ?? 0,
      status: product.status as ProductFormValues['status'],
      is_featured: product.metadata?.is_featured ?? false,
    })
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const supabase = createClient()
      const payload = {
        ...values,
        category_id: values.category_id || null,
        sku: values.sku || null,
        weight_grams: values.weight_grams || null,
        metadata: { is_featured: values.is_featured },
      }
      delete (payload as any).is_featured
      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setModalOpen(false)
      toast.success(editingId ? 'Product updated' : 'Product created')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const supabase = createClient()
      
      const { data: orderItems, error: oiError } = await supabase
        .from('order_items')
        .select('product_id')
        .in('product_id', ids)
        .limit(1)

      if (oiError) throw oiError
      if (orderItems && orderItems.length > 0) {
        throw new Error('Cannot delete — product has order history. Set to Hidden instead.')
      }

      const { error } = await supabase.from('products').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setSelectedIds(new Set())
      toast.success('Products deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    const newImages = [...images]
    for (const file of Array.from(files)) {
      if (newImages.length >= 5) break
      try {
        const url = await uploadToCloudinary(file)
        if (url) newImages.push(url)
      } catch (err: any) {
        toast.error('Image upload failed: ' + err.message)
      }
    }
    setValue('images', newImages)
    setUploading(false)
  }

  const handleRemoveImage = async (idx: number) => {
    // Cloudinary deletion requires backend signature. For MVP, we just remove the URL from array.
    setValue(
      'images',
      images.filter((_, i) => i !== idx)
    )
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === (productsData?.data.length ?? 0)) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(productsData?.data.map((p) => p.id) ?? []))
    }
  }

  const totalPages = Math.ceil((productsData?.count ?? 0) / limit)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <Button onClick={openAdd} className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900">
          <Plus className="h-4 w-4 mr-1" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter || 'all'}
          onValueChange={(v) => { setCategoryFilter(v === 'all' ? '' : v); setPage(1) }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
          <span className="text-sm text-slate-600">{selectedIds.size} selected</span>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete the selected products?')) {
                deleteMutation.mutate(Array.from(selectedIds))
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 w-10">
                <Checkbox
                  checked={selectedIds.size > 0 && selectedIds.size === (productsData?.data.length ?? 0)}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Image</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Name</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Category</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">MRP</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Price</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Stock</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
              <th className="px-3 py-2 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {productsData?.data.map((product) => (
              <tr key={product.id} className="border-t hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Checkbox
                    checked={selectedIds.has(product.id)}
                    onCheckedChange={() => toggleSelect(product.id)}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="relative w-10 h-10 rounded bg-slate-100 overflow-hidden">
                    <Image src={product.images[0] || '/placeholder.svg'} alt="" fill className="object-cover" sizes="40px" />
                  </div>
                </td>
                <td className="px-3 py-2 font-medium text-slate-900">{product.name}</td>
                <td className="px-3 py-2 text-slate-500">{product.categories?.name || '-'}</td>
                <td className="px-3 py-2 text-slate-400 line-through">₹{product.mrp}</td>
                <td className="px-3 py-2 font-semibold text-emerald-600">₹{product.price}</td>
                <td className="px-3 py-2">
                  {product.stock < 10 ? (
                    <Badge className="bg-orange-100 text-orange-800 text-xs">Low ({product.stock})</Badge>
                  ) : (
                    product.stock
                  )}
                </td>
                <td className="px-3 py-2">
                  <Badge className={`text-xs ${statusColors[product.status]}`}>
                    {product.status}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(product)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
                          deleteMutation.mutate([product.id])
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {productsData?.data.map((product) => (
          <div key={product.id} className="border rounded-lg p-3 flex gap-3">
            <div className="relative w-20 h-20 rounded bg-slate-100 overflow-hidden flex-shrink-0">
              <Image src={product.images[0] || '/placeholder.svg'} alt="" fill className="object-cover" sizes="80px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{product.name}</p>
              <p className="text-xs text-slate-500">{product.categories?.name || '-'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold text-emerald-600">₹{product.price}</span>
                <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge className={`text-xs ${statusColors[product.status]}`}>{product.status}</Badge>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(product)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => {
                      if (window.confirm(`Delete "${product.name}"?`)) {
                        deleteMutation.mutate([product.id])
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">

            {/* ✨ AI Fill Banner */}
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-50 to-amber-50 border border-violet-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium text-slate-700">AI Product Assistant</span>
                <span className="text-xs text-slate-500 hidden sm:inline">— Enter a product name, then let AI fill the details</span>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={aiFilling}
                onClick={handleAIFill}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 disabled:opacity-70"
              >
                {aiFilling ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> AI Fill</>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  {...register('name')}
                  onChange={(e) => {
                    register('name').onChange(e)
                    if (!editingId) {
                      setValue('slug', generateSlug(e.target.value))
                    }
                  }}
                  placeholder="e.g. Amethyst Crystal Mala"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input {...register('slug')} placeholder="auto-generated from name" />
                {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>How to Use</Label>
              <Textarea {...register('how_to_use')} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Energization Process</Label>
              <Textarea {...register('energization_process')} rows={2} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={watch('category_id')} onValueChange={(v) => setValue('category_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={watch('status')} onValueChange={(v) => setValue('status', v as ProductFormValues['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>MRP *</Label>
                <Input type="number" step="0.01" {...register('mrp', { valueAsNumber: true })} />
                {errors.mrp && <p className="text-xs text-red-500">{errors.mrp.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Offer Price *</Label>
                <Input type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
                {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" {...register('stock', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Weight (g)</Label>
                <Input type="number" {...register('weight_grams', { valueAsNumber: true })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input {...register('sku')} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>GST Applicable</Label>
                  <Switch checked={gstApplicable} onCheckedChange={(v) => setValue('gst_applicable', v)} />
                </div>
                {gstApplicable && (
                  <Select value={String(watch('gst_rate'))} onValueChange={(v) => setValue('gst_rate', Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="GST Rate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Show on Home Page</Label>
                  <Switch checked={watch('is_featured')} onCheckedChange={(v) => setValue('is_featured', v)} />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Images (max 5)</Label>
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded bg-slate-100 overflow-hidden">
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-16 h-16 rounded border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-[#f59e0b]">
                    <Plus className="h-5 w-5 text-slate-400" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              {uploading && <p className="text-xs text-slate-500">Uploading...</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900">
                {saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
