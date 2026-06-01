'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard Error boundary caught:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-[#111918] rounded-xl border border-[#1F2D28]">
      <div className="p-4 bg-[#ef4444]/10 rounded-full mb-4">
        <AlertTriangle className="h-10 w-10 text-[#ef4444]" />
      </div>
      <h2 className="text-xl font-bold text-[#E8F5F0] mb-2">Something went wrong</h2>
      <p className="text-[#4B6358] max-w-md mb-6">
        {error.message || "We couldn't load this dashboard section. This might be a temporary network issue."}
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 bg-[#1A2420] hover:bg-[#1F2D28] text-[#E8F5F0] px-6 py-3 rounded-lg font-semibold transition-colors border border-[#1F2D28] hover:border-[#13EC5B]/50"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  )
}
