'use client'

import { useState, useEffect } from 'react'
import { useLeads, useUpdateLead, useDeleteLead } from '@/hooks/use-leads'
import { useAllLeadAreas, useCreateLeadArea, useUpdateLeadArea, useDeleteLeadArea, type LeadArea } from '@/hooks/use-lead-areas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Phone, MessageCircle, CheckCircle, Pencil, Save, Smartphone, Plus, Trash2, Loader2, Star, Sun, Moon, ArrowUp, Calendar, MapPin, Clock, FileText, User, Ban, ChevronRight, Mail, Sparkles, StickyNote, Info } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-purple-100 text-purple-800',
  interested: 'bg-amber-100 text-amber-800',
  follow_up: 'bg-orange-100 text-orange-800',
  converted: 'bg-emerald-100 text-emerald-800',
  cold: 'bg-slate-100 text-slate-800',
}

const STATUS_FLOW = ['new', 'contacted', 'interested', 'follow_up', 'converted']

export default function LeadsPage() {
  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-bold text-slate-900'>Leads</h1>
      <Tabs defaultValue='inbox'>
        <TabsList>
          <TabsTrigger value='inbox'>Inbox</TabsTrigger>
          <TabsTrigger value='settings'>Settings</TabsTrigger>
          <TabsTrigger value='areas'>Area Manager</TabsTrigger>
          <TabsTrigger value='prompts'>AI Prompts</TabsTrigger>
        </TabsList>
        <TabsContent value='inbox'><LeadInbox /></TabsContent>
        <TabsContent value='settings'><LeadSettings /></TabsContent>
        <TabsContent value='areas'><AreaManager /></TabsContent>
        <TabsContent value='prompts'><PromptEditor /></TabsContent>
      </Tabs>
    </div>
  )
}

function LeadInbox() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [detailLead, setDetailLead] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null)

  const { data: leads, isLoading: leadsLoading, isError: leadsError, error: leadsErrorObj } = useLeads({ status: statusFilter || undefined, search: search || undefined })
  const { data: areas } = useAllLeadAreas()
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()

  const lead = leads?.find((l) => l.id === detailLead)
  const getAreaName = (areaId: string | null) => areas?.find((a) => a.id === areaId)?.name || '—'

  const openDetail = (id: string) => {
    setDetailLead(id)
    setDetailOpen(true)
    const l = leads?.find((le) => le.id === id)
    setAdminNotes((l?.report_data_json as Record<string, string>)?.admin_notes || '')
  }

  const handleStatus = (status: string) => {
    if (!lead) return
    updateLead.mutate({ leadId: lead.id, updates: { status } })
  }

  const handleDeleteLead = (id: string) => {
    deleteLead.mutate(id, {
      onSuccess: () => {
        setDeleteLeadId(null)
        setDetailOpen(false)
      },
    })
  }

  const exportCSV = () => {
    if (!leads) return
    const headers = ['Name', 'Mobile', 'Email', 'Area', 'Question', 'Status', 'Date']
    const rows = leads.map((l) => [
      l.name, l.mobile, l.email || '', getAreaName(l.area_of_life_id),
      l.customer_question || '', l.status, new Date(l.created_at).toLocaleDateString(),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads.csv'
    a.click()
  }

  const reportData = lead?.report_data_json as Record<string, unknown> | null
  const chart = reportData?.chart as Record<string, string> | null
  const insights = reportData?.insights as Record<string, string> | null

  const currentFlowIndex = STATUS_FLOW.indexOf(lead?.status || '')

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between flex-wrap gap-2'>
        <h2 className='text-lg font-bold text-slate-900'>Lead Inbox</h2>
        <Button size='sm' variant='outline' onClick={exportCSV}>Export CSV</Button>
      </div>

      <div className='flex flex-col sm:flex-row gap-2'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search by name or mobile...' className='pl-9' />
        </div>
        <div className='flex gap-1 overflow-x-auto'>
          {['all', 'new', 'contacted', 'interested', 'follow_up', 'converted', 'cold'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s === 'all' ? '' : s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                (statusFilter || 'all') === s ? 'bg-[#f59e0b] text-slate-900' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className='bg-white border border-slate-100 rounded-xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-slate-500'>
              <tr>
                <th className='text-left px-4 py-3 font-medium'>Name</th>
                <th className='text-left px-4 py-3 font-medium'>Mobile</th>
                <th className='text-left px-4 py-3 font-medium'>Area</th>
                <th className='text-left px-4 py-3 font-medium'>Status</th>
                <th className='text-left px-4 py-3 font-medium'>Report</th>
                <th className='text-left px-4 py-3 font-medium'>Date</th>
                <th className='text-right px-4 py-3 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {leadsLoading && (
                <tr>
                  <td colSpan={7} className='px-4 py-8'>
                    <div className='space-y-2'>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className='h-10 bg-slate-100 rounded animate-pulse' />
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              {leadsError && (
                <tr>
                  <td colSpan={7} className='px-4 py-8 text-center'>
                    <div className='text-red-500 text-sm font-medium mb-1'>Failed to load leads</div>
                    <div className='text-xs text-slate-400 mb-3'>{(leadsErrorObj as Error)?.message || 'Please check your database connection and RLS policies.'}</div>
                    <Button size='sm' variant='outline' onClick={() => window.location.reload()}>Retry</Button>
                  </td>
                </tr>
              )}
              {!leadsLoading && !leadsError && leads && leads.length === 0 && (
                <tr>
                  <td colSpan={7} className='px-4 py-12 text-center'>
                    <div className='text-slate-400 text-sm'>No leads found yet.</div>
                    <div className='text-slate-300 text-xs mt-1'>Leads will appear here when customers submit the Kundali form.</div>
                  </td>
                </tr>
              )}
              {!leadsLoading && !leadsError && leads?.map((l) => (
                <tr key={l.id} className='hover:bg-slate-50 cursor-pointer' onClick={() => openDetail(l.id)}>
                  <td className='px-4 py-3 font-medium'>{l.name}</td>
                  <td className='px-4 py-3'>{l.mobile}</td>
                  <td className='px-4 py-3'>{getAreaName(l.area_of_life_id)}</td>
                  <td className='px-4 py-3'>
                    <Badge className={`text-xs ${statusColors[l.status] || ''}`}>{l.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className='px-4 py-3'>
                    {l.ai_answer ? (
                      <Badge variant='outline' className='text-xs border-amber-300 text-amber-700 bg-amber-50'>
                        <FileText className='h-3 w-3 mr-1' /> Report
                      </Badge>
                    ) : (
                      <span className='text-xs text-slate-400'>—</span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-xs'>{new Date(l.created_at).toLocaleDateString()}</td>
                  <td className='px-4 py-3 text-right'>
                    <div className='flex items-center justify-end gap-1' onClick={(e) => e.stopPropagation()}>
                      <Button size='sm' variant='ghost' onClick={() => window.open(`https://wa.me/91${l.mobile}`, '_blank')}>
                        <MessageCircle className='h-4 w-4 text-emerald-600' />
                      </Button>
                      <Button size='sm' variant='ghost' onClick={() => window.open(`tel:${l.mobile}`, '_self')}>
                        <Phone className='h-4 w-4 text-blue-600' />
                      </Button>
                      <Button size='sm' variant='ghost' className='text-red-500 hover:text-red-700 hover:bg-red-50' onClick={() => setDeleteLeadId(l.id)}>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className='w-full sm:max-w-xl overflow-y-auto p-0'>
          <SheetTitle className='sr-only'>Lead Detail</SheetTitle>
          {lead && (
            <>
              {/* Header */}
              <div className='bg-gradient-to-br from-violet-900 to-indigo-900 text-white p-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border border-white/20'>
                      {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className='text-xl font-bold'>{lead.name}</h2>
                      <div className='flex items-center gap-2 mt-1.5'>
                        <Badge className={`text-xs ${statusColors[lead.status] || ''} border-0`}>{lead.status.replace('_', ' ')}</Badge>
                        <span className='text-xs text-violet-200'>{getAreaName(lead.area_of_life_id)}</span>
                      </div>
                    </div>
                  </div>
                  <Button size='icon' variant='ghost' className='text-white/70 hover:text-white hover:bg-white/10 rounded-full' onClick={() => setDeleteLeadId(lead.id)}>
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>

                {/* Quick Contact Actions */}
                <div className='flex gap-2 mt-5'>
                  <Button size='sm' className='bg-emerald-500 hover:bg-emerald-400 text-white border-0 rounded-full px-4' onClick={() => window.open(`https://wa.me/91${lead.mobile}`, '_blank')}>
                    <MessageCircle className='h-4 w-4 mr-1.5' /> WhatsApp
                  </Button>
                  <Button size='sm' variant='outline' className='border-white/30 text-white hover:bg-white/10 rounded-full px-4' onClick={() => window.open(`tel:${lead.mobile}`, '_self')}>
                    <Phone className='h-4 w-4 mr-1.5' /> Call
                  </Button>
                  {lead.email && (
                    <Button size='sm' variant='outline' className='border-white/30 text-white hover:bg-white/10 rounded-full px-4' onClick={() => window.open(`mailto:${lead.email}`, '_self')}>
                      <Mail className='h-4 w-4 mr-1.5' /> Email
                    </Button>
                  )}
                </div>
              </div>

              {/* Tabs Content */}
              <Tabs defaultValue='overview' className='px-6 pb-6'>
                <TabsList className='w-full mt-4 mb-2 bg-slate-100'>
                  <TabsTrigger value='overview' className='flex-1 text-xs'>Overview</TabsTrigger>
                  <TabsTrigger value='report' className='flex-1 text-xs'>
                    <Sparkles className='h-3 w-3 mr-1' /> Kundali
                  </TabsTrigger>
                  <TabsTrigger value='notes' className='flex-1 text-xs'>
                    <StickyNote className='h-3 w-3 mr-1' /> Notes
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value='overview' className='space-y-4 mt-4'>
                  {/* Contact Details */}
                  <div className='space-y-3'>
                    <h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Contact Details</h4>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='bg-slate-50 rounded-xl p-3 border border-slate-100'>
                        <div className='flex items-center gap-1.5 text-slate-400 mb-1'>
                          <Phone className='h-3 w-3' />
                          <span className='text-[10px] font-semibold uppercase tracking-wider'>Mobile</span>
                        </div>
                        <div className='font-semibold text-slate-900 text-sm'>{lead.mobile}</div>
                      </div>
                      <div className='bg-slate-50 rounded-xl p-3 border border-slate-100'>
                        <div className='flex items-center gap-1.5 text-slate-400 mb-1'>
                          <Mail className='h-3 w-3' />
                          <span className='text-[10px] font-semibold uppercase tracking-wider'>Email</span>
                        </div>
                        <div className='font-semibold text-slate-900 text-sm truncate'>{lead.email || '—'}</div>
                      </div>
                      <div className='bg-slate-50 rounded-xl p-3 border border-slate-100'>
                        <div className='flex items-center gap-1.5 text-slate-400 mb-1'>
                          <Calendar className='h-3 w-3' />
                          <span className='text-[10px] font-semibold uppercase tracking-wider'>Date of Birth</span>
                        </div>
                        <div className='font-semibold text-slate-900 text-sm'>{lead.dob || '—'}</div>
                      </div>
                      <div className='bg-slate-50 rounded-xl p-3 border border-slate-100'>
                        <div className='flex items-center gap-1.5 text-slate-400 mb-1'>
                          <Clock className='h-3 w-3' />
                          <span className='text-[10px] font-semibold uppercase tracking-wider'>Birth Time</span>
                        </div>
                        <div className='font-semibold text-slate-900 text-sm'>{lead.birth_time || '—'}</div>
                      </div>
                    </div>
                    <div className='bg-slate-50 rounded-xl p-3 border border-slate-100'>
                      <div className='flex items-center gap-1.5 text-slate-400 mb-1'>
                        <MapPin className='h-3 w-3' />
                        <span className='text-[10px] font-semibold uppercase tracking-wider'>Birth Location</span>
                      </div>
                      <div className='font-semibold text-slate-900 text-sm'>{lead.birth_location || '—'}</div>
                    </div>
                  </div>

                  {/* Question */}
                  {lead.customer_question && (
                    <div className='space-y-2'>
                      <h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Customer Question</h4>
                      <div className='bg-slate-50 rounded-xl p-4 border border-slate-100'>
                        <p className='text-sm text-slate-700 leading-relaxed'>{lead.customer_question}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Pipeline */}
                  <div className='space-y-3 pt-2'>
                    <h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Status Pipeline</h4>
                    <div className='flex items-center gap-1 flex-wrap'>
                      {STATUS_FLOW.map((status, idx) => {
                        const isCurrent = lead.status === status
                        const isPast = currentFlowIndex > idx
                        return (
                          <div key={status} className='flex items-center gap-1'>
                            <button
                              onClick={() => handleStatus(status)}
                              disabled={isPast || isCurrent}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                isCurrent
                                  ? 'bg-violet-600 text-white shadow-md'
                                  : isPast
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              {isPast && <CheckCircle className='h-3 w-3 inline mr-1' />}
                              {status.replace('_', ' ')}
                            </button>
                            {idx < STATUS_FLOW.length - 1 && (
                              <ChevronRight className={`h-3 w-3 ${isPast ? 'text-emerald-400' : 'text-slate-200'}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className='flex gap-2 flex-wrap pt-1'>
                      {lead.status !== 'converted' && (
                        <Button size='sm' className='bg-emerald-600 hover:bg-emerald-700 text-white rounded-full' onClick={() => handleStatus('converted')}>
                          <CheckCircle className='h-4 w-4 mr-1' /> Converted
                        </Button>
                      )}
                      {lead.status !== 'follow_up' && (
                        <Button size='sm' variant='outline' className='border-orange-300 text-orange-700 hover:bg-orange-50 rounded-full' onClick={() => handleStatus('follow_up')}>
                          Follow Up
                        </Button>
                      )}
                      {lead.status !== 'cold' && (
                        <Button size='sm' variant='outline' className='border-slate-300 text-slate-600 hover:bg-slate-50 rounded-full' onClick={() => handleStatus('cold')}>
                          <Ban className='h-4 w-4 mr-1' /> Cold
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Kundali Report Tab */}
                <TabsContent value='report' className='space-y-4 mt-4'>
                  {!lead.ai_answer && !chart && (
                    <div className='p-5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm text-center'>
                      <Info className='h-6 w-6 mx-auto mb-2 text-amber-500' />
                      <p className='font-medium'>No Kundali report generated yet</p>
                      <p className='text-xs text-amber-600 mt-1'>The user submitted details but the AI report was not saved.</p>
                    </div>
                  )}

                  {chart && (
                    <div className='space-y-3'>
                      <h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Birth Chart</h4>
                      <div className='grid grid-cols-2 gap-2'>
                        <div className='bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100 text-center'>
                          <Sun className='h-5 w-5 text-amber-500 mx-auto mb-1' />
                          <div className='text-[10px] text-slate-400 uppercase font-semibold'>Sun Sign</div>
                          <div className='font-bold text-slate-900 text-sm'>{chart.sunSign}</div>
                        </div>
                        <div className='bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-3 border border-slate-100 text-center'>
                          <Moon className='h-5 w-5 text-slate-500 mx-auto mb-1' />
                          <div className='text-[10px] text-slate-400 uppercase font-semibold'>Moon Sign</div>
                          <div className='font-bold text-slate-900 text-sm'>{chart.moonSign}</div>
                        </div>
                        <div className='bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-3 border border-yellow-100 text-center'>
                          <Star className='h-5 w-5 text-yellow-500 mx-auto mb-1' />
                          <div className='text-[10px] text-slate-400 uppercase font-semibold'>Nakshatra</div>
                          <div className='font-bold text-slate-900 text-sm'>{chart.nakshatra}</div>
                        </div>
                        <div className='bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100 text-center'>
                          <ArrowUp className='h-5 w-5 text-emerald-500 mx-auto mb-1' />
                          <div className='text-[10px] text-slate-400 uppercase font-semibold'>Ascendant</div>
                          <div className='font-bold text-slate-900 text-sm'>{chart.ascendant}</div>
                        </div>
                        <div className='bg-slate-50 rounded-xl p-3 border border-slate-100 text-center'>
                          <div className='text-[10px] text-slate-400 uppercase font-semibold'>Mahadasha</div>
                          <div className='font-bold text-slate-900 text-sm'>{chart.mahadasha}</div>
                        </div>
                        <div className='bg-slate-50 rounded-xl p-3 border border-slate-100 text-center'>
                          <div className='text-[10px] text-slate-400 uppercase font-semibold'>Antardasha</div>
                          <div className='font-bold text-slate-900 text-sm'>{chart.antardasha}</div>
                        </div>
                        <div className='col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100 text-center'>
                          <div className='text-[10px] text-slate-400 uppercase font-semibold'>Current Transit</div>
                          <div className='font-bold text-slate-900 text-sm'>{chart.currentTransit}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {insights && (
                    <div className='space-y-3'>
                      <h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Insights</h4>
                      <div className='grid grid-cols-2 gap-2'>
                        {insights.bestPeriod && (
                          <div className='bg-amber-50 border border-amber-100 p-3 rounded-xl'>
                            <div className='text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-1'>Best Period</div>
                            <div className='text-sm text-slate-800 font-medium'>{insights.bestPeriod}</div>
                          </div>
                        )}
                        {insights.remedy && (
                          <div className='bg-emerald-50 border border-emerald-100 p-3 rounded-xl'>
                            <div className='text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1'>Remedy</div>
                            <div className='text-sm text-slate-800 font-medium'>{insights.remedy}</div>
                          </div>
                        )}
                        {insights.luckyDay && (
                          <div className='bg-blue-50 border border-blue-100 p-3 rounded-xl'>
                            <div className='text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-1'>Lucky Day</div>
                            <div className='text-sm text-slate-800 font-medium'>{insights.luckyDay}</div>
                          </div>
                        )}
                        {insights.fieldAdvice && (
                          <div className='bg-purple-50 border border-purple-100 p-3 rounded-xl'>
                            <div className='text-purple-700 text-[10px] font-bold uppercase tracking-wider mb-1'>Guidance</div>
                            <div className='text-sm text-slate-800 font-medium'>{insights.fieldAdvice}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {lead.ai_answer && (
                    <div className='space-y-2'>
                      <h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider'>AI Report</h4>
                      <div className='text-sm text-slate-700 bg-amber-50 p-4 rounded-xl border border-amber-100 whitespace-pre-line leading-relaxed'>{lead.ai_answer}</div>
                    </div>
                  )}
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value='notes' className='space-y-4 mt-4'>
                  <div className='space-y-3'>
                    <Label className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Admin Notes</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder='Add internal notes about this lead...'
                      className='min-h-[160px] rounded-xl border-slate-200'
                    />
                    <Button
                      size='sm'
                      className='bg-violet-600 hover:bg-violet-700 text-white rounded-full'
                      onClick={() => updateLead.mutate({ leadId: lead.id, updates: { report_data_json: { ...(lead.report_data_json || {}), admin_notes: adminNotes } } })}
                    >
                      <Save className='h-4 w-4 mr-1' /> Save Notes
                    </Button>
                  </div>

                  {/* Metadata */}
                  <div className='pt-4 border-t border-slate-100 space-y-2'>
                    <h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Lead Metadata</h4>
                    <div className='text-xs text-slate-500 space-y-1'>
                      <div>Lead ID: <span className='font-mono text-slate-700'>{lead.id}</span></div>
                      <div>Created: <span className='text-slate-700'>{new Date(lead.created_at).toLocaleString()}</span></div>
                      <div>Source: <span className='text-slate-700 capitalize'>{lead.source.replace('_', ' ')}</span></div>
                      <div>Area of Life: <span className='text-slate-700'>{getAreaName(lead.area_of_life_id)}</span></div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Lead Confirmation */}
      <Dialog open={!!deleteLeadId} onOpenChange={() => setDeleteLeadId(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete Lead?</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-slate-500'>This will permanently delete this lead and all associated report data. This action cannot be undone.</p>
          <div className='flex gap-3 pt-2'>
            <Button variant='outline' className='flex-1' onClick={() => setDeleteLeadId(null)}>Cancel</Button>
            <Button className='flex-1 bg-red-500 hover:bg-red-600 text-white' onClick={() => deleteLeadId && handleDeleteLead(deleteLeadId)} disabled={deleteLead.isPending}>
              {deleteLead.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4 mr-1' />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AreaManager() {
  const { data: areas } = useAllLeadAreas()
  const createArea = useCreateLeadArea()
  const updateArea = useUpdateLeadArea()
  const deleteArea = useDeleteLeadArea()
  const [editing, setEditing] = useState<LeadArea | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '', slug: '', sort_order: 0, is_active: true })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const resetForm = () => {
    setForm({ name: '', icon: '', slug: '', sort_order: (areas?.length || 0) + 1, is_active: true })
  }

  const openCreate = () => {
    setEditing(null)
    resetForm()
    setOpen(true)
  }

  const openEdit = (a: LeadArea) => {
    setEditing(a)
    setForm({ name: a.name, icon: a.icon, slug: a.slug, sort_order: a.sort_order, is_active: a.is_active })
    setOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Name and Slug are required')
      return
    }
    if (editing) {
      updateArea.mutate(
        { id: editing.id, updates: { ...form, name: form.name.trim(), slug: form.slug.trim() } },
        { onSuccess: () => setOpen(false) }
      )
    } else {
      createArea.mutate(
        { ...form, name: form.name.trim(), slug: form.slug.trim() },
        { onSuccess: () => setOpen(false) }
      )
    }
  }

  const handleDelete = (id: string) => {
    deleteArea.mutate(id, { onSuccess: () => setDeleteConfirm(null) })
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-bold text-slate-900'>Area Manager</h2>
        <Button size='sm' className='bg-[#f59e0b] text-slate-900 hover:bg-amber-500' onClick={openCreate}>
          <Plus className='h-4 w-4 mr-1' /> New Area
        </Button>
      </div>

      <div className='bg-white border border-slate-100 rounded-xl overflow-hidden'>
        <table className='w-full text-sm'>
          <thead className='bg-slate-50 text-slate-500'>
            <tr>
              <th className='text-left px-4 py-3'>Icon</th>
              <th className='text-left px-4 py-3'>Name</th>
              <th className='text-left px-4 py-3'>Slug</th>
              <th className='text-left px-4 py-3'>Order</th>
              <th className='text-left px-4 py-3'>Active</th>
              <th className='text-right px-4 py-3'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {areas?.map((a) => (
              <tr key={a.id} className='hover:bg-slate-50'>
                <td className='px-4 py-3 text-lg'>{a.icon}</td>
                <td className='px-4 py-3 font-medium'>{a.name}</td>
                <td className='px-4 py-3 text-xs text-slate-500'>{a.slug}</td>
                <td className='px-4 py-3 text-xs'>{a.sort_order}</td>
                <td className='px-4 py-3'>
                  <Badge variant={a.is_active ? 'default' : 'secondary'} className={a.is_active ? 'bg-emerald-100 text-emerald-700' : ''}>
                    {a.is_active ? 'Yes' : 'No'}
                  </Badge>
                </td>
                <td className='px-4 py-3 text-right'>
                  <Button size='sm' variant='ghost' onClick={() => openEdit(a)}><Pencil className='h-4 w-4' /></Button>
                  <Button size='sm' variant='ghost' className='text-red-500 hover:text-red-700 hover:bg-red-50' onClick={() => setDeleteConfirm(a.id)}><Trash2 className='h-4 w-4' /></Button>
                </td>
              </tr>
            ))}
            {(!areas || areas.length === 0) && (
              <tr>
                <td colSpan={6} className='px-4 py-8 text-center text-slate-400 text-sm'>
                  No areas found. Click "New Area" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Area' : 'New Area'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setForm((f) => ({ ...f, name, slug: editing ? f.slug : generateSlug(name) }))
                  }}
                  placeholder='Career & Job'
                />
              </div>
              <div className='space-y-1'>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder='career-job' />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Icon (emoji)</Label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder='💼' />
              </div>
              <div className='space-y-1'>
                <Label>Sort Order</Label>
                <Input type='number' value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className='accent-[#f59e0b]'
              />
              Active (visible to users)
            </label>
            <Button className='w-full bg-[#f59e0b] text-slate-900' onClick={handleSave} disabled={createArea.isPending || updateArea.isPending}>
              {createArea.isPending || updateArea.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Save className='h-4 w-4 mr-1' />
              )}
              {editing ? 'Save Changes' : 'Create Area'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete Area?</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-slate-500'>This will permanently remove this area. Leads linked to it will lose the area reference.</p>
          <div className='flex gap-3 pt-2'>
            <Button variant='outline' className='flex-1' onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button className='flex-1 bg-red-500 hover:bg-red-600 text-white' onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={deleteArea.isPending}>
              {deleteArea.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4 mr-1' />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PromptEditor() {
  const { data: areas } = useAllLeadAreas()
  const updateArea = useUpdateLeadArea()
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [prompt, setPrompt] = useState('')

  const area = areas?.find((a) => a.id === selectedArea)

  return (
    <div className='space-y-4'>
      <h2 className='text-lg font-bold text-slate-900'>AI Prompt Editor</h2>
      <div className='space-y-2'>
        <Label>Select Area</Label>
        <select className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm' value={selectedArea} onChange={(e) => { setSelectedArea(e.target.value); setPrompt(areas?.find((a) => a.id === e.target.value)?.ai_prompt || '') }}>
          <option value=''>Choose an area...</option>
          {areas?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      {area && (
        <div className='space-y-3'>
          <div className='flex gap-2 flex-wrap'>
            {['{name}', '{question}', '{birth_details}', '{area_name}'].map((v) => (
              <Badge key={v} variant='secondary' className='cursor-pointer' onClick={() => setPrompt((p) => p + ' ' + v)}>{v}</Badge>
            ))}
          </div>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className='min-h-[200px]' />
          <Button className='bg-[#f59e0b] text-slate-900' onClick={() => updateArea.mutate({ id: area.id, updates: { ai_prompt: prompt } })}>Save Prompt</Button>
        </div>
      )}
    </div>
  )
}

function LeadSettings() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['lead-settings-admin'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('settings').select('value').eq('key', 'lead_magnet').single()
      if (error) {
        return { enabled: true, delay_seconds: 15, headline_en: 'Know Your Future — Free Astrology Report', headline_hi: 'अपना भविष्य जानें — मुफ़्त ज्योतिष रिपोर्ट', qna_mode: true }
      }
      return data?.value as Record<string, unknown>
    },
  })

  const [form, setForm] = useState({ enabled: true, delay_seconds: 15, headline_en: '', headline_hi: '', qna_mode: true })

  useEffect(() => {
    if (settings) {
      setForm({
        enabled: !!settings.enabled,
        delay_seconds: Number(settings.delay_seconds || 15),
        headline_en: (settings.headline_en as string) || 'Know Your Future — Free Astrology Report',
        headline_hi: (settings.headline_hi as string) || 'अपना भविष्य जानें — मुफ़्त ज्योतिष रिपोर्ट',
        qna_mode: !!settings.qna_mode,
      })
    }
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const supabase = createClient()
      await supabase.from('settings').upsert({ key: 'lead_magnet', value: updates }, { onConflict: 'key' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-settings-admin'] })
      toast.success('Lead Magnet settings saved')
    },
    onError: () => toast.error('Failed to save settings'),
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      <div className='space-y-4 bg-white border border-slate-100 rounded-xl p-6'>
        <h2 className='text-lg font-bold text-slate-900'>Lead Settings</h2>
        
        <div className='flex items-center justify-between'>
          <Label>Enable Lead Popup</Label>
          <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
        </div>
        
        <div className='flex items-center justify-between'>
          <Label>Q&A Mode (Personalized)</Label>
          <Switch checked={form.qna_mode} onCheckedChange={(v) => setForm({ ...form, qna_mode: v })} />
        </div>

        <div className='space-y-2'>
          <Label>Popup Delay</Label>
          <select className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm' value={form.delay_seconds} onChange={(e) => setForm({ ...form, delay_seconds: Number(e.target.value) })}>
            <option value={5}>5 seconds</option>
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={0}>On Scroll 50%</option>
          </select>
        </div>

        <div className='space-y-2'>
          <Label>Headline (English)</Label>
          <Input value={form.headline_en} onChange={(e) => setForm({ ...form, headline_en: e.target.value })} />
        </div>
        
        <div className='space-y-2'>
          <Label>Headline (Hindi)</Label>
          <Input value={form.headline_hi} onChange={(e) => setForm({ ...form, headline_hi: e.target.value })} />
        </div>

        <Button className='w-full bg-[#f59e0b] text-slate-900' onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
          <Save className='h-4 w-4 mr-2' /> Save Settings
        </Button>
      </div>

      <div className='flex justify-center items-center bg-slate-50 border border-slate-100 rounded-xl p-6'>
        <div className='relative w-[300px] h-[600px] bg-white border-8 border-slate-900 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col justify-end'>
          <div className='absolute top-0 w-full h-6 bg-slate-900 rounded-b-xl flex justify-center'>
            <div className='w-16 h-4 bg-black rounded-b-xl'></div>
          </div>
          <div className='bg-white h-[85%] rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 space-y-4'>
            <div className='flex justify-end'>
              <div className='w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs'>X</div>
            </div>
            <h3 className='text-lg font-bold text-center leading-tight'>{form.headline_en}</h3>
            <p className='text-xs text-center text-slate-500'>Enter your birth details. Ask your question. Get personalized guidance.</p>
            <div className='space-y-2 pt-2'>
              <div className='h-10 bg-slate-100 rounded-lg w-full'></div>
              <div className='h-10 bg-slate-100 rounded-lg w-full'></div>
              <div className='h-10 bg-slate-100 rounded-lg w-full'></div>
              <div className='h-10 bg-[#f59e0b] rounded-lg w-full mt-4'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
