'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import {
  Users, Search, Phone, Star, Filter, ChevronDown,
  MessageCircle, Calendar, Eye, Ban, MoreVertical, X
} from 'lucide-react'
import Link from 'next/link'
import type { WhatsAppContact } from '@/types/whatsapp'

const statusConfig: Record<string, { label: string; color: string }> = {
  new:       { label: 'New',       color: 'bg-blue-100 text-blue-700' },
  engaged:   { label: 'Engaged',   color: 'bg-purple-100 text-purple-700' },
  qualified: { label: 'Qualified', color: 'bg-emerald-100 text-emerald-700' },
  booked:    { label: 'Booked',    color: 'bg-amber-100 text-amber-700' },
  churned:   { label: 'Churned',   color: 'bg-red-100 text-red-700' },
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 25 ? 'text-emerald-600' : score >= 15 ? 'text-amber-600' : 'text-gray-400'
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${color}`}>
      <Star className="h-3 w-3 fill-current" />
      {score}
    </span>
  )
}

type ContactWithConvo = WhatsAppContact & {
  latest_conversation?: { id: string; status: string; last_message_at: string } | null
}

export default function WhatsAppLeadsPage() {
  const supabase = createClient()
  const [contacts, setContacts] = useState<ContactWithConvo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'score' | 'name'>('recent')
  const [selected, setSelected] = useState<ContactWithConvo | null>(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const fetchContacts = async () => {
    const { data } = await supabase
      .from('whatsapp_contacts')
      .select(`
        *,
        latest_conversation:whatsapp_conversations(id, status, last_message_at)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      // Flatten latest_conversation (it's an array from join)
      const flat = data.map((c: any) => ({
        ...c,
        latest_conversation: Array.isArray(c.latest_conversation)
          ? c.latest_conversation[0] || null
          : c.latest_conversation,
      }))
      setContacts(flat)
    }
    setLoading(false)
  }

  useEffect(() => { fetchContacts() }, [])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('whatsapp_contacts').update({ status }).eq('id', id)
    fetchContacts()
  }

  const saveNote = async () => {
    if (!selected) return
    setSavingNote(true)
    await supabase.from('whatsapp_contacts').update({ notes: noteText }).eq('id', selected.id)
    setSavingNote(false)
    setSelected(null)
    fetchContacts()
  }

  const filtered = contacts
    .filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      const q = search.toLowerCase()
      return (c.name || '').toLowerCase().includes(q) || c.phone.includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'score') return (b.lead_score || 0) - (a.lead_score || 0)
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const counts = Object.fromEntries(
    ['new', 'engaged', 'qualified', 'booked', 'churned'].map(s => [
      s, contacts.filter(c => c.status === s).length
    ])
  )

  return (
    <div className="space-y-5">
      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-bold">
                  {(selected.name || selected.phone)[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{selected.name || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground">{selected.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Status', value: selected.status },
                { label: 'Lead Score', value: `${selected.lead_score} pts` },
                { label: 'Source', value: selected.source || 'meta_ad' },
                { label: 'Joined', value: format(new Date(selected.created_at), 'dd MMM yyyy') },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/30 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground capitalize">{value}</p>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
              <textarea
                value={noteText || selected.notes || ''}
                onChange={e => setNoteText(e.target.value)}
                rows={3}
                placeholder="Add notes about this lead..."
                className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 text-sm border border-border rounded-xl text-muted-foreground hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={saveNote}
                disabled={savingNote}
                className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {savingNote ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">{contacts.length} total contacts from WhatsApp</p>
      </div>

      {/* Status pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${statusFilter === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          All {contacts.length}
        </button>
        {Object.entries(statusConfig).map(([s, cfg]) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${statusFilter === s ? cfg.color : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {cfg.label} {counts[s] || 0}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none"
        >
          <option value="recent">Sort: Recent</option>
          <option value="score">Sort: Highest Score</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading leads…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No leads found</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(contact => {
                const cfg = statusConfig[contact.status]
                return (
                  <tr key={contact.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm shrink-0 ${contact.opted_out ? 'opacity-40' : ''}`}>
                          {(contact.name || contact.phone)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {contact.name || <span className="text-muted-foreground italic">No name</span>}
                            {contact.opted_out && <span className="ml-1.5 text-xs text-red-500">(STOP)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />{contact.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={contact.status}
                        onChange={e => updateStatus(contact.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer ${cfg.color}`}
                      >
                        {Object.entries(statusConfig).map(([s, c]) => (
                          <option key={s} value={s}>{c.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={contact.lead_score} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs capitalize">
                      {(contact.source || 'meta_ad').replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(new Date(contact.created_at), 'dd MMM, HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Link
                          href="/admin/whatsapp"
                          className="p-1.5 rounded-lg bg-muted hover:bg-emerald-100 hover:text-emerald-700 text-muted-foreground transition-colors"
                          title="Open chat"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => { setSelected(contact); setNoteText(contact.notes || '') }}
                          className="p-1.5 rounded-lg bg-muted hover:bg-blue-100 hover:text-blue-700 text-muted-foreground transition-colors"
                          title="View details / notes"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
