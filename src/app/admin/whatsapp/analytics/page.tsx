'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users, MessageCircle, Calendar, TrendingUp,
  CheckCircle, XCircle, Clock, Bot, User, ArrowUp, ArrowDown
} from 'lucide-react'

interface Stats {
  totalLeads: number
  newToday: number
  qualified: number
  booked: number
  unqualified: number
  optedOut: number
  pendingFollowups: number
  conversionRate: number
  avgLeadScore: number
  botVsHuman: { bot: number; human: number }
  leadsByStatus: { status: string; count: number }[]
  recentActivity: { time: string; text: string; type: string }[]
  dailyMessages: { date: string; inbound: number; outbound: number }[]
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  engaged: 'bg-purple-100 text-purple-700',
  qualified: 'bg-emerald-100 text-emerald-700',
  booked: 'bg-amber-100 text-amber-700',
  churned: 'bg-red-100 text-red-700',
}

function StatCard({
  label, value, sub, icon: Icon, color, trend
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string; trend?: 'up' | 'down' | null
}) {
  return (
    <div className="bg-background border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {trend && (
            <span className={`flex items-center text-xs font-medium mb-0.5 ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            </span>
          )}
        </div>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function WhatsAppAnalyticsPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<Partial<Stats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [
        { count: totalLeads },
        { count: newToday },
        { count: qualified },
        { count: booked },
        { count: unqualified },
        { count: optedOut },
        { count: pendingFollowups },
        { data: contacts },
        { data: conversations },
        { data: recentMsgs },
      ] = await Promise.all([
        supabase.from('whatsapp_contacts').select('*', { count: 'exact', head: true }),
        supabase.from('whatsapp_contacts').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('whatsapp_contacts').select('*', { count: 'exact', head: true }).eq('status', 'qualified'),
        supabase.from('whatsapp_contacts').select('*', { count: 'exact', head: true }).eq('status', 'booked'),
        supabase.from('whatsapp_conversations').select('*', { count: 'exact', head: true }).eq('status', 'unqualified'),
        supabase.from('whatsapp_contacts').select('*', { count: 'exact', head: true }).eq('opted_out', true),
        supabase.from('whatsapp_followup_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('whatsapp_contacts').select('status, lead_score'),
        supabase.from('whatsapp_conversations').select('mode'),
        supabase.from('whatsapp_messages').select('direction, created_at, content').order('created_at', { ascending: false }).limit(8),
      ])

      const avgScore = contacts && contacts.length > 0
        ? Math.round(contacts.reduce((s, c) => s + (c.lead_score || 0), 0) / contacts.length)
        : 0

      const convRate = totalLeads && totalLeads > 0
        ? Math.round(((booked || 0) + (qualified || 0)) / totalLeads * 100)
        : 0

      const botCount = conversations?.filter(c => c.mode === 'bot').length || 0
      const humanCount = conversations?.filter(c => c.mode === 'human').length || 0

      const leadsByStatus = ['new', 'engaged', 'qualified', 'booked', 'churned'].map(status => ({
        status,
        count: contacts?.filter(c => c.status === status).length || 0,
      }))

      const recentActivity = (recentMsgs || []).map(m => ({
        time: new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        text: m.content.slice(0, 60) + (m.content.length > 60 ? '…' : ''),
        type: m.direction,
      }))

      setStats({
        totalLeads: totalLeads || 0,
        newToday: newToday || 0,
        qualified: qualified || 0,
        booked: booked || 0,
        unqualified: unqualified || 0,
        optedOut: optedOut || 0,
        pendingFollowups: pendingFollowups || 0,
        conversionRate: convRate,
        avgLeadScore: avgScore,
        botVsHuman: { bot: botCount, human: humanCount },
        leadsByStatus,
        recentActivity,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-muted-foreground">
          <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const total = stats.leadsByStatus?.reduce((s, l) => s + l.count, 0) || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">WhatsApp CRM performance overview</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={stats.totalLeads || 0} sub={`+${stats.newToday} today`} icon={Users} color="bg-blue-100 text-blue-600" trend="up" />
        <StatCard label="Qualified" value={stats.qualified || 0} sub={`${stats.conversionRate}% conversion`} icon={CheckCircle} color="bg-emerald-100 text-emerald-600" trend="up" />
        <StatCard label="Booked" value={stats.booked || 0} sub="Appointments confirmed" icon={Calendar} color="bg-purple-100 text-purple-600" />
        <StatCard label="Pending Follow-ups" value={stats.pendingFollowups || 0} sub="Scheduled to send" icon={Clock} color="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Avg Lead Score" value={`${stats.avgLeadScore}/30`} icon={TrendingUp} color="bg-indigo-100 text-indigo-600" />
        <StatCard label="Bot Conversations" value={stats.botVsHuman?.bot || 0} sub="Auto-handled" icon={Bot} color="bg-cyan-100 text-cyan-600" />
        <StatCard label="Human Handled" value={stats.botVsHuman?.human || 0} sub="Admin replied" icon={User} color="bg-orange-100 text-orange-600" />
        <StatCard label="Opted Out" value={stats.optedOut || 0} sub="Sent STOP" icon={XCircle} color="bg-red-100 text-red-600" />
      </div>

      {/* Lead pipeline funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Lead Pipeline
          </h2>
          <div className="space-y-3">
            {(stats.leadsByStatus || []).map((item) => {
              const pct = Math.round((item.count / total) * 100)
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[item.status]}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-background border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            Recent Messages
          </h2>
          <div className="space-y-3">
            {(stats.recentActivity || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No messages yet</p>
            ) : (
              (stats.recentActivity || []).map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    a.type === 'inbound' ? 'bg-blue-100' : 'bg-emerald-100'
                  }`}>
                    {a.type === 'inbound'
                      ? <Users className="h-3 w-3 text-blue-600" />
                      : <User className="h-3 w-3 text-emerald-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.type === 'inbound' ? 'Customer' : 'Admin'} · {a.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Conversion summary */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
        <h2 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3">📊 Conversion Summary</h2>
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="font-bold text-foreground">{stats.totalLeads} Leads</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-bold text-blue-600">{stats.qualified} Qualified</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-bold text-emerald-600">{stats.booked} Booked</span>
          <span className="ml-2 text-xs text-muted-foreground">
            ({stats.conversionRate}% overall conversion rate)
          </span>
        </div>
      </div>
    </div>
  )
}
