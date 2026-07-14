'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, GripVertical, Save, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Zap, MessageSquare, Hash, Calendar, List } from 'lucide-react'
import type { WhatsAppFlow, FlowStep } from '@/types/whatsapp'

const stepTypeIcons: Record<string, React.ReactNode> = {
  text: <MessageSquare className="h-4 w-4" />,
  button: <List className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
}

const stepTypeLabels: Record<string, string> = {
  text: 'Free Text',
  button: 'Multiple Choice',
  number: 'Number',
  date: 'Date',
}

function StepCard({
  step,
  index,
  totalSteps,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  step: FlowStep
  index: number
  totalSteps: number
  onUpdate: (updated: FlowStep) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [expanded, setExpanded] = useState(index === 0)

  const addOption = () => {
    onUpdate({ ...step, options: [...(step.options || []), ''] })
  }

  const updateOption = (i: number, val: string) => {
    const opts = [...(step.options || [])]
    opts[i] = val
    onUpdate({ ...step, options: opts })
  }

  const removeOption = (i: number) => {
    const opts = (step.options || []).filter((_, idx) => idx !== i)
    onUpdate({ ...step, options: opts })
  }

  const updateScoreMap = (option: string, score: number) => {
    const scoreMap = { ...(step.score_map || {}), [option]: score }
    onUpdate({ ...step, score_map: scoreMap })
  }

  return (
    <div className="border border-border rounded-xl bg-background overflow-hidden">
      {/* Step header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <span className="h-6 w-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
          {index + 1}
        </span>
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground flex-1">
          {stepTypeIcons[step.type]}
          <span>{stepTypeLabels[step.type]}</span>
          {step.field && <span className="text-muted-foreground">· {step.field}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={index === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button onClick={onMoveDown} disabled={index === totalSteps - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30">
            <ChevronDown className="h-4 w-4" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-muted">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Step body */}
      {expanded && (
        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Question text */}
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Question / Message</label>
              <textarea
                value={step.question}
                onChange={(e) => onUpdate({ ...step, question: e.target.value })}
                placeholder="What would you like to ask the customer?"
                rows={3}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none bg-background"
              />
            </div>

            {/* Field name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Field Name (for data collection)</label>
              <input
                type="text"
                value={step.field}
                onChange={(e) => onUpdate({ ...step, field: e.target.value })}
                placeholder="e.g. name, interest, urgency"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-background"
              />
            </div>

            {/* Answer type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Answer Type</label>
              <select
                value={step.type}
                onChange={(e) => onUpdate({ ...step, type: e.target.value as FlowStep['type'], options: [] })}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-background"
              >
                <option value="text">Free Text (customer types anything)</option>
                <option value="button">Multiple Choice (buttons/options)</option>
                <option value="number">Number (1–10 scale, etc.)</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>

          {/* Options for button type */}
          {step.type === 'button' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground">Answer Options</label>
                <button onClick={addOption} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add Option
                </button>
              </div>
              <div className="space-y-2">
                {(step.options || []).map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none bg-background"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Score:</span>
                      <input
                        type="number"
                        value={step.score_map?.[opt] || 0}
                        onChange={(e) => updateScoreMap(opt, Number(e.target.value))}
                        className="w-16 text-sm border border-border rounded-lg px-2 py-1.5 focus:outline-none bg-background"
                      />
                    </div>
                    <button onClick={() => removeOption(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {(step.options || []).length === 0 && (
                <p className="text-xs text-muted-foreground italic">Add options above. Up to 3 will show as buttons, more as a list.</p>
              )}
            </div>
          )}

          {/* Score multiplier for number type */}
          {step.type === 'number' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Score Multiplier</label>
              <input
                type="number"
                value={step.score_multiplier || 1}
                onChange={(e) => onUpdate({ ...step, score_multiplier: Number(e.target.value) })}
                className="w-24 text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none bg-background"
                min={1}
                max={5}
              />
              <p className="text-xs text-muted-foreground mt-1">Customer's number × multiplier = lead score points</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function generateStepId() {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function buildSteps(steps: FlowStep[]): FlowStep[] {
  return steps.map((step, i) => ({
    ...step,
    next_step: i === steps.length - 1 ? 'complete' : steps[i + 1]?.id || 'complete',
  }))
}

export default function FlowBuilderPage() {
  const supabase = createClient()
  const [flows, setFlows] = useState<WhatsAppFlow[]>([])
  const [editingFlow, setEditingFlow] = useState<WhatsAppFlow | null>(null)
  const [saving, setSaving] = useState(false)
  const [keywords, setKeywords] = useState('')

  const fetchFlows = async () => {
    const { data } = await supabase.from('whatsapp_flows').select('*').order('created_at', { ascending: false })
    if (data) setFlows(data)
  }

  useEffect(() => { fetchFlows() }, [])

  const newFlow = () => {
    const step1Id = generateStepId()
    setEditingFlow({
      id: '',
      name: 'New Qualification Flow',
      description: '',
      steps: [{ id: step1Id, question: '', type: 'text', field: 'name', next_step: 'complete' }],
      is_active: false,
      trigger_keywords: [],
      created_at: '',
      updated_at: '',
    })
    setKeywords('')
  }

  const addStep = () => {
    if (!editingFlow) return
    const newStep: FlowStep = {
      id: generateStepId(),
      question: '',
      type: 'text',
      field: `field_${editingFlow.steps.length + 1}`,
      next_step: 'complete',
    }
    setEditingFlow({ ...editingFlow, steps: [...editingFlow.steps, newStep] })
  }

  const updateStep = (index: number, updated: FlowStep) => {
    if (!editingFlow) return
    const steps = [...editingFlow.steps]
    steps[index] = updated
    setEditingFlow({ ...editingFlow, steps })
  }

  const deleteStep = (index: number) => {
    if (!editingFlow) return
    setEditingFlow({ ...editingFlow, steps: editingFlow.steps.filter((_, i) => i !== index) })
  }

  const moveStep = (from: number, to: number) => {
    if (!editingFlow) return
    const steps = [...editingFlow.steps]
    const [moved] = steps.splice(from, 1)
    steps.splice(to, 0, moved)
    setEditingFlow({ ...editingFlow, steps })
  }

  const saveFlow = async () => {
    if (!editingFlow) return
    setSaving(true)
    try {
      const stepsWithNextStep = buildSteps(editingFlow.steps)
      const kwArray = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
      const payload = {
        name: editingFlow.name,
        description: editingFlow.description,
        steps: stepsWithNextStep,
        is_active: editingFlow.is_active,
        trigger_keywords: kwArray,
      }

      if (editingFlow.id) {
        await supabase.from('whatsapp_flows').update(payload).eq('id', editingFlow.id)
      } else {
        await supabase.from('whatsapp_flows').insert(payload)
      }

      await fetchFlows()
      setEditingFlow(null)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (flow: WhatsAppFlow) => {
    await supabase.from('whatsapp_flows').update({ is_active: !flow.is_active }).eq('id', flow.id)
    fetchFlows()
  }

  const deleteFlow = async (id: string) => {
    if (!confirm('Delete this flow?')) return
    await supabase.from('whatsapp_flows').delete().eq('id', id)
    fetchFlows()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flow Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Design automated qualification Q&A sequences for leads</p>
        </div>
        <button
          onClick={newFlow}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Flow
        </button>
      </div>

      {/* Flow editor */}
      {editingFlow && (
        <div className="border border-border rounded-xl bg-background p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editingFlow.id ? 'Edit Flow' : 'New Flow'}</h2>
            <div className="flex gap-2">
              <button onClick={() => setEditingFlow(null)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg">
                Cancel
              </button>
              <button
                onClick={saveFlow}
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Flow'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Flow Name</label>
              <input
                type="text"
                value={editingFlow.name}
                onChange={(e) => setEditingFlow({ ...editingFlow, name: e.target.value })}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Trigger Keywords (comma-separated)</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="hi, hello, start, namaste"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-background"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <input
                type="text"
                value={editingFlow.description || ''}
                onChange={(e) => setEditingFlow({ ...editingFlow, description: e.target.value })}
                placeholder="What is this flow for?"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-background"
              />
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Questions ({editingFlow.steps.length})</h3>
              <button onClick={addStep} className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700">
                <Plus className="h-4 w-4" /> Add Question
              </button>
            </div>
            <div className="space-y-3">
              {editingFlow.steps.map((step, i) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={i}
                  totalSteps={editingFlow.steps.length}
                  onUpdate={(updated) => updateStep(i, updated)}
                  onDelete={() => deleteStep(i)}
                  onMoveUp={() => moveStep(i, i - 1)}
                  onMoveDown={() => moveStep(i, i + 1)}
                />
              ))}
            </div>

            {editingFlow.steps.length > 0 && (
              <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-emerald-700 dark:text-emerald-400">
                  After the last question, the lead is scored and marked as Qualified (if score ≥ 15) or Unqualified.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing flows */}
      <div className="space-y-3">
        {flows.length === 0 && !editingFlow && (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No flows yet. Create your first qualification flow!</p>
          </div>
        )}
        {flows.map((flow) => (
          <div key={flow.id} className="border border-border rounded-xl p-4 bg-background flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-sm">{flow.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${flow.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {flow.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{flow.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{flow.steps?.length || 0} questions</span>
                {flow.trigger_keywords?.length > 0 && (
                  <span>Keywords: {flow.trigger_keywords.join(', ')}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(flow)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  flow.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {flow.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                {flow.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => { setEditingFlow(flow); setKeywords(flow.trigger_keywords?.join(', ') || '') }}
                className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground"
              >
                Edit
              </button>
              <button onClick={() => deleteFlow(flow.id)} className="text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 text-red-500">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
