'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Calendar, CheckCircle, Clock, XCircle, Phone, Star, Filter, Search } from 'lucide-react'
import type { WhatsAppAppointment, WhatsAppContact } from '@/types/whatsapp'

type AppointmentWithContact = WhatsAppAppointment & { contact: WhatsAppContact }

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: <Clock className="h-4 w-4" /> },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: <XCircle className="h-4 w-4" /> },
  no_show: { label: 'No Show', color: 'bg-slate-100 text-slate-600', icon: <XCircle className="h-4 w-4" /> },
}

export default function WhatsAppAppointmentsPage() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<AppointmentWithContact[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('pending')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchAppointments = async () => {
    let query = supabase
      .from('whatsapp_appointments')
      .select('*, contact:whatsapp_contacts(*)')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    if (data) setAppointments(data as AppointmentWithContact[])
    setLoading(false)
  }

  useEffect(() => { fetchAppointments() }, [filter])

  const updateStatus = async (id: string, status: string) => {
    const updates: Record<string, unknown> = { status }
    if (status === 'confirmed') {
      updates.confirmed_at = new Date().toISOString()
      // Cancel follow-ups for this appointment
      await supabase
        .from('whatsapp_followup_queue')
        .update({ status: 'cancelled' })
        .eq('appointment_id', id)
        .eq('status', 'pending')
    }
    await supabase.from('whatsapp_appointments').update(updates).eq('id', id)
    fetchAppointments()
  }

  const sendConfirmationMessage = async (appt: AppointmentWithContact) => {
    const message = `✅ Your appointment is confirmed! 🎉\n\n📅 Date: ${appt.preferred_date || 'To be scheduled'}\n⏰ Time: ${appt.preferred_time || 'To be scheduled'}\n💆 Service: ${appt.service_name || 'Consultation'}\n\nWe look forward to seeing you! To reschedule, reply *RESCHEDULE*. 🙏`
    
    await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: appt.conversation_id, message }),
    })
    alert('Confirmation message sent!')
  }

  const filtered = appointments.filter((a) => {
    const name = a.contact?.name || ''
    const phone = a.contact?.phone || ''
    return name.toLowerCase().includes(search.toLowerCase()) || phone.includes(search)
  })

  const stats = {
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">WhatsApp Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage bookings from WhatsApp lead qualification</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: stats.pending, color: 'border-amber-300 bg-amber-50', textColor: 'text-amber-700' },
          { label: 'Confirmed', value: stats.confirmed, color: 'border-emerald-300 bg-emerald-50', textColor: 'text-emerald-700' },
          { label: 'Cancelled', value: stats.cancelled, color: 'border-red-300 bg-red-50', textColor: 'text-red-700' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
            <div className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</div>
            <div className={`text-sm font-medium ${stat.textColor} opacity-80 mt-1`}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                filter === f ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No appointments found</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Preferred</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((appt) => {
                const cfg = statusConfig[appt.status as keyof typeof statusConfig]
                return (
                  <tr key={appt.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-xs">
                          {(appt.contact?.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{appt.contact?.name || 'Unknown'}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {appt.contact?.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{appt.service_name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{appt.preferred_date || '—'}</div>
                      <div className="text-xs text-muted-foreground">{appt.preferred_time || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(new Date(appt.created_at), 'dd MMM, HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {appt.status === 'pending' && (
                          <>
                            <button
                              onClick={async () => { await updateStatus(appt.id, 'confirmed'); if (appt.conversation_id) sendConfirmationMessage(appt) }}
                              className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg font-medium transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => updateStatus(appt.id, 'cancelled')}
                              className="text-xs px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {appt.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus(appt.id, 'no_show')}
                            className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg"
                          >
                            No Show
                          </button>
                        )}
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
