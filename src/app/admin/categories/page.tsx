'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { toast } from 'sonner'
import {
  Plus,
  Edit2,
  Trash2,
  ImageIcon,
  X,
  Layers,
  Tag,
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  type: 'product' | 'service'
  parent_id: string | null
  image: string | null
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

interface CategoryForm {
  name: string
  slug: string
  type: 'product' | 'service'
  parent_id: string
  image: string
  description: string
  sort_order: number
  is_active: boolean
}

const defaultForm: CategoryForm = {
  name: '',
  slug: '',
  type: 'product',
  parent_id: '',
  image: '',
  description: '',
  sort_order: 0,
  is_active: true,
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CategoriesPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(defaultForm)
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  // ── Fetch all categories ──────────────────────────────────────────────────
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories', typeFilter],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (typeFilter !== 'all') query = query.eq('type', typeFilter)

      const { data, error } = await query
      if (error) throw error
      return data as Category[]
    },
  })

  // ── Save (create / update) ────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (values: CategoryForm) => {
      const supabase = createClient()
      const payload = {
        name: values.name,
        slug: values.slug,
        type: values.type,
        parent_id: values.parent_id || null,
        image: values.image || null,
        description: values.description || null,
        sort_order: values.sort_order,
        is_active: values.is_active,
      }
      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setModalOpen(false)
      toast.success(editingId ? 'Category updated' : 'Category created')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()

      // Check if any products / services use this category
      const { data: linked, error: linkErr } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id)
        .limit(1)
      if (linkErr) throw linkErr
      if (linked && linked.length > 0) {
        throw new Error(
          'Cannot delete — products are assigned to this category. Reassign them first.'
        )
      }

      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setForm((f) => ({ ...f, image: url }))
    } catch (err: any) {
      toast.error('Image upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  // ── Open modal helpers ────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug,
      type: cat.type,
      parent_id: cat.parent_id || '',
      image: cat.image || '',
      description: cat.description || '',
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    })
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    if (!form.slug.trim()) return toast.error('Slug is required')
    saveMutation.mutate(form)
  }

  // Parent options (only top-level of same type, excluding self)
  const parentOptions = categories.filter(
    (c) => c.type === form.type && c.id !== editingId && !c.parent_id
  )

  const productCategories = categories.filter((c) => c.type === 'product')
  const serviceCategories = categories.filter((c) => c.type === 'service')

  const renderTable = (list: Category[], label: string, icon: React.ReactNode) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-slate-800">{label}</h2>
        <Badge variant="secondary">{list.length}</Badge>
      </div>
      {list.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center text-slate-400">
          No {label.toLowerCase()} yet. Click <strong>Add Category</strong> to create one.
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600 w-14">Image</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 hidden sm:table-cell">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 hidden md:table-cell">Description</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600 w-20">Order</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600 w-20">Active</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((cat) => (
                <tr key={cat.id} className="border-t hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="relative w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border">
                      {cat.image ? (
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <ImageIcon className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{cat.name}</p>
                    {cat.parent_id && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Sub-category
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {cat.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-500 max-w-[200px] truncate">
                    {cat.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">{cat.sort_order}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        cat.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {cat.is_active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(cat)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete category "${cat.name}"? This cannot be undone.`
                            )
                          ) {
                            deleteMutation.mutate(cat.id)
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage product &amp; service categories with images
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Type filter tabs */}
          <div className="flex rounded-lg border overflow-hidden text-sm">
            {(['all', 'product', 'service'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  typeFilter === t
                    ? 'bg-[#f59e0b] text-slate-900 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>
          <Button
            onClick={openAdd}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading categories…</div>
      ) : typeFilter === 'all' ? (
        <div className="space-y-8">
          {renderTable(
            productCategories,
            'Product Categories',
            <Tag className="h-5 w-5 text-amber-500" />
          )}
          {renderTable(
            serviceCategories,
            'Service Categories',
            <Layers className="h-5 w-5 text-violet-500" />
          )}
        </div>
      ) : (
        renderTable(
          categories,
          typeFilter === 'product' ? 'Product Categories' : 'Service Categories',
          typeFilter === 'product' ? (
            <Tag className="h-5 w-5 text-amber-500" />
          ) : (
            <Layers className="h-5 w-5 text-violet-500" />
          )
        )
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Type */}
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    type: v as 'product' | 'service',
                    parent_id: '',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: editingId ? f.slug : generateSlug(e.target.value),
                  }))
                }
                placeholder="e.g. Crystals & Gemstones"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="e.g. crystals-gemstones"
              />
            </div>

            {/* Category Image */}
            <div className="space-y-2">
              <Label>Category Image</Label>
              <div className="flex items-center gap-3">
                {/* Preview */}
                <div className="relative w-20 h-20 rounded-xl bg-slate-100 overflow-hidden border-2 border-dashed border-slate-300 flex-shrink-0">
                  {form.image ? (
                    <>
                      <Image
                        src={form.image}
                        alt="Category"
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, image: '' }))}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-slate-300 hover:border-[#f59e0b] rounded-xl p-4 text-center transition-colors">
                      {uploading ? (
                        <p className="text-sm text-slate-500">Uploading…</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-slate-600">
                            Click to upload image
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            PNG, JPG, WEBP up to 5MB
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                placeholder="Short description shown on category page"
              />
            </div>

            {/* Parent Category */}
            {parentOptions.length > 0 && (
              <div className="space-y-2">
                <Label>Parent Category (optional)</Label>
                <Select
                  value={form.parent_id || 'none'}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      parent_id: v === 'none' ? '' : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {parentOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sort order & Active */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, is_active: v }))
                    }
                  />
                  <span className="text-sm text-slate-600">
                    {form.is_active ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending || uploading}
                className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-900"
              >
                {saveMutation.isPending
                  ? 'Saving…'
                  : editingId
                  ? 'Update Category'
                  : 'Create Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
