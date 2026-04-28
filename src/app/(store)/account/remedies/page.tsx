'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useRemedies, useRemedyLogs, useCreateRemedyLog, useUpdateRemedy } from '@/hooks/use-remedies'
import { Button } from '@/components/ui/button'
import { CheckCircle, ChevronDown, ChevronUp, FileText, Play, Loader2 } from 'lucide-react'

export default function MyRemediesPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/account/remedies')
    }
  }, [user, isLoading, router])

  const { data: remedies } = useRemedies({ customerId: user?.id })

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const active = (remedies || []).filter((r) => r.status === 'active')
  const completed = (remedies || []).filter((r) => r.status === 'completed')
  const display = tab === 'active' ? active : completed

  return (
    <div className='max-w-4xl'>
      <h1 className='text-xl font-bold text-slate-900 mb-4'>My Remedies</h1>

      <div className='flex gap-2 mb-4'>
        <Button size='sm' variant={tab === 'active' ? 'default' : 'outline'} onClick={() => setTab('active')}>
          Active ({active.length})
        </Button>
        <Button size='sm' variant={tab === 'completed' ? 'default' : 'outline'} onClick={() => setTab('completed')}>
          History ({completed.length})
        </Button>
      </div>

      {display.length === 0 && (
        <div className='text-center py-12 bg-slate-50 rounded-xl'>
          <p className='text-slate-500'>No {tab} remedies</p>
        </div>
      )}

      <div className='space-y-3'>
        {display.map((remedy) => (
          <RemedyCard
            key={remedy.id}
            remedy={remedy}
            expanded={expanded === remedy.id}
            onToggle={() => setExpanded(expanded === remedy.id ? null : remedy.id)}
          />
        ))}
      </div>
    </div>
  )
}

function RemedyCard({
  remedy,
  expanded,
  onToggle,
}: {
  remedy: import('@/hooks/use-remedies').Remedy
  expanded: boolean
  onToggle: () => void
}) {
  const { data: logs } = useRemedyLogs(remedy.id)
  const createLog = useCreateRemedyLog()
  const updateRemedy = useUpdateRemedy()

  const today = new Date().toISOString().split('T')[0]
  const doneToday = logs?.some((l) => l.log_date === today && l.status === 'done')
  const doneCount = logs?.filter((l) => l.status === 'done').length || 0
  const progress = remedy.duration_days ? Math.min(100, Math.round((doneCount / remedy.duration_days) * 100)) : 0
  const willComplete = remedy.duration_days ? doneCount + 1 >= remedy.duration_days : false

  const toggleToday = async () => {
    if (doneToday) return
    await createLog.mutateAsync({
      remedy_id: remedy.id,
      customer_id: remedy.customer_id,
      log_date: today,
      status: 'done',
    })
    if (willComplete) {
      await updateRemedy.mutateAsync({ id: remedy.id, updates: { status: 'completed' } })
    }
  }

  return (
    <div className='bg-white border border-slate-100 rounded-xl p-4 space-y-3'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='font-semibold text-slate-900'>{remedy.title}</h3>
          <p className='text-xs text-slate-500'>{remedy.frequency} • {remedy.duration_days} days</p>
        </div>
        <Button size='sm' variant='ghost' onClick={onToggle}>
          {expanded ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
        </Button>
      </div>

      {remedy.duration_days && (
        <div className='space-y-1'>
          <div className='flex justify-between text-xs text-slate-500'>
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className='h-2 bg-slate-100 rounded-full overflow-hidden'>
            <div className='h-full bg-emerald-500 rounded-full transition-all' style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {remedy.status === 'active' && (
        <Button
          size='sm'
          className={doneToday ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-[#f59e0b] text-slate-900'}
          onClick={toggleToday}
          disabled={doneToday || createLog.isPending}
        >
          <CheckCircle className='h-4 w-4 mr-1' />
          {doneToday ? 'Done Today' : 'Mark Done Today'}
        </Button>
      )}

      {expanded && (
        <div className='space-y-3 pt-2 border-t border-slate-100'>
          <div className='text-sm text-slate-700 whitespace-pre-line'>{remedy.description}</div>
          {remedy.instructions && (
            <div className='bg-slate-50 rounded-lg p-3 space-y-1'>
              <div className='flex items-center gap-2 text-sm font-medium text-slate-900'>
                <FileText className='h-4 w-4' /> Instructions
              </div>
              <p className='text-sm text-slate-600 whitespace-pre-line'>{remedy.instructions}</p>
            </div>
          )}
          {remedy.attachment_url && (
            <a href={remedy.attachment_url} target='_blank' rel='noopener noreferrer' className='inline-flex items-center gap-2 text-sm text-[#f59e0b] font-medium'>
              <Play className='h-4 w-4' /> View Attachment
            </a>
          )}

          {logs && logs.length > 0 && (
            <div className='flex flex-wrap gap-1 pt-2'>
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
                    log.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}
                  title={log.log_date}
                >
                  {new Date(log.log_date).getDate()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
