export default function StoreLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 px-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
        <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
      </div>
      <div className="space-y-2 text-center">
        <p className="text-lg font-semibold text-slate-900">
          Loading your spiritual journey...
        </p>
        <p className="text-sm text-slate-500">
          Aligning cosmic energies for you
        </p>
      </div>
    </div>
  )
}
