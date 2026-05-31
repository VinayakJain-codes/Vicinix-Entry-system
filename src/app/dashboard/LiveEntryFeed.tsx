'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Tables } from '@/types/database.types'

type Student = Tables<'students'>

export default function LiveEntryFeed({ eventId }: { eventId: string }) {
  const [entries, setEntries] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return

    const supabase = createClient()

    // Fetch initial recent scans (e.g. last 50)
    const fetchRecentScans = async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('event_id', eventId)
        .not('scanned_at', 'is', null)
        .order('scanned_at', { ascending: false })
        .limit(50)
      
      if (data) {
        setEntries(data as Student[])
      }
      setLoading(false)
    }

    fetchRecentScans()

    // Subscribe to realtime updates for this event
    const channel = supabase
      .channel('public:students')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'students',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newStudent = payload.new as Student
          // If the student was just scanned (scanned_at is now set)
          if (newStudent.scanned_at) {
            setEntries((prev) => {
              // Avoid duplicates if multiple updates happen
              if (prev.some((s) => s.id === newStudent.id)) {
                return prev.map(s => s.id === newStudent.id ? newStudent : s)
              }
              // Add to top of feed
              return [newStudent, ...prev].slice(0, 50)
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  if (!eventId) return null

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 h-[600px] flex flex-col">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4 sticky top-0 bg-white dark:bg-zinc-800 py-2 border-b border-zinc-100 dark:border-zinc-700 z-10">
        Live Entry Feed
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 animate-pulse">
              <div className="flex flex-col space-y-2">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32"></div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-24"></div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded-md w-16"></div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded w-12"></div>
              </div>
            </div>
          ))
        ) : entries.length === 0 ? (
          <p className="text-sm text-zinc-500 italic mt-4 text-center">No recent entries</p>
        ) : (
          entries.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{student.name}</span>
                <span className="text-xs text-zinc-500">{student.phone_number}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md">GRANTED</span>
                <span className="text-[10px] text-zinc-400 mt-1">
                  {student.scanned_at ? new Date(student.scanned_at).toLocaleTimeString() : ''}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
