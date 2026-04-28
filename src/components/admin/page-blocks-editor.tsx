'use client'

import { useState, useMemo } from 'react'
import {
  useAllPageBlocks,
  useCreatePageBlock,
  useUpdatePageBlock,
  useDeletePageBlock,
  type PageBlock,
} from '@/hooks/use-page-blocks'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  ImagePlus,
  X,
  ArrowUp,
  ArrowDown,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  Type,
  AlignLeft,
  MousePointerClick,
  MessageSquareQuote,
  Shield,
  ImageIcon,
  Heading,
  GripVertical,
  Eye,
} from 'lucide-react'

/* ────────────────────────────────────────────────
   CONFIG
   ──────────────────────────────────────────────── */

const PAGE_KEYS = [
  { key: 'home', label: 'Homepage', icon: '🏠' },
  { key: 'about', label: 'About', icon: '👤' },
  { key: 'services', label: 'Services', icon: '✨' },
  { key: 'contact', label: 'Contact', icon: '📞' },
  { key: 'shop', label: 'Shop', icon: '🛍️' },
  { key: 'kundali', label: 'Kundali', icon: '🔮' },
  { key: 'blog', label: 'Blog', icon: '📝' },
]

const SECTION_META: Record<string, { label: string; icon: string }> = {
  hero: { label: 'Hero Section', icon: '🎯' },
  services: { label: 'Services Section', icon: '✨' },
  products: { label: 'Products Section', icon: '🔥' },
  trust: { label: 'Trust Badges', icon: '🛡️' },
  testimonial: { label: 'Testimonials', icon: '💫' },
  cta: { label: 'CTA Banner', icon: '📢' },
  bio: { label: 'Bio Section', icon: '👤' },
  mission: { label: 'Mission', icon: '💡' },
  cert: { label: 'Certifications', icon: '🏆' },
  form: { label: 'Form Labels', icon: '📝' },
  step: { label: 'Step Labels', icon: '🔢' },
  insights: { label: 'Insight Labels', icon: '🔮' },
  generating: { label: 'Loading Texts', icon: '⏳' },
  disclaimer: { label: 'Disclaimer', icon: '⚠️' },
  success: { label: 'Success Messages', icon: '✅' },
  label: { label: 'Labels', icon: '🏷️' },
  whatsapp: { label: 'WhatsApp', icon: '💬' },
}

const TEMPLATES = [
  {
    key: 'heading',
    label: 'Heading',
    desc: 'A bold title or headline',
    icon: Heading,
    defaults: { text: '' },
  },
  {
    key: 'text',
    label: 'Text Paragraph',
    desc: 'A longer description or paragraph',
    icon: AlignLeft,
    defaults: { text: '' },
  },
  {
    key: 'heading_subtitle',
    label: 'Heading + Subtitle',
    desc: 'Title with a supporting line',
    icon: Type,
    defaults: { text: '', subtitle: '' },
  },
  {
    key: 'button',
    label: 'Button / CTA',
    desc: 'A call-to-action with link',
    icon: MousePointerClick,
    defaults: { text: '', link: '' },
  },
  {
    key: 'testimonial',
    label: 'Testimonial',
    desc: 'Client review with name & service',
    icon: MessageSquareQuote,
    defaults: { text: '', author: '', service: '' },
  },
  {
    key: 'trust_badge',
    label: 'Trust Badge',
    desc: 'Icon + title + description',
    icon: Shield,
    defaults: { title: '', description: '' },
  },
  {
    key: 'image_gallery',
    label: 'Image Gallery',
    desc: 'Just images, no text',
    icon: ImageIcon,
    defaults: {},
  },
]

/* ────────────────────────────────────────────────
   UTILS
   ──────────────────────────────────────────────── */

function toFriendlyName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Hi\b/g, 'Hindi')
    .replace(/En\b/g, 'English')
}

function getSectionKey(blockKey: string): string {
  const prefix = blockKey.split('_')[0]
  return prefix
}

function getSectionLabel(blockKey: string): string {
  const prefix = getSectionKey(blockKey)
  const meta = SECTION_META[prefix]
  if (meta) return `${meta.icon} ${meta.label}`
  return `📄 ${toFriendlyName(prefix)}`
}

function snakeCase(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function truncate(str: string, len: number): string {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}

/* ────────────────────────────────────────────────
   MAIN COMPONENT
   ──────────────────────────────────────────────── */

export function PageBlocksEditor() {
  const { data: allBlocks, isLoading } = useAllPageBlocks()
  const [selectedPage, setSelectedPage] = useState('home')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddWizard, setShowAddWizard] = useState(false)

  const createBlock = useCreatePageBlock()
  const updateBlock = useUpdatePageBlock()
  const deleteBlock = useDeletePageBlock()

  const pageBlocks = useMemo(
    () =>
      (allBlocks || [])
        .filter((b) => b.page_key === selectedPage)
        .sort((a, b) => a.sort_order - b.sort_order),
    [allBlocks, selectedPage]
  )

  const sections = useMemo(() => {
    const map = new Map<string, PageBlock[]>()
    pageBlocks.forEach((b) => {
      const sectionKey = getSectionKey(b.block_key)
      if (!map.has(sectionKey)) map.set(sectionKey, [])
      map.get(sectionKey)!.push(b)
    })
    return Array.from(map.entries()).map(([key, blocks]) => ({
      key,
      label: getSectionLabel(blocks[0].block_key),
      blocks,
    }))
  }, [pageBlocks])

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const moveBlock = (index: number, dir: number, sectionBlocks: PageBlock[]) => {
    const target = index + dir
    if (target < 0 || target >= sectionBlocks.length) return
    const current = sectionBlocks[index]
    const swap = sectionBlocks[target]
    updateBlock.mutate({ id: current.id, updates: { sort_order: swap.sort_order } })
    updateBlock.mutate({ id: swap.id, updates: { sort_order: current.sort_order } })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Tabs */}
      <div className="flex flex-wrap gap-2">
        {PAGE_KEYS.map((p) => {
          const count = (allBlocks || []).filter((b) => b.page_key === p.key).length
          const isActive = selectedPage === p.key
          return (
            <button
              key={p.key}
              onClick={() => {
                setSelectedPage(p.key)
                setEditingId(null)
                setShowAddWizard(false)
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-violet-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700'
              }`}
            >
              <span>{p.icon}</span>
              {p.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.key) || editingId !== null
          return (
            <div
              key={section.key}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-900 text-base">{section.label}</h3>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {section.blocks.length} block{section.blocks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {/* Section Body */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-2">
                  {section.blocks.map((block, i, arr) => (
                    <BlockRow
                      key={block.id}
                      block={block}
                      isEditing={editingId === block.id}
                      onEdit={() =>
                        setEditingId(editingId === block.id ? null : block.id)
                      }
                      onDelete={() => deleteBlock.mutate(block.id)}
                      onMoveUp={() => moveBlock(i, -1, arr)}
                      onMoveDown={() => moveBlock(i, 1, arr)}
                      canMoveUp={i > 0}
                      canMoveDown={i < arr.length - 1}
                      onSave={() => setEditingId(null)}
                      updateBlock={updateBlock}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {sections.length === 0 && (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
            <p className="text-slate-400 text-sm">
              No content blocks for this page yet.
            </p>
          </div>
        )}
      </div>

      {/* Add Block */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {!showAddWizard ? (
          <button
            onClick={() => setShowAddWizard(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 text-violet-700 font-semibold hover:bg-violet-50 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add New Content Block
          </button>
        ) : (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Choose Block Type</h3>
              <button
                onClick={() => setShowAddWizard(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NewBlockWizard
              pageKey={selectedPage}
              onCreated={() => setShowAddWizard(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   BLOCK ROW
   ──────────────────────────────────────────────── */

function BlockRow({
  block,
  isEditing,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onSave,
  updateBlock,
}: {
  block: PageBlock
  isEditing: boolean
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  onSave: () => void
  updateBlock: ReturnType<typeof useUpdatePageBlock>
}) {
  const friendly = toFriendlyName(block.block_key)
  const previewText =
    (block.content.text as string) ||
    (block.content.title as string) ||
    (block.content.description as string) ||
    ''

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      {/* Row Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50">
        {/* Drag / Move */}
        <div className="flex flex-col gap-0.5">
          <button
            disabled={!canMoveUp}
            onClick={onMoveUp}
            className="text-slate-300 hover:text-slate-500 disabled:opacity-20"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            disabled={!canMoveDown}
            onClick={onMoveDown}
            className="text-slate-300 hover:text-slate-500 disabled:opacity-20"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>

        {/* Label + Preview */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {friendly}
          </p>
          {!isEditing && (
            <BlockPreview block={block} />
          )}
        </div>

        {/* Images indicator */}
        {block.images && block.images.length > 0 && (
          <div className="flex -space-x-1.5">
            {block.images.slice(0, 3).map((img, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded-full border border-white bg-cover bg-center"
                style={{ backgroundImage: `url(${img})` }}
              />
            ))}
            {block.images.length > 3 && (
              <div className="w-6 h-6 rounded-full border border-white bg-slate-200 flex items-center justify-center text-[9px] text-slate-600 font-bold">
                +{block.images.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Active toggle */}
        <Switch
          checked={block.is_active}
          onCheckedChange={(v) =>
            updateBlock.mutate({ id: block.id, updates: { is_active: v } })
          }
        />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className={`h-8 w-8 ${isEditing ? 'text-violet-600 bg-violet-50' : ''}`}
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Inline Edit Form */}
      {isEditing && (
        <div className="px-4 py-4 border-t border-slate-100 bg-white">
          <BlockEditForm block={block} onDone={onSave} />
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────
   BLOCK PREVIEW
   ──────────────────────────────────────────────── */

function BlockPreview({ block }: { block: PageBlock }) {
  const c = block.content
  const text = (c.text as string) || ''
  const title = (c.title as string) || ''
  const subtitle = (c.subtitle as string) || ''
  const description = (c.description as string) || ''
  const link = (c.link as string) || ''
  const author = (c.author as string) || ''
  const service = (c.service as string) || ''

  // Testimonial preview
  if (block.block_key.startsWith('testimonial') && (text || author)) {
    return (
      <div className="mt-1.5 bg-slate-50 rounded-lg p-3 text-xs">
        <div className="text-amber-400 text-[10px] mb-1">★★★★★</div>
        <p className="text-slate-600 italic line-clamp-2">&ldquo;{truncate(text, 80)}&rdquo;</p>
        {author && (
          <p className="text-slate-400 mt-1 font-medium">
            — {author}{service ? `, ${service}` : ''}
          </p>
        )}
      </div>
    )
  }

  // Trust badge preview
  if (block.block_key.startsWith('trust_badge') && (title || description)) {
    return (
      <div className="mt-1.5 bg-slate-50 rounded-lg p-3 text-xs">
        {title && <p className="font-bold text-slate-800">{title}</p>}
        {description && <p className="text-slate-500 line-clamp-2">{description}</p>}
      </div>
    )
  }

  // Button / CTA preview
  if ((block.block_key.includes('cta') || block.block_key.includes('button')) && (text || link)) {
    return (
      <div className="mt-1.5 flex items-center gap-2">
        <span className="inline-flex items-center px-3 py-1 bg-amber-400 text-violet-950 text-xs font-bold rounded-lg">
          {text || 'Button'}
        </span>
        {link && <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{link}</span>}
      </div>
    )
  }

  // Heading preview
  if (block.block_key.includes('title') || text.length < 60) {
    return (
      <p className="mt-1 text-sm text-slate-700 font-medium line-clamp-1">
        {truncate(text || title || subtitle, 60) || (
          <span className="text-slate-300 italic">Empty — click edit to add content</span>
        )}
      </p>
    )
  }

  // Default text preview
  return (
    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
      {truncate(text || description || title, 100) || (
        <span className="text-slate-300 italic">Empty — click edit to add content</span>
      )}
    </p>
  )
}

/* ────────────────────────────────────────────────
   BLOCK EDIT FORM (INLINE)
   ──────────────────────────────────────────────── */

function BlockEditForm({ block, onDone }: { block: PageBlock; onDone: () => void }) {
  const updateBlock = useUpdatePageBlock()
  const [uploading, setUploading] = useState(false)

  const [content, setContent] = useState<Record<string, unknown>>({ ...block.content })
  const [images, setImages] = useState<string[]>(block.images || [])
  const [isActive, setIsActive] = useState(block.is_active)

  const contentKeys = Object.keys(content)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setImages((prev) => [...prev, url])
      toast.success('Image uploaded')
    } catch (err) {
      toast.error('Upload failed: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = () => {
    updateBlock.mutate(
      {
        id: block.id,
        updates: {
          content,
          images,
          is_active: isActive,
        },
      },
      { onSuccess: onDone }
    )
  }

  return (
    <div className="space-y-4">
      {/* Smart Fields */}
      <div className="grid grid-cols-1 gap-3">
        {contentKeys.map((key) => (
          <SmartField
            key={key}
            fieldKey={key}
            value={content[key] as string}
            onChange={(val) => setContent((c) => ({ ...c, [key]: val }))}
          />
        ))}

        {/* Unknown keys — allow adding */}
        {contentKeys.length === 0 && (
          <p className="text-sm text-slate-400 italic">No content fields. Add one below.</p>
        )}
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Images
        </Label>
        <div className="flex flex-wrap gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    const next = [...images]
                    const tmp = next[idx]
                    next[idx] = next[idx - 1]
                    next[idx - 1] = tmp
                    setImages(next)
                  }}
                  disabled={idx === 0}
                  className="text-white disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
                  className="text-white"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    const next = [...images]
                    const tmp = next[idx]
                    next[idx] = next[idx + 1]
                    next[idx + 1] = tmp
                    setImages(next)
                  }}
                  disabled={idx === images.length - 1}
                  className="text-white disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            ) : (
              <ImagePlus className="h-6 w-6 text-slate-400" />
            )}
            <span className="text-[10px] text-slate-400 mt-1">Add Image</span>
          </label>
        </div>
      </div>

      {/* Active */}
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        <Label className="mb-0 text-sm">Active (visible on website)</Label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSave}
          disabled={updateBlock.isPending}
          className="bg-[#f59e0b] text-slate-900 font-semibold"
        >
          {updateBlock.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save Changes
        </Button>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   SMART FIELD
   ──────────────────────────────────────────────── */

function SmartField({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string
  value: string
  onChange: (val: string) => void
}) {
  const label = toFriendlyName(fieldKey)
  const isLong = fieldKey === 'description' || fieldKey === 'html' || fieldKey === 'text'
  const isLink = fieldKey === 'link'
  const isColor = fieldKey.includes('color')

  if (isColor) {
    return (
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-slate-500">{label}</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
          />
          <Input value={value || ''} onChange={(e) => onChange(e.target.value)} />
        </div>
      </div>
    )
  }

  if (isLong) {
    return (
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-slate-500">{label}</Label>
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={fieldKey === 'description' || fieldKey === 'html' ? 4 : 3}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none resize-y"
        />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-slate-500">{label}</Label>
      <Input
        type={isLink ? 'url' : 'text'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}...`}
        className="h-10"
      />
    </div>
  )
}

/* ────────────────────────────────────────────────
   NEW BLOCK WIZARD
   ──────────────────────────────────────────────── */

function NewBlockWizard({
  pageKey,
  onCreated,
}: {
  pageKey: string
  onCreated: () => void
}) {
  const createBlock = useCreatePageBlock()
  const [step, setStep] = useState<'template' | 'details'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [blockName, setBlockName] = useState('')
  const [content, setContent] = useState<Record<string, string>>({})
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const template = TEMPLATES.find((t) => t.key === selectedTemplate)

  const handleSelectTemplate = (key: string) => {
    const t = TEMPLATES.find((x) => x.key === key)
    if (!t) return
    setSelectedTemplate(key)
    setContent(
      Object.fromEntries(Object.keys(t.defaults).map((k) => [k, '']))
    )
    setBlockName('')
    setStep('details')
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setImages((prev) => [...prev, url])
      toast.success('Image uploaded')
    } catch (err) {
      toast.error('Upload failed: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = () => {
    if (!blockName.trim()) {
      toast.error('Please enter a block name')
      return
    }
    const key = snakeCase(blockName)
    if (!key) {
      toast.error('Invalid block name')
      return
    }

    createBlock.mutate(
      {
        page_key: pageKey,
        block_key: key,
        content: { ...content },
        images,
        is_active: true,
        sort_order: 999,
      },
      { onSuccess: onCreated }
    )
  }

  if (step === 'template') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TEMPLATES.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => handleSelectTemplate(t.key)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-violet-400 hover:bg-violet-50 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setStep('template')}
        className="text-sm text-violet-600 hover:underline flex items-center gap-1"
      >
        ← Back to templates
      </button>

      <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-violet-900">
          {template?.label}
        </p>
        <p className="text-xs text-violet-600">{template?.desc}</p>
      </div>

      <div className="space-y-1">
        <Label>Block Name</Label>
        <Input
          value={blockName}
          onChange={(e) => setBlockName(e.target.value)}
          placeholder="e.g. Hero Title, Bio Paragraph..."
        />
        <p className="text-xs text-slate-400">
          This will be saved as: <code className="bg-slate-100 px-1 rounded">{snakeCase(blockName) || '...'}</code>
        </p>
      </div>

      {/* Template Fields */}
      <div className="space-y-3">
        {template &&
          Object.keys(template.defaults).map((key) => (
            <SmartField
              key={key}
              fieldKey={key}
              value={content[key] || ''}
              onChange={(val) => setContent((c) => ({ ...c, [key]: val }))}
            />
          ))}
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-500 uppercase">Images</Label>
        <div className="flex flex-wrap gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-violet-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <ImagePlus className="h-5 w-5 text-slate-400" />
            )}
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleCreate}
          disabled={createBlock.isPending || !blockName.trim()}
          className="bg-[#f59e0b] text-slate-900 font-semibold"
        >
          {createBlock.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Plus className="h-4 w-4 mr-1" />
          )}
          Create Block
        </Button>
        <Button variant="outline" onClick={() => setStep('template')}>
          Back
        </Button>
      </div>
    </div>
  )
}
