'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow } from 'date-fns'
import {
  MessageCircle, Search, Filter, Send, Bot, User, Phone,
  CheckCheck, Check, Clock, X, Star, Calendar, Tag,
  ChevronRight, MoreVertical, UserCheck, Zap, RefreshCw,
  AlertCircle, WifiOff
} from 'lucide-react'
import type { WhatsAppConversation, WhatsAppMessage, WhatsAppContact } from '@/types/whatsapp'

type ConvoWithContact = WhatsAppConversation & { contact: WhatsAppContact; messages: WhatsAppMessage[] }

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  qualified: 'bg-emerald-100 text-emerald-700',
  unqualified: 'bg-slate-100 text-slate-600',
  booked: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-500',
}

const modeIcons: Record<string, React.ReactNode> = {
  bot: <Bot className="h-3 w-3" />,
  human: <User className="h-3 w-3" />,
  closed: <X className="h-3 w-3" />,
}

export default function WhatsAppInboxPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState<ConvoWithContact[]>([])
  const [selected, setSelected] = useState<ConvoWithContact | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'qualified' | 'booked'>('all')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    let query = supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        contact:whatsapp_contacts(*),
        messages:whatsapp_messages(*)
      `)
      .order('last_message_at', { ascending: false })
      .limit(100)

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    if (data) setConversations(data as ConvoWithContact[])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_messages',
      }, () => {
        fetchConversations()
        if (selected) fetchMessages(selected.id)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_conversations',
      }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selected])

  // Fetch messages for selected conversation
  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
  }

  useEffect(() => {
    if (selected) fetchMessages(selected.id)
  }, [selected])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selected || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selected.id, message: newMessage.trim() }),
      })
      if (res.ok) {
        setNewMessage('')
        await fetchMessages(selected.id)
        await fetchConversations()
      }
    } finally {
      setSending(false)
    }
  }

  // Switch mode
  const switchMode = async (convId: string, mode: 'bot' | 'human') => {
    await supabase.from('whatsapp_conversations').update({ mode }).eq('id', convId)
    await fetchConversations()
    if (selected?.id === convId) {
      setSelected((prev) => prev ? { ...prev, mode } : null)
    }
  }

  // Confirm appointment
  const confirmAppointment = async (contactId: string) => {
    await supabase
      .from('whatsapp_appointments')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('contact_id', contactId)
      .eq('status', 'pending')
    await supabase
      .from('whatsapp_followup_queue')
      .update({ status: 'cancelled' })
      .eq('contact_id', contactId)
      .eq('status', 'pending')
    await fetchConversations()
  }

  const filtered = conversations.filter((c) => {
    const name = c.contact?.name || ''
    const phone = c.contact?.phone || ''
    return name.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search)
  })

  const lastMessage = (c: ConvoWithContact) => {
    const msgs = c.messages || []
    return msgs[msgs.length - 1]
  }

  const unreadCount = conversations.filter(c => c.mode === 'bot' && c.status === 'open').length

  return (
    <div className="flex h-[calc(100vh-112px)] bg-background rounded-xl border border-border overflow-hidden">
      {/* ===== LEFT SIDEBAR ===== */}
      <div className="w-[340px] flex flex-col border-r border-border bg-muted/10">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-foreground">WhatsApp Inbox</h2>
                {unreadCount > 0 && (
                  <span className="text-xs text-emerald-600">{unreadCount} bot conversations</span>
                )}
              </div>
            </div>
            <button
              onClick={fetchConversations}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {(['all', 'open', 'qualified', 'booked'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors capitalize ${
                  filter === f
                    ? 'bg-emerald-500 text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            filtered.map((conv) => {
              const last = lastMessage(conv)
              const isSelected = selected?.id === conv.id
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                    isSelected ? 'bg-emerald-50 dark:bg-emerald-950/20 border-l-2 border-l-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                        {(conv.contact?.name || conv.contact?.phone || '?')[0].toUpperCase()}
                      </div>
                      {/* Mode badge */}
                      <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center ${
                        conv.mode === 'bot' ? 'bg-blue-500' : conv.mode === 'human' ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}>
                        {conv.mode === 'bot' ? <Bot className="h-2.5 w-2.5 text-white" /> : <User className="h-2.5 w-2.5 text-white" />}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-foreground truncate">
                          {conv.contact?.name || conv.contact?.phone || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {last ? formatDistanceToNow(new Date(last.created_at), { addSuffix: true }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[conv.status] || ''}`}>
                          {conv.status}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {last?.content?.slice(0, 40) || 'No messages'}
                        </span>
                      </div>
                      {conv.lead_score > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs text-amber-600 font-medium">Score: {conv.lead_score}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ===== CHAT AREA ===== */}
      {selected ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="px-5 py-3 border-b border-border bg-background flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                {(selected.contact?.name || selected.contact?.phone || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {selected.contact?.name || 'Unknown'}
                </p>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{selected.contact?.phone}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Lead score */}
              {selected.lead_score > 0 && (
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-semibold text-amber-700">Score: {selected.lead_score}</span>
                </div>
              )}

              {/* Confirm appointment */}
              {selected.status === 'qualified' && (
                <button
                  onClick={() => confirmAppointment(selected.contact_id)}
                  className="flex items-center gap-1.5 text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Confirm Booking
                </button>
              )}

              {/* Mode toggle */}
              <button
                onClick={() => switchMode(selected.id, selected.mode === 'bot' ? 'human' : 'bot')}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  selected.mode === 'bot'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
                title={selected.mode === 'bot' ? 'Switch to Human mode' : 'Switch to Bot mode'}
              >
                {selected.mode === 'bot' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                {selected.mode === 'bot' ? 'Bot Active' : 'Human Mode'}
              </button>
            </div>
          </div>

          {/* Answers summary bar */}
          {selected.answers && Object.keys(selected.answers).length > 0 && (
            <div className="px-5 py-2 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 flex gap-4 overflow-x-auto">
              {Object.entries(selected.answers).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1 text-xs flex-shrink-0">
                  <span className="text-blue-500 font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="text-blue-700">{String(val)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e8f5e9\' fill-opacity=\'0.4\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
            {messages.map((msg) => {
              const isOutbound = msg.direction === 'outbound'
              return (
                <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    isOutbound
                      ? 'bg-[#dcf8c6] dark:bg-emerald-800 text-gray-800 dark:text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-gray-400">
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </span>
                      {isOutbound && (
                        msg.status === 'read' ? <CheckCheck className="h-3 w-3 text-blue-500" /> :
                        msg.status === 'delivered' ? <CheckCheck className="h-3 w-3 text-gray-400" /> :
                        <Check className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Opted-out warning */}
          {selected.contact?.opted_out && (
            <div className="px-5 py-3 bg-red-50 border-t border-red-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">This contact has opted out (STOP). You cannot send messages.</span>
            </div>
          )}

          {/* Input area */}
          {!selected.contact?.opted_out && (
            <div className="px-4 py-3 border-t border-border bg-background">
              {selected.mode === 'bot' && (
                <div className="mb-2 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-lg">
                  <Bot className="h-3.5 w-3.5" />
                  <span>Bot is active. Your message will switch conversation to Human mode.</span>
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex-1 bg-muted/50 border border-border rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    className="w-full bg-transparent text-sm resize-none focus:outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {sending ? (
                    <RefreshCw className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center bg-muted/5">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Choose a conversation from the left to view messages and respond to customers.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
