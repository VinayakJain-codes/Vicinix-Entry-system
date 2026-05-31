'use client'

import { useEffect, useState } from 'react'
import { getDashboardStats } from './actions'

type Stats = {
  headcount: number
  totalStudents: number
  masterScans: number
}

export default function StatCards({ eventId }: { eventId: string }) {
  const [stats, setStats] = useState<Stats>({ headcount: 0, totalStudents: 0, masterScans: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return

    async function fetchStats() {
      const newStats = await getDashboardStats(eventId)
      setStats(newStats)
      setLoading(false)
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [eventId])

  if (!eventId) return null

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between items-start h-32">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
            <div className="mt-4 h-10 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
            {i === 1 && (
              <div className="mt-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 animate-pulse"></div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
      {/* Headcount Card */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between items-start transition-all hover:shadow-md">
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Scanned</h3>
        <div className="mt-4 flex items-baseline">
          <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
            {loading ? '...' : stats.headcount}
          </span>
          <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">/ {loading ? '...' : stats.totalStudents}</span>
        </div>
        <div className="mt-4 w-full bg-zinc-100 dark:bg-zinc-700 rounded-full h-2">
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${stats.totalStudents > 0 ? Math.min(100, Math.round((stats.headcount / stats.totalStudents) * 100)) : 0}%` }} 
          />
        </div>
      </div>

      {/* Pending Card */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between items-start transition-all hover:shadow-md">
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pending Entry</h3>
        <div className="mt-4">
          <span className="text-4xl font-extrabold text-amber-500 dark:text-amber-400">
            {loading ? '...' : Math.max(0, stats.totalStudents - stats.headcount)}
          </span>
        </div>
      </div>

      {/* Master Scans Card */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between items-start transition-all hover:shadow-md">
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Master Scans</h3>
        <div className="mt-4">
          <span className="text-4xl font-extrabold text-indigo-500 dark:text-indigo-400">
            {loading ? '...' : stats.masterScans}
          </span>
        </div>
      </div>
    </div>
  )
}
