'use client'

import { useState } from 'react'
import {
  useBlogPosts,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  type BlogPost,
} from '@/hooks/use-blog-posts'
import { uploadToCloudinary, getOptimizedImage } from '@/lib/cloudinary'
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
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Sparkles,
  ImagePlus,
  X,
  Loader2,
  Wand2,
  Save,
  Search,
} from 'lucide-react'

const CATEGORIES = ['Astrology', 'Crystals', 'Rituals', 'Tarot', 'Chakra', 'Vastu', 'Events']

export default function BlogManagerPage() {
  const { data: posts } = useBlogPosts()
  const createPost = useCreateBlogPost()
  const updatePost = useUpdateBlogPost()
  const deletePost = useDeleteBlogPost()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [search, setSearch] = useState('')

  const [form, setForm] = useState<Record<string, unknown>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category: 'Astrology',
    tags: [],
    author: 'Harshada Yogesh',
    status: 'draft',
    published_at: '',
    meta_title: '',
    meta_description: '',
  })

  const [uploading, setUploading] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiKeywords, setAiKeywords] = useState('')
  const [aiTone, setAiTone] = useState('spiritual')

  const reset = () => {
    setEditing(null)
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      category: 'Astrology',
      tags: [],
      author: 'Harshada Yogesh',
      status: 'draft',
      published_at: '',
      meta_title: '',
      meta_description: '',
    })
  }

  const openEdit = (p: BlogPost) => {
    setEditing(p)
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || '',
      content: p.content || '',
      featured_image: p.featured_image || '',
      category: p.category || 'Astrology',
      tags: p.tags,
      author: p.author,
      status: p.status,
      published_at: p.published_at ? p.published_at.slice(0, 16) : '',
      meta_title: p.meta_title || '',
      meta_description: p.meta_description || '',
    })
    setOpen(true)
  }

  const openCreate = () => {
    reset()
    setOpen(true)
  }

  const handleSave = () => {
    const payload = { ...form }
    if (payload.status === 'published' && !payload.published_at) {
      payload.published_at = new Date().toISOString()
    }
    if (editing) {
      updatePost.mutate(
        { id: editing.id, updates: payload },
        { onSuccess: () => setOpen(false) }
      )
    } else {
      createPost.mutate(payload, {
        onSuccess: () => {
          setOpen(false)
          reset()
        },
      })
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setForm((f) => ({ ...f, featured_image: url }))
      toast.success('Image uploaded')
    } catch (err) {
      toast.error('Upload failed: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a blog topic')
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          keywords: aiKeywords,
          category: form.category,
          tone: aiTone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI failed')

      const result = data.data
      setForm((f) => ({
        ...f,
        title: result.title,
        slug: result.slug,
        excerpt: result.excerpt,
        content: result.content,
        meta_title: result.meta_title,
        meta_description: result.meta_description,
        tags: result.tags,
      }))
      toast.success('AI content generated! Review and save.')
      setAiOpen(false)
    } catch (err) {
      toast.error('AI generation failed: ' + (err as Error).message)
    } finally {
      setAiLoading(false)
    }
  }

  const filteredPosts = (posts || []).filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <h1 className='text-2xl font-bold text-slate-900'>Blog Manager</h1>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => {
              setAiOpen(true)
              setAiTopic('')
              setAiKeywords('')
            }}
            className='border-violet-200 text-violet-700 hover:bg-violet-50'
          >
            <Sparkles className='h-4 w-4 mr-1' /> Write with AI
          </Button>
          <Button onClick={openCreate}>
            <Plus className='h-4 w-4 mr-1' /> New Post
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className='relative max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
        <Input
          placeholder='Search posts by title or category...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-9'
        />
      </div>

      {/* Posts Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {filteredPosts.map((p) => (
          <div
            key={p.id}
            className='bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group'
          >
            {/* Featured Image */}
            <div className='relative h-40 bg-slate-100 overflow-hidden'>
              {p.featured_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.featured_image}
                  alt={p.title}
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-slate-300 text-4xl'>
                  ✨
                </div>
              )}
              <div className='absolute top-2 right-2'>
                <Badge
                  className={
                    p.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800'
                      : p.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-600'
                  }
                >
                  {p.status}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className='p-4 space-y-2'>
              <div className='flex items-center gap-2 text-xs text-slate-500'>
                <Badge variant='outline' className='text-[10px]'>
                  {p.category}
                </Badge>
                <span>•</span>
                <span>{p.views} views</span>
              </div>
              <h3 className='font-semibold text-slate-900 line-clamp-2'>
                {p.title}
              </h3>
              <p className='text-xs text-slate-500 line-clamp-2'>
                {p.excerpt || 'No excerpt'}
              </p>
              <div className='flex items-center justify-between pt-2'>
                <span className='text-xs text-slate-400'>
                  {p.published_at
                    ? new Date(p.published_at).toLocaleDateString()
                    : 'Draft'}
                </span>
                <div className='flex items-center gap-1'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-7 w-7'
                    onClick={() => window.open(`/blog/${p.slug}`, '_blank')}
                  >
                    <Eye className='h-3.5 w-3.5' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-7 w-7'
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className='h-3.5 w-3.5' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-7 w-7 text-red-500'
                    onClick={() => deletePost.mutate(p.id)}
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className='text-center py-16 bg-white border border-slate-100 rounded-xl'>
          <p className='text-slate-400 text-sm'>
            {search ? 'No posts match your search.' : 'No blog posts yet.'}
          </p>
        </div>
      )}

      {/* ── AI Write Dialog ── */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-violet-600' />
              Write Blog with AI
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-1'>
              <Label>Topic / Title Idea</Label>
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder='e.g. How to Cleanse Your Crystals at Home'
              />
            </div>
            <div className='space-y-1'>
              <Label>SEO Keywords (comma separated)</Label>
              <Input
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                placeholder='e.g. crystal cleansing, energy healing, spiritual rituals'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Category</Label>
                <Select
                  value={(form.category as string) || 'Astrology'}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Tone</Label>
                <Select value={aiTone} onValueChange={setAiTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='spiritual'>Spiritual</SelectItem>
                    <SelectItem value='friendly'>Friendly</SelectItem>
                    <SelectItem value='professional'>Professional</SelectItem>
                    <SelectItem value='casual'>Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className='w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold'
              onClick={handleAIGenerate}
              disabled={aiLoading || !aiTopic.trim()}
            >
              {aiLoading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-1' />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Wand2 className='h-4 w-4 mr-1' />
                  Generate Blog Post
                </>
              )}
            </Button>
            <p className='text-xs text-slate-400 text-center'>
              AI will generate title, excerpt, full content, meta tags, and
              suggested tags.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit/Create Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto p-0'>
          <DialogHeader className='px-6 pt-6 pb-2'>
            <DialogTitle>
              {editing ? 'Edit Blog Post' : 'New Blog Post'}
            </DialogTitle>
          </DialogHeader>

          <div className='px-6 pb-6 space-y-5'>
            {/* Featured Image Upload */}
            <div className='space-y-2'>
              <Label className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                Featured Image
              </Label>
              {form.featured_image ? (
                <div className='flex items-start gap-4'>
                  <div className='relative w-40 h-28 rounded-xl overflow-hidden border border-slate-200 group shrink-0'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getOptimizedImage(form.featured_image as string, 400)}
                      alt='Featured'
                      className='w-full h-full object-cover'
                    />
                    <button
                      type='button'
                      onClick={() => setForm((f) => ({ ...f, featured_image: '' }))}
                      className='absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </div>
                  <div className='flex-1 min-w-0 space-y-2'>
                    <Input
                      value={(form.featured_image as string) || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, featured_image: e.target.value }))
                      }
                      placeholder='Image URL...'
                    />
                    <label className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg cursor-pointer hover:bg-violet-100 transition-colors'>
                      <input
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={(e) =>
                          e.target.files?.[0] && handleUpload(e.target.files[0])
                        }
                      />
                      <ImagePlus className='h-3.5 w-3.5' />
                      Change Image
                    </label>
                  </div>
                </div>
              ) : (
                <div className='flex items-start gap-4'>
                  <label className='flex flex-col items-center justify-center w-40 h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors shrink-0'>
                    <input
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={(e) =>
                        e.target.files?.[0] && handleUpload(e.target.files[0])
                      }
                    />
                    {uploading ? (
                      <Loader2 className='h-5 w-5 animate-spin text-slate-400' />
                    ) : (
                      <ImagePlus className='h-6 w-6 text-slate-400' />
                    )}
                    <span className='text-[10px] text-slate-400 mt-1'>
                      Upload Image
                    </span>
                  </label>
                  <div className='flex-1 min-w-0'>
                    <Input
                      value={(form.featured_image as string) || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, featured_image: e.target.value }))
                      }
                      placeholder='Or paste image URL here...'
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Title & Slug */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <div className='md:col-span-2 space-y-1'>
                <Label>Title</Label>
                <Input
                  value={form.title as string}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                      slug: generateSlug(e.target.value),
                    })
                  }
                  placeholder='Blog post title'
                />
              </div>
              <div className='space-y-1'>
                <Label>Slug</Label>
                <Input
                  value={form.slug as string}
                  onChange={(e) =>
                    setForm({ ...form, slug: e.target.value })
                  }
                  placeholder='url-slug'
                />
              </div>
            </div>

            {/* Category, Status, Author */}
            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-1'>
                <Label>Category</Label>
                <Select
                  value={form.category as string}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Status</Label>
                <Select
                  value={form.status as string}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='draft'>Draft</SelectItem>
                    <SelectItem value='published'>Published</SelectItem>
                    <SelectItem value='scheduled'>Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Author</Label>
                <Input
                  value={form.author as string}
                  onChange={(e) =>
                    setForm({ ...form, author: e.target.value })
                  }
                />
              </div>
            </div>

            {form.status === 'scheduled' && (
              <div className='space-y-1'>
                <Label>Publish At</Label>
                <Input
                  type='datetime-local'
                  value={form.published_at as string}
                  onChange={(e) =>
                    setForm({ ...form, published_at: e.target.value })
                  }
                />
              </div>
            )}

            {/* Excerpt */}
            <div className='space-y-1'>
              <Label>Excerpt</Label>
              <textarea
                className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none resize-y'
                rows={2}
                value={form.excerpt as string}
                onChange={(e) =>
                  setForm({ ...form, excerpt: e.target.value })
                }
                placeholder='Short summary for blog cards...'
              />
            </div>

            {/* Content */}
            <div className='space-y-1'>
              <div className='flex items-center justify-between'>
                <Label>Content</Label>
                <button
                  onClick={() => {
                    setAiOpen(true)
                    setAiTopic((form.title as string) || '')
                  }}
                  className='text-xs text-violet-600 hover:underline flex items-center gap-1'
                >
                  <Sparkles className='h-3 w-3' />
                  Rewrite with AI
                </button>
              </div>
              <textarea
                className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none resize-y'
                rows={12}
                value={form.content as string}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
                placeholder='Write your blog post content here...'
              />
            </div>

            {/* Tags */}
            <div className='space-y-1'>
              <Label>Tags (comma separated)</Label>
              <Input
                value={((form.tags as string[]) || []).join(', ')}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder='crystal healing, spirituality, wellness'
              />
            </div>

            {/* SEO */}
            <div className='bg-slate-50 rounded-xl p-4 space-y-3'>
              <h4 className='text-sm font-bold text-slate-700 flex items-center gap-1'>
                🔍 SEO Settings
              </h4>
              <div className='space-y-1'>
                <Label className='text-xs'>Meta Title</Label>
                <Input
                  value={form.meta_title as string}
                  onChange={(e) =>
                    setForm({ ...form, meta_title: e.target.value })
                  }
                  placeholder='SEO title for search engines'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-xs'>Meta Description</Label>
                <textarea
                  className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none resize-y'
                  rows={2}
                  value={form.meta_description as string}
                  onChange={(e) =>
                    setForm({ ...form, meta_description: e.target.value })
                  }
                  placeholder='SEO description for search engines...'
                />
              </div>
            </div>

            {/* Actions */}
            <div className='flex gap-2 pt-2'>
              <Button
                onClick={handleSave}
                disabled={createPost.isPending || updatePost.isPending}
                className='bg-[#f59e0b] text-slate-900 font-semibold'
              >
                {createPost.isPending || updatePost.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin mr-1' />
                ) : (
                  <Save className='h-4 w-4 mr-1' />
                )}
                {editing ? 'Update Post' : 'Publish Post'}
              </Button>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
