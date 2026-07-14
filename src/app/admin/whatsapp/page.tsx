'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Send, Bot, User, Phone, CheckCheck, Check,
  RefreshCw, Plus, X, Search, Star, Calendar,
  MoreVertical, ChevronDown, Zap
} from 'lucide-react'
import type { WhatsAppConversation, WhatsAppMessage, WhatsAppContact } from '@/types/whatsapp'

type ConvoWithContact = WhatsAppConversation & { contact: WhatsAppContact; messages: WhatsAppMessage[] }

const STATUS_COLOR: Record<string, string> = {
  open:        'text-blue-500',
  qualified:   'text-emerald-500',
  unqualified: 'text-slate-400',
  booked:      'text-violet-500',
  closed:      'text-gray-400',
}

const STATUS_DOT: Record<string, string> = {
  open:        'bg-blue-400',
  qualified:   'bg-emerald-400',
  unqualified: 'bg-slate-300',
  booked:      'bg-violet-400',
  closed:      'bg-gray-300',
}

function Avatar({ name, phone, size = 'md' }: { name?: string | null; phone?: string; size?: 'sm' | 'md' | 'lg' }) {
  const letter = (name || phone || '?')[0].toUpperCase()
  const sz = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-lg' : 'h-10 w-10 text-sm'
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold shrink-0`}>
      {letter}
    </div>
  )
}

export default function WhatsAppInboxPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState<ConvoWithContact[]>([])
  const [selected, setSelected] = useState<ConvoWithContact | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'bot' | 'human'>('all')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newOpen, setNewOpen] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [newName, setNewName] = useState('')
  const [newMsg, setNewMsg] = useState('Hi! Thanks for your interest in Selfaligned 🙏 How can we help you today?')
  const [initiating, setInitiating] = useState(false)
  const [initiateError, setInitiateError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchConversations = useCallback(async () => {
    const { data } = await supabase
      .from('whatsapp_conversations')
      .select('*, contact:whatsapp_contacts(*), messages:whatsapp_messages(*)')
      .order('last_message_at', { ascending: false })
      .limit(100)
    if (data) setConversations(data as ConvoWithContact[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  // Realtime
  useEffect(() => {
    const ch = supabase.channel('wa-inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, () => {
        fetchConversations()
        if (selected) fetchMessages(selected.id)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, fetchConversations)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [selected])

  const fetchMessages = async (id: string) => {
    const { data } = await supabase
      .from('whatsapp_messages').select('*')
      .eq('conversation_id', id).order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  useEffect(() => { if (selected) fetchMessages(selected.id) }, [selected])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!draft.trim() || !selected || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selected.id, message: draft.trim() }),
      })
      if (res.ok) { setDraft(''); fetchMessages(selected.id); fetchConversations() }
    } finally { setSending(false) }
  }

  const handleInitiate = async () => {
    if (!newPhone.trim() || !newMsg.trim()) return
    setInitiating(true); setInitiateError('')
    try {
      const res = await fetch('/api/whatsapp/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone.trim(), name: newName.trim(), message: newMsg.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setNewOpen(false); setNewPhone(''); setNewName('')
        setNewMsg('Hi! Thanks for your interest in Selfaligned 🙏 How can we help you today?')
        fetchConversations()
      } else { setInitiateError(data.error || 'Failed') }
    } finally { setInitiating(false) }
  }

  const switchMode = async (id: string, mode: 'bot' | 'human') => {
    await supabase.from('whatsapp_conversations').update({ mode }).eq('id', id)
    fetchConversations()
    setSelected(prev => prev?.id === id ? { ...prev, mode } : prev)
  }

  const confirmAppt = async (contactId: string) => {
    await supabase.from('whatsapp_appointments')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('contact_id', contactId).eq('status', 'pending')
    await supabase.from('whatsapp_followup_queue')
      .update({ status: 'cancelled' }).eq('contact_id', contactId).eq('status', 'pending')
    fetchConversations()
  }

  const lastMsg = (c: ConvoWithContact) => {
    const msgs = c.messages || []
    return msgs[msgs.length - 1]
  }

  const filtered = conversations.filter(c => {
    if (filter === 'bot' && c.mode !== 'bot') return false
    if (filter === 'human' && c.mode !== 'human') return false
    const q = search.toLowerCase()
    return !q || (c.contact?.name || '').toLowerCase().includes(q) || (c.contact?.phone || '').includes(q)
  })

  const unread = conversations.filter(c => c.mode === 'bot' && c.status === 'open').length

  return (
    <>
      {/* New message modal */}
      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">New Message</h3>
              <button onClick={() => { setNewOpen(false); setInitiateError('') }} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone *</label>
                <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name (optional)</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Customer name"
                  className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Message *</label>
                <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} rows={3}
                  className="mt-1 w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              {initiateError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{initiateError}</p>}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setNewOpen(false)}
                className="flex-1 py-2.5 text-sm border border-border rounded-xl text-muted-foreground hover:bg-muted">
                Cancel
              </button>
              <button onClick={handleInitiate} disabled={!newPhone.trim() || initiating}
                className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-40 flex items-center justify-center gap-2">
                {initiating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-112px)] overflow-hidden rounded-xl border border-border bg-background">

        {/* ── Sidebar ── */}
        <div className="w-72 flex flex-col border-r border-border shrink-0">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Chats</h2>
                {unread > 0 && <p className="text-xs text-muted-foreground">{unread} needs attention</p>}
              </div>
              <button onClick={() => setNewOpen(true)}
                className="h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors shadow-sm"
                title="New message">
                <Plus className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-muted/50 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground" />
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5">
              {(['all', 'bot', 'human'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium capitalize transition-colors ${
                    filter === f ? 'bg-emerald-500 text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <button onClick={() => setNewOpen(true)} className="mt-3 text-xs text-emerald-600 hover:underline">
                  Start one →
                </button>
              </div>
            ) : (
              filtered.map(conv => {
                const last = lastMsg(conv)
                const isActive = selected?.id === conv.id
                const name = conv.contact?.name || conv.contact?.phone || '?'
                return (
                  <button key={conv.id} onClick={() => setSelected(conv)}
                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors border-b border-border/40 last:border-0 ${
                      isActive ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'hover:bg-muted/30'
                    }`}>
                    <div className="relative shrink-0">
                      <Avatar name={conv.contact?.name} phone={conv.contact?.phone} size="sm" />
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                        conv.mode === 'bot' ? 'bg-blue-400' : 'bg-emerald-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-sm font-medium text-foreground truncate">{name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {last ? formatDistanceToNow(new Date(last.created_at), { addSuffix: false }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {last?.content || 'No messages'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[conv.status] || 'bg-gray-300'}`} />
                        <span className={`text-[10px] font-medium capitalize ${STATUS_COLOR[conv.status] || 'text-muted-foreground'}`}>
                          {conv.status}
                        </span>
                        {conv.lead_score > 0 && (
                          <span className="text-[10px] text-amber-500 font-medium flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 fill-amber-400 stroke-amber-400" />{conv.lead_score}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Chat area ── */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <Avatar name={selected.contact?.name} phone={selected.contact?.phone} />
                <div>
                  <p className="font-semibold text-foreground text-sm">{selected.contact?.name || selected.contact?.phone}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{selected.contact?.phone}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[selected.status]}`} />
                    <span className={`text-xs capitalize font-medium ${STATUS_COLOR[selected.status]}`}>{selected.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selected.lead_score > 0 && (
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full">
                    <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
                    <span className="text-xs font-semibold text-amber-700">{selected.lead_score}</span>
                  </div>
                )}
                {selected.status === 'qualified' && (
                  <button onClick={() => confirmAppt(selected.contact_id)}
                    className="flex items-center gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
                    <Calendar className="h-3.5 w-3.5" /> Book
                  </button>
                )}
                <button
                  onClick={() => switchMode(selected.id, selected.mode === 'bot' ? 'human' : 'bot')}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                    selected.mode === 'bot'
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                  {selected.mode === 'bot' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  {selected.mode === 'bot' ? 'Bot' : 'Human'}
                </button>
              </div>
            </div>

            {/* Answers strip */}
            {selected.answers && Object.keys(selected.answers).length > 0 && (
              <div className="flex gap-4 px-5 py-2 bg-blue-50/60 dark:bg-blue-950/10 border-b border-blue-100 dark:border-blue-900/20 overflow-x-auto text-xs shrink-0">
                {Object.entries(selected.answers).map(([k, v]) => (
                  <span key={k} className="shrink-0">
                    <span className="text-blue-400 capitalize">{k.replace(/_/g, ' ')}: </span>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">{String(v)}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2"
              style={{ background: 'radial-gradient(circle at 20% 80%, hsl(142 40% 97%) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(199 40% 97%) 0%, transparent 50%)' }}>
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const out = msg.direction === 'outbound'
                const showTime = i === 0 || (new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime()) > 5 * 60 * 1000
                return (
                  <div key={msg.id}>
                    {showTime && (
                      <div className="text-center my-2">
                        <span className="text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${
                        out
                          ? 'bg-emerald-500 text-white rounded-br-sm'
                          : 'bg-white dark:bg-gray-800 text-foreground rounded-bl-sm border border-border/50'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${out ? 'justify-end' : 'justify-start'}`}>
                          {!showTime && (
                            <span className={`text-[10px] ${out ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                          )}
                          {out && (
                            msg.status === 'read' ? <CheckCheck className="h-3 w-3 text-blue-200" /> :
                            msg.status === 'delivered' ? <CheckCheck className="h-3 w-3 text-emerald-100" /> :
                            <Check className="h-3 w-3 text-emerald-100" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Opted out */}
            {selected.contact?.opted_out ? (
              <div className="px-5 py-3 bg-red-50 dark:bg-red-950/20 border-t border-red-100 text-sm text-red-600 text-center">
                🚫 This contact sent STOP — messaging is disabled.
              </div>
            ) : (
              <div className="px-4 pb-4 pt-3 border-t border-border shrink-0">
                {selected.mode === 'bot' && (
                  <p className="text-xs text-blue-500 mb-2 flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5" />
                    Bot is active. Sending will switch to human mode.
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <div className="flex-1 bg-muted/40 rounded-2xl px-4 py-2.5 border border-border/60 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                    <textarea value={draft} onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      placeholder="Type a message…" rows={1}
                      className="w-full bg-transparent text-sm resize-none focus:outline-none text-foreground placeholder:text-muted-foreground max-h-32 overflow-y-auto"
                      style={{ minHeight: '24px' }}
                    />
                  </div>
                  <button onClick={handleSend} disabled={!draft.trim() || sending}
                    className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 flex items-center justify-center transition-colors shadow-sm shrink-0">
                    {sending ? <RefreshCw className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Select a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-5">
              Pick a chat from the left or start a new conversation with any WhatsApp number.
            </p>
            <button onClick={() => setNewOpen(true)}
              className="flex items-center gap-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors">
              <Plus className="h-4 w-4" /> New Message
            </button>
          </div>
        )}
      </div>
    </>
  )
}
