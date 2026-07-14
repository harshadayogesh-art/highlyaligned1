'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Clock, Send, X, CheckCircle, SkipForward, RefreshCw, Plus, MessageSquare } from 'lucide-react'

const statusConfig = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700',   icon: Clock },
  sent:      { label: 'Sent',      color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700',       icon: X },
  skipped:   { label: 'Skipped',   color: 'bg-slate-100 text-slate-600',   icon: SkipForward },
}

export default function FollowupsPage() {
  const supabase = createClient()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'cancelled'>('pending')
  const [processing, setProcessing] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [newDelay, setNewDelay] = useState('1')
  const [scheduling, setScheduling] = useState(false)

  const fetchItems = async () => {
    let query = supabase
      .from('whatsapp_followup_queue')
      .select('*, contact:whatsapp_contacts(name, phone)')
      .order('scheduled_at', { ascending: true })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [filter])

  const cancelFollowup = async (id: string) => {
    await supabase.from('whatsapp_followup_queue').update({ status: 'cancelled' }).eq('id', id)
    fetchItems()
  }

  const runNow = async () => {
    setProcessing(true)
    try {
      const res = await fetch('/api/whatsapp/followup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` }
      })
      const data = await res.json()
      alert(`Processed: ${data.sent} sent, ${data.skipped} skipped`)
      fetchItems()
    } finally {
      setProcessing(false)
    }
  }

  const scheduleManual = async () => {
    if (!newPhone.trim() || !newMessage.trim()) return
    setScheduling(true)
    try {
      // Find or create contact
      const normalizedPhone = newPhone.replace(/[\s\-\(\)\+]/g, '')
      const { data: contact } = await supabase
        .from('whatsapp_contacts')
        .upsert({ phone: normalizedPhone, source: 'manual_followup' }, { onConflict: 'phone' })
        .select()
        .single()

      if (!contact) { alert('Failed to find contact'); return }

      const scheduledAt = new Date(Date.now() + parseInt(newDelay) * 60 * 60 * 1000).toISOString()
      await supabase.from('whatsapp_followup_queue').insert({
        contact_id: contact.id,
        template_name: 'manual_followup',
        message_body: newMessage,
        scheduled_at: scheduledAt,
        status: 'pending',
        attempt: 1,
      })
      setNewOpen(false)
      setNewPhone('')
      setNewMessage('')
      fetchItems()
    } finally {
      setScheduling(false)
    }
  }

  const stats = {
    pending: items.filter(i => i.status === 'pending').length,
    sent: items.filter(i => i.status === 'sent').length,
    cancelled: items.filter(i => i.status === 'cancelled').length,
  }

  return (
    <div className="space-y-5">
      {/* Schedule modal */}
      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground">Schedule Follow-up</h3>
              <button onClick={() => setNewOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number</label>
                <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} rows={4}
                  placeholder="Hi! Just following up on your inquiry with Selfaligned..."
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Send after (hours)</label>
                <select value={newDelay} onChange={e => setNewDelay(e.target.value)}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none">
                  <option value="1">1 hour</option>
                  <option value="4">4 hours</option>
                  <option value="24">24 hours (1 day)</option>
                  <option value="48">48 hours (2 days)</option>
                  <option value="72">72 hours (3 days)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setNewOpen(false)}
                  className="flex-1 py-2.5 text-sm border border-border rounded-xl text-muted-foreground hover:bg-muted">
                  Cancel
                </button>
                <button onClick={scheduleManual} disabled={scheduling || !newPhone.trim() || !newMessage.trim()}
                  className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {scheduling ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Follow-ups</h1>
          <p className="text-sm text-muted-foreground mt-1">Auto follow-up queue for unconfirmed leads</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runNow} disabled={processing}
            className="flex items-center gap-2 text-sm px-4 py-2 border border-border rounded-lg hover:bg-muted text-foreground disabled:opacity-50">
            {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Process Now
          </button>
          <button onClick={() => setNewOpen(true)}
            className="flex items-center gap-2 text-sm px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium">
            <Plus className="h-4 w-4" />
            Schedule
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: stats.pending, color: 'border-amber-300 bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700' },
          { label: 'Sent',    value: stats.sent,    color: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700' },
          { label: 'Cancelled', value: stats.cancelled, color: 'border-red-300 bg-red-50 dark:bg-red-950/20', text: 'text-red-700' },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
            <div className={`text-3xl font-bold ${s.text}`}>{s.value}</div>
            <div className={`text-sm font-medium ${s.text} opacity-80 mt-1`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1">
        {(['all', 'pending', 'sent', 'cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-sm px-4 py-2 rounded-lg font-medium capitalize transition-colors ${filter === f ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No follow-ups in this queue</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Message Preview</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Scheduled</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Attempt</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(item => {
                const cfg = statusConfig[item.status as keyof typeof statusConfig]
                const Icon = cfg.icon
                const isPast = new Date(item.scheduled_at) < new Date() && item.status === 'pending'
                return (
                  <tr key={item.id} className={`hover:bg-muted/20 transition-colors ${isPast ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.contact?.name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{item.contact?.phone}</p>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-foreground truncate">{item.message_body}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.template_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-foreground">{format(new Date(item.scheduled_at), 'dd MMM, HH:mm')}</p>
                      {isPast && <p className="text-xs text-amber-600 font-medium">⏰ Overdue</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">#{item.attempt}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'pending' && (
                        <button onClick={() => cancelFollowup(item.id)}
                          className="text-xs px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors">
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
        <p className="font-semibold mb-1">⚙️ Auto Follow-up Schedule</p>
        <p>When a lead qualifies, the system automatically schedules: <strong>1 hour → 24 hours → 48 hours</strong> follow-up messages.</p>
        <p className="mt-1">The cron job runs every hour. Click <strong>Process Now</strong> to trigger manually.</p>
      </div>
    </div>
  )
}
