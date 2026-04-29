'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAllBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, type Banner } from '@/hooks/use-banners'
import { useAllPages, useCreatePage, useUpdatePage, useDeletePage, type CmsPage } from '@/hooks/use-pages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { PageBlocksEditor } from '@/components/admin/page-blocks-editor'

export default function CmsPage() {
  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-bold text-slate-900'>Content Management</h1>
      <Tabs defaultValue='banners'>
        <TabsList>
          <TabsTrigger value='banners'>Banners</TabsTrigger>
          <TabsTrigger value='pages'>Pages</TabsTrigger>
          <TabsTrigger value='page_blocks'>Page Blocks</TabsTrigger>
          <TabsTrigger value='footer'>Footer</TabsTrigger>
          <TabsTrigger value='legal'>Legal Pages</TabsTrigger>
        </TabsList>
        <TabsContent value='banners'><BannersTab /></TabsContent>
        <TabsContent value='pages'><PagesTab /></TabsContent>
        <TabsContent value='page_blocks'><PageBlocksEditor /></TabsContent>
        <TabsContent value='footer'><FooterTab /></TabsContent>
        <TabsContent value='legal'><LegalPagesTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function BannersTab() {
  const { data: banners } = useAllBanners()
  const createBanner = useCreateBanner()
  const updateBanner = useUpdateBanner()
  const deleteBanner = useDeleteBanner()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({
    title: '', image: '', link: '', position: 'hero', sort_order: 0, start_date: '', end_date: '', is_active: true,
  })

  const reset = () => {
    setEditing(null)
    setForm({ title: '', image: '', link: '', position: 'hero', sort_order: 0, start_date: '', end_date: '', is_active: true })
  }

  const openEdit = (b: Banner) => {
    setEditing(b)
    setForm({ title: b.title, image: b.image, link: b.link || '', position: b.position, sort_order: b.sort_order, start_date: b.start_date || '', end_date: b.end_date || '', is_active: b.is_active })
    setOpen(true)
  }

  const handleSave = () => {
    if (editing) {
      updateBanner.mutate({ id: editing.id, updates: form }, { onSuccess: () => setOpen(false) })
    } else {
      createBanner.mutate(form, { onSuccess: () => { setOpen(false); reset() } })
    }
  }

  const move = (index: number, dir: number) => {
    const sorted = [...(banners || [])].sort((a, b) => a.sort_order - b.sort_order)
    const target = index + dir
    if (target < 0 || target >= sorted.length) return
    const current = sorted[index]
    const swap = sorted[target]
    updateBanner.mutate({ id: current.id, updates: { sort_order: swap.sort_order } })
    updateBanner.mutate({ id: swap.id, updates: { sort_order: current.sort_order } })
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button onClick={() => { reset(); setOpen(true) }}><Plus className='h-4 w-4 mr-1' /> Add Banner</Button>
      </div>
      <div className='bg-white border border-slate-100 rounded-xl overflow-hidden'>
        <table className='w-full text-sm'>
          <thead className='bg-slate-50 text-slate-500'>
            <tr><th className='text-left px-4 py-3'>Image</th><th className='text-left px-4 py-3'>Title</th><th className='text-left px-4 py-3'>Position</th><th className='text-left px-4 py-3'>Active</th><th className='text-right px-4 py-3'>Actions</th></tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {banners?.sort((a, b) => a.sort_order - b.sort_order).map((b, i, arr) => (
              <tr key={b.id} className='hover:bg-slate-50'>
                <td className='px-4 py-3'><div className='w-16 h-10 rounded bg-slate-100 bg-cover bg-center' style={{ backgroundImage: `url(${b.image})` }} /></td>
                <td className='px-4 py-3 font-medium'>{b.title}</td>
                <td className='px-4 py-3 capitalize'>{b.position.replace('_', ' ')}</td>
                <td className='px-4 py-3'><Switch checked={b.is_active} onCheckedChange={(v) => updateBanner.mutate({ id: b.id, updates: { is_active: v } })} /></td>
                <td className='px-4 py-3 text-right'>
                  <div className='flex items-center justify-end gap-1'>
                    <Button size='sm' variant='ghost' disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className='h-4 w-4' /></Button>
                    <Button size='sm' variant='ghost' disabled={i === arr.length - 1} onClick={() => move(i, 1)}><ArrowDown className='h-4 w-4' /></Button>
                    <Button size='sm' variant='ghost' onClick={() => openEdit(b)}><Pencil className='h-4 w-4' /></Button>
                    <Button size='sm' variant='ghost' className='text-red-600' onClick={() => deleteBanner.mutate(b.id)}><Trash2 className='h-4 w-4' /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader><DialogTitle>{editing ? 'Edit Banner' : 'Add Banner'}</DialogTitle></DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'><Label>Title</Label><Input value={form.title as string} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className='space-y-1'><Label>Image URL</Label><Input value={form.image as string} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder='https://...' /></div>
            <div className='space-y-1'><Label>Link</Label><Input value={form.link as string} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder='/shop or https://...' /></div>
            <div className='space-y-1'><Label>Position</Label>
              <select className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm' value={form.position as string} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                <option value='hero'>Hero</option><option value='section_2'>Section 2</option><option value='section_3'>Section 3</option>
              </select>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'><Label>Start Date</Label><Input type='date' value={form.start_date as string} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className='space-y-1'><Label>End Date</Label><Input type='date' value={form.end_date as string} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <Button className='w-full bg-[#f59e0b] text-slate-900' onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PagesTab() {
  const { data: pages } = useAllPages()
  const createPage = useCreatePage()
  const updatePage = useUpdatePage()
  const deletePage = useDeletePage()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CmsPage | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({ slug: '', title: '', content: '', meta_title: '', meta_description: '', og_image: '', is_active: true })

  const reset = () => {
    setEditing(null)
    setForm({ slug: '', title: '', content: '', meta_title: '', meta_description: '', og_image: '', is_active: true })
  }

  const openEdit = (p: CmsPage) => {
    setEditing(p)
    setForm({ slug: p.slug, title: p.title, content: p.content || '', meta_title: p.meta_title || '', meta_description: p.meta_description || '', og_image: p.og_image || '', is_active: p.is_active })
    setOpen(true)
  }

  const handleSave = () => {
    if (editing) {
      updatePage.mutate({ id: editing.id, updates: form }, { onSuccess: () => setOpen(false) })
    } else {
      createPage.mutate(form, { onSuccess: () => { setOpen(false); reset() } })
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button onClick={() => { reset(); setOpen(true) }}><Plus className='h-4 w-4 mr-1' /> Add Page</Button>
      </div>
      <div className='bg-white border border-slate-100 rounded-xl overflow-hidden'>
        <table className='w-full text-sm'>
          <thead className='bg-slate-50 text-slate-500'>
            <tr><th className='text-left px-4 py-3'>Slug</th><th className='text-left px-4 py-3'>Title</th><th className='text-left px-4 py-3'>Active</th><th className='text-right px-4 py-3'>Actions</th></tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {pages?.map((p) => (
              <tr key={p.id} className='hover:bg-slate-50'>
                <td className='px-4 py-3 font-mono text-xs'>/{p.slug}</td>
                <td className='px-4 py-3 font-medium'>{p.title}</td>
                <td className='px-4 py-3'><Switch checked={p.is_active} onCheckedChange={(v) => updatePage.mutate({ id: p.id, updates: { is_active: v } })} /></td>
                <td className='px-4 py-3 text-right'>
                  <div className='flex items-center justify-end gap-1'>
                    <Button size='sm' variant='ghost' onClick={() => openEdit(p)}><Pencil className='h-4 w-4' /></Button>
                    <Button size='sm' variant='ghost' className='text-red-600' onClick={() => deletePage.mutate(p.id)}><Trash2 className='h-4 w-4' /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader><DialogTitle>{editing ? 'Edit Page' : 'Add Page'}</DialogTitle></DialogHeader>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'><Label>Slug</Label><Input value={form.slug as string} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div className='space-y-1'><Label>Title</Label><Input value={form.title as string} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            </div>
            <div className='space-y-1'><Label>Content</Label><textarea className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[200px]' value={form.content as string} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <div className='space-y-1'><Label>Meta Title</Label><Input value={form.meta_title as string} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} /></div>
            <div className='space-y-1'><Label>Meta Description</Label><Input value={form.meta_description as string} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} /></div>
            <div className='space-y-1'><Label>OG Image URL</Label><Input value={form.og_image as string} onChange={(e) => setForm({ ...form, og_image: e.target.value })} /></div>
            <Button className='w-full bg-[#f59e0b] text-slate-900' onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LegalPagesTab() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<{ id: string; slug: string; title: string; content: string; meta_description: string; is_published: boolean; last_updated: string; updated_at: string } | null>(null)
  const [form, setForm] = useState({ slug: '', title: '', content: '', meta_description: '', is_published: true })
  const [saving, setSaving] = useState(false)

  const { data: pages, refetch } = useQuery({
    queryKey: ['legal-pages-admin'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('legal_pages').select('*').order('slug')
      if (error) throw error
      return data as { id: string; slug: string; title: string; content: string; meta_description: string; is_published: boolean; last_updated: string; updated_at: string }[]
    },
  })

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and Content are required')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      if (editing) {
        const { error } = await supabase.from('legal_pages').update({
          title: form.title.trim(),
          content: form.content,
          meta_description: form.meta_description.trim(),
          is_published: form.is_published,
          last_updated: new Date().toISOString().slice(0, 10),
        }).eq('id', editing.id)
        if (error) throw error
        toast.success('Legal page updated successfully')
      } else {
        const { error } = await supabase.from('legal_pages').insert({
          slug: form.slug.trim(),
          title: form.title.trim(),
          content: form.content,
          meta_description: form.meta_description.trim(),
          is_published: form.is_published,
        })
        if (error) throw error
        toast.success('Legal page created successfully')
      }
      setOpen(false)
      setEditing(null)
      setForm({ slug: '', title: '', content: '', meta_description: '', is_published: true })
      refetch()
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to save legal page')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button onClick={() => { setEditing(null); setForm({ slug: '', title: '', content: '', meta_description: '', is_published: true }); setOpen(true) }}><Plus className='h-4 w-4 mr-1' /> Add Legal Page</Button>
      </div>
      <div className='bg-white border border-slate-100 rounded-xl overflow-hidden'>
        <table className='w-full text-sm'>
          <thead className='bg-slate-50 text-slate-500'>
            <tr>
              <th className='text-left px-4 py-3'>Slug</th>
              <th className='text-left px-4 py-3'>Title</th>
              <th className='text-left px-4 py-3'>Last Updated</th>
              <th className='text-left px-4 py-3'>Published</th>
              <th className='text-right px-4 py-3'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {pages?.map((p) => (
              <tr key={p.id} className='hover:bg-slate-50'>
                <td className='px-4 py-3 font-mono text-xs'>{p.slug}</td>
                <td className='px-4 py-3 font-medium'>{p.title}</td>
                <td className='px-4 py-3 text-slate-400'>{new Date(p.last_updated).toLocaleDateString('en-IN')}</td>
                <td className='px-4 py-3'>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.is_published ? 'Live' : 'Draft'}
                  </span>
                </td>
                <td className='px-4 py-3 text-right'>
                  <Button size='sm' variant='ghost' onClick={() => { setEditing(p); setForm({ slug: p.slug, title: p.title, content: p.content, meta_description: p.meta_description || '', is_published: p.is_published }); setOpen(true) }}><Pencil className='h-4 w-4' /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader><DialogTitle>{editing ? 'Edit Legal Page' : 'Add Legal Page'}</DialogTitle></DialogHeader>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={!!editing} placeholder='terms' /></div>
              <div className='space-y-1'><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder='Terms and Conditions' /></div>
            </div>
            <div className='space-y-1'>
              <Label>Meta Description <span className='text-slate-400 font-normal text-xs'>(for SEO & social sharing)</span></Label>
              <Input value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} placeholder='Brief description for search engines...' />
            </div>
            <div className='space-y-1'>
              <div className='flex items-center justify-between'>
                <Label>Content</Label>
                <span className='text-[10px] text-slate-400'>Supports Markdown: ## headings, **bold**, - lists</span>
              </div>
              <textarea className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[320px] font-mono leading-relaxed' value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder='Enter page content here...' />
            </div>
            <div className='flex items-center gap-2'>
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label className='mb-0 cursor-pointer'>Published (visible to public)</Label>
            </div>
            <Button className='w-full bg-[#f59e0b] text-slate-900' onClick={save} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Page' : 'Create Page'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FooterTab() {
  const { data: settings } = useQuery({
    queryKey: ['footer-settings'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('settings').select('value').eq('key', 'footer').single()
      if (error) return { logo: '', description: '', links: [], contact: { phone: '', email: '' }, social: { instagram: '', facebook: '', youtube: '', whatsapp: '' } }
      return data?.value as Record<string, unknown>
    },
  })
  const [form, setForm] = useState<Record<string, unknown>>(settings || { logo: '', description: '', links: [], contact: { phone: '', email: '' }, social: { instagram: '', facebook: '', youtube: '', whatsapp: '' } })

  const save = async () => {
    const supabase = createClient()
    await supabase.from('settings').upsert({ key: 'footer', value: form })
  }

  return (
    <div className='space-y-4 max-w-xl'>
      <div className='bg-white border border-slate-100 rounded-xl p-4 space-y-3'>
        <div className='space-y-1'><Label>Description</Label><textarea className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm' value={(form.description as string) || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1'><Label>Contact Phone</Label><Input value={((form.contact as Record<string, string>)?.phone) || ''} onChange={(e) => setForm({ ...form, contact: { ...(form.contact as Record<string, string> || {}), phone: e.target.value } })} /></div>
          <div className='space-y-1'><Label>Contact Email</Label><Input value={((form.contact as Record<string, string>)?.email) || ''} onChange={(e) => setForm({ ...form, contact: { ...(form.contact as Record<string, string> || {}), email: e.target.value } })} /></div>
        </div>
        <div className='space-y-1'><Label>Instagram</Label><Input value={((form.social as Record<string, string>)?.instagram) || ''} onChange={(e) => setForm({ ...form, social: { ...(form.social as Record<string, string> || {}), instagram: e.target.value } })} /></div>
        <div className='space-y-1'><Label>Facebook</Label><Input value={((form.social as Record<string, string>)?.facebook) || ''} onChange={(e) => setForm({ ...form, social: { ...(form.social as Record<string, string> || {}), facebook: e.target.value } })} /></div>
        <div className='space-y-1'><Label>YouTube</Label><Input value={((form.social as Record<string, string>)?.youtube) || ''} onChange={(e) => setForm({ ...form, social: { ...(form.social as Record<string, string> || {}), youtube: e.target.value } })} /></div>
        <div className='space-y-1'><Label>WhatsApp</Label><Input value={((form.social as Record<string, string>)?.whatsapp) || ''} onChange={(e) => setForm({ ...form, social: { ...(form.social as Record<string, string> || {}), whatsapp: e.target.value } })} /></div>
        <Button className='bg-[#f59e0b] text-slate-900' onClick={save}>Save Footer</Button>
      </div>
    </div>
  )
}
