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
      .channel('public:students-feed')
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
    <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] h-[600px] flex flex-col relative overflow-hidden">
      {/* Subtle corner glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--color-marketnera)]/5 blur-[50px] rounded-full pointer-events-none"></div>

      <h3 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-widest mb-4 sticky top-0 bg-[var(--color-surface)] py-2 border-b border-[var(--color-border)] z-10">
        Live Entry Feed
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="feed-item flex items-center gap-3 p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)] animate-pulse">
              <div className="w-9 h-9 rounded-full bg-[var(--color-border)]"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--color-border)] rounded w-32"></div>
                <div className="h-3 bg-[var(--color-border)] rounded w-24"></div>
              </div>
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-[var(--color-muted)] font-mono">WAITING FOR SCANS...</p>
          </div>
        ) : (
          entries.map((student) => (
            <div key={student.id} className="feed-item flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-marketnera)]/30 transition-all">
              <div className="w-9 h-9 rounded-full bg-[var(--color-marketnera)]/20 border border-[var(--color-marketnera)]/40 flex items-center justify-center text-[var(--color-marketnera)] font-bold text-sm flex-shrink-0">
                {student.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-text)] truncate">{student.name}</p>
                <p className="text-xs text-[var(--color-muted)] font-mono">
                  {student.student_id || (!student.whatsapp_number || student.whatsapp_number.startsWith('no-phone-') ? '' : student.whatsapp_number)}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] font-bold text-[var(--color-marketnera)] bg-[var(--color-marketnera)]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">GRANTED</span>
                <p className="text-[10px] text-[var(--color-muted)] mt-1 font-mono">
                  {student.scanned_at ? new Date(student.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
