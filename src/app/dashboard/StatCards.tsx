'use client'

import { useEffect, useState } from 'react'
import { getDashboardStats } from './actions'
import { createClient } from '@/utils/supabase/client'

type Stats = {
  headcount: number
  totalStudents: number
  masterScans: number
  qrDelivered: number
}

export default function StatCards({ eventId }: { eventId: string }) {
  const [stats, setStats] = useState<Stats>({ headcount: 0, totalStudents: 0, masterScans: 0, qrDelivered: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return

    async function fetchStats() {
      const newStats = await getDashboardStats(eventId)
      setStats(newStats)
      setLoading(false)
    }

    const supabase = createClient()
    
    const channel = supabase
      .channel(`stats-${eventId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'students',
        filter: `event_id=eq.${eventId}`
      }, () => fetchStats())
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'events',
        filter: `id=eq.${eventId}`
      }, () => fetchStats())
      .subscribe()

    fetchStats()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  if (!eventId) return null

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] flex flex-col justify-between items-start h-32">
            <div className="h-4 w-32 bg-[var(--color-border)] rounded animate-pulse"></div>
            <div className="mt-4 h-10 w-16 bg-[var(--color-border)] rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-8">
      {/* Headcount Card */}
      <div className="card-glow bg-[var(--color-surface)] p-6 rounded-2xl border-t-2 border-t-[var(--color-marketnera)] border-[var(--color-border)] flex flex-col justify-between items-start transition-all relative overflow-hidden">
        <h3 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Total Scanned</h3>
        <div className="mt-4 flex items-baseline gap-2 z-10">
          <span className="text-5xl font-black text-[var(--color-marketnera)] animate-[count-up_0.3s_ease-out]">
            {stats.headcount}
          </span>
          <span className="text-sm text-[var(--color-muted)] font-mono">/ {stats.totalStudents}</span>
        </div>
        <div className="mt-4 w-full bg-[var(--color-surface-2)] rounded-full h-1.5 z-10">
          <div 
            className="bg-[var(--color-marketnera)] h-1.5 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(19,236,91,0.5)]" 
            style={{ width: `${stats.totalStudents > 0 ? Math.min(100, Math.round((stats.headcount / stats.totalStudents) * 100)) : 0}%` }} 
          />
        </div>
        {/* Subtle background glow */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[var(--color-marketnera)]/10 blur-3xl rounded-full"></div>
      </div>

      {/* Pending Card */}
      <div className="card-glow bg-[var(--color-surface)] p-6 rounded-2xl border-t-2 border-t-[var(--color-pending)] border-[var(--color-border)] flex flex-col justify-between items-start transition-all relative overflow-hidden">
        <h3 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Pending Entry</h3>
        <div className="mt-4 z-10">
          <span className="text-5xl font-black text-[var(--color-pending)] animate-[count-up_0.3s_ease-out]">
            {Math.max(0, stats.totalStudents - stats.headcount)}
          </span>
        </div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[var(--color-pending)]/10 blur-3xl rounded-full"></div>
      </div>

      {/* QR Delivered Card */}
      <div className="card-glow bg-[var(--color-surface)] p-6 rounded-2xl border-t-2 border-t-blue-500 border-[var(--color-border)] flex flex-col justify-between items-start transition-all relative overflow-hidden">
        <h3 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">QR Delivered</h3>
        <div className="mt-4 flex items-baseline gap-2 z-10">
          <span className="text-5xl font-black text-blue-500 animate-[count-up_0.3s_ease-out]">
            {stats.qrDelivered}
          </span>
          <span className="text-sm text-[var(--color-muted)] font-mono">/ {stats.totalStudents}</span>
        </div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
      </div>

      {/* Master Scans Card */}
      <div className="card-glow bg-[var(--color-surface)] p-6 rounded-2xl border-t-2 border-t-purple-500 border-[var(--color-border)] flex flex-col justify-between items-start transition-all relative overflow-hidden">
        <h3 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">VIP Master Scans</h3>
        <div className="mt-4 z-10">
          <span className="text-5xl font-black text-purple-500 animate-[count-up_0.3s_ease-out]">
            {stats.masterScans}
          </span>
        </div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full"></div>
      </div>
    </div>
  )
}
