'use client'

export function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className='bg-[#f59e0b] hover:bg-[#d97706] text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm shadow-lg'
    >
      {label}
    </button>
  )
}
