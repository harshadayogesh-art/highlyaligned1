'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, CheckCircle, Calendar, Clock, TrendingUp, Bot, User, XCircle } from 'lucide-react'

interface Stats {
  totalLeads: number; newToday: number; qualified: number; booked: number
  optedOut: number; pendingFollowups: number; conversionRate: number; avgLeadScore: number
  botCount: number; humanCount: number
  byStatus: { status: string; count: number; color: string }[]
  recent: { text: string; dir: string; time: string }[]
}

export default function WhatsAppAnalyticsPage() {
  const supabase = createClient()
  const [s, setS] = useState<Partial<Stats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const today = new Date(); today.setHours(0,0,0,0)
      const [
        { count: total }, { count: newToday }, { count: qualified },
        { count: booked }, { count: optedOut }, { count: pending },
        { data: contacts }, { data: convos }, { data: recentMsgs },
      ] = await Promise.all([
        supabase.from('whatsapp_contacts').select('*',{count:'exact',head:true}),
        supabase.from('whatsapp_contacts').select('*',{count:'exact',head:true}).gte('created_at',today.toISOString()),
        supabase.from('whatsapp_contacts').select('*',{count:'exact',head:true}).eq('status','qualified'),
        supabase.from('whatsapp_contacts').select('*',{count:'exact',head:true}).eq('status','booked'),
        supabase.from('whatsapp_contacts').select('*',{count:'exact',head:true}).eq('opted_out',true),
        supabase.from('whatsapp_followup_queue').select('*',{count:'exact',head:true}).eq('status','pending'),
        supabase.from('whatsapp_contacts').select('status,lead_score'),
        supabase.from('whatsapp_conversations').select('mode'),
        supabase.from('whatsapp_messages').select('direction,content,created_at').order('created_at',{ascending:false}).limit(6),
      ])

      const t = total || 1
      const avg = contacts && contacts.length > 0
        ? Math.round(contacts.reduce((a,c)=>a+(c.lead_score||0),0)/contacts.length) : 0

      const statusDefs = [
        { status:'new',       color:'bg-blue-500',    label:'New' },
        { status:'engaged',   color:'bg-purple-500',  label:'Engaged' },
        { status:'qualified', color:'bg-emerald-500', label:'Qualified' },
        { status:'booked',    color:'bg-amber-500',   label:'Booked' },
        { status:'churned',   color:'bg-red-400',     label:'Churned' },
      ]
      const byStatus = statusDefs.map(d => ({
        ...d, count: contacts?.filter(c=>c.status===d.status).length || 0
      }))

      setS({
        totalLeads: total || 0, newToday: newToday || 0,
        qualified: qualified || 0, booked: booked || 0,
        optedOut: optedOut || 0, pendingFollowups: pending || 0,
        conversionRate: Math.round(((booked||0)+(qualified||0))/t*100),
        avgLeadScore: avg,
        botCount: convos?.filter(c=>c.mode==='bot').length || 0,
        humanCount: convos?.filter(c=>c.mode==='human').length || 0,
        byStatus,
        recent: (recentMsgs||[]).map(m=>({
          text: m.content.slice(0,70),
          dir: m.direction,
          time: new Date(m.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),
        }))
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-7 w-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const metrics = [
    { label: 'Total Leads',    value: s.totalLeads,       sub: `+${s.newToday} today`,    icon: Users,         color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Qualified',      value: s.qualified,         sub: `${s.conversionRate}% CVR`, icon: CheckCircle,   color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Booked',         value: s.booked,            sub: 'Appointments',             icon: Calendar,      color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/20' },
    { label: 'Follow-ups',     value: s.pendingFollowups,  sub: 'Pending',                  icon: Clock,         color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Avg Score',      value: `${s.avgLeadScore}`, sub: 'out of 30',                icon: TrendingUp,    color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
    { label: 'Opted Out',      value: s.optedOut,          sub: 'Sent STOP',                icon: XCircle,       color: 'text-red-400',     bg: 'bg-red-50 dark:bg-red-950/20' },
  ]

  const total = s.byStatus?.reduce((a,b) => a+b.count, 0) || 1

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">WhatsApp CRM overview</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map(m => (
          <div key={m.label} className={`rounded-xl p-4 ${m.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{m.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline funnel */}
        <div className="bg-background border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Lead Pipeline</h2>
          <div className="space-y-3">
            {(s.byStatus||[]).map(item => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="text-muted-foreground capitalize">{item.status}</span>
                  <span className="font-medium text-foreground">{item.count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.round((item.count/total)*100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bot vs Human + Recent */}
        <div className="space-y-4">
          {/* Bot vs Human */}
          <div className="bg-background border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Handled By</h2>
            <div className="flex gap-4">
              {[
                { label:'Bot Auto', value: s.botCount, icon: Bot, color:'text-blue-500', bg:'bg-blue-50 dark:bg-blue-950/20' },
                { label:'Human',    value: s.humanCount, icon: User, color:'text-emerald-500', bg:'bg-emerald-50 dark:bg-emerald-950/20' },
              ].map(h => (
                <div key={h.label} className={`flex-1 rounded-lg px-4 py-3 ${h.bg}`}>
                  <h.icon className={`h-5 w-5 ${h.color} mb-2`} />
                  <div className="text-xl font-bold text-foreground">{h.value}</div>
                  <div className="text-xs text-muted-foreground">{h.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent */}
          <div className="bg-background border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Recent Messages</h2>
            {(s.recent||[]).length === 0
              ? <p className="text-xs text-muted-foreground text-center py-4">No messages yet</p>
              : (s.recent||[]).map((m, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2 border-b border-border/50 last:border-0">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${m.dir==='inbound' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                    {m.dir==='inbound' ? <Users className="h-3 w-3 text-blue-500" /> : <User className="h-3 w-3 text-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{m.text}</p>
                    <p className="text-[10px] text-muted-foreground">{m.time}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Conversion bar */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-5 text-white">
        <p className="text-sm font-medium opacity-80 mb-2">Conversion Funnel</p>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className="font-bold text-lg">{s.totalLeads}</span>
          <span className="opacity-60">Leads →</span>
          <span className="font-bold text-lg">{s.qualified}</span>
          <span className="opacity-60">Qualified →</span>
          <span className="font-bold text-lg">{s.booked}</span>
          <span className="opacity-60">Booked</span>
          <span className="ml-auto text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold">
            {s.conversionRate}% CVR
          </span>
        </div>
      </div>
    </div>
  )
}
