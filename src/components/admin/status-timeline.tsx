'use client'

const stages = [
  'pending',
  'accepted',
  'processing',
  'packed',
  'shipped',
  'delivered',
]

const stageLabels: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
}

interface StatusTimelineProps {
  status: string
  size?: 'sm' | 'md'
}

export function StatusTimeline({ status, size = 'md' }: StatusTimelineProps) {
  const currentIndex = stages.indexOf(status)
  const dotSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
  const lineHeight = size === 'sm' ? 'h-0.5' : 'h-1'

  return (
    <div className="flex items-center w-full">
      {stages.map((stage, idx) => {
        const isActive = idx <= currentIndex
        const isCurrent = idx === currentIndex
        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            <div
              className={`${dotSize} rounded-full flex-shrink-0 ${
                isActive
                  ? isCurrent
                    ? 'bg-[#f59e0b] ring-2 ring-amber-200'
                    : 'bg-emerald-500'
                  : 'bg-slate-200'
              }`}
              title={stageLabels[stage]}
            />
            {idx < stages.length - 1 && (
              <div
                className={`flex-1 ${lineHeight} mx-1 rounded ${
                  idx < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
