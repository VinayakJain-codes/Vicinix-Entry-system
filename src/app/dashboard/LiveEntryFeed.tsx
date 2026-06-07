'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Tables } from '@/types/database.types'
import { Search } from 'lucide-react'

type Student = Tables<'students'>

export default function LiveEntryFeed({ eventId }: { eventId: string }) {
  const [entries, setEntries] = useState<Student[]>([])
  const [leftStudents, setLeftStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [leftLoading, setLeftLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'feed' | 'left'>('feed')
  const [leftSearch, setLeftSearch] = useState('')

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

    // Fetch initial left/pending students
    const fetchLeftStudents = async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('event_id', eventId)
        .is('scanned_at', null)
        .order('name', { ascending: true })
      
      if (data) {
        setLeftStudents(data as Student[])
      }
      setLeftLoading(false)
    }

    setLoading(true)
    setLeftLoading(true)
    fetchRecentScans()
    fetchLeftStudents()

    // Subscribe to realtime updates for this event
    const channel = supabase
      .channel('public:students-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const student = payload.new as Student
            if (student.scanned_at) {
              setEntries((prev) => {
                if (prev.some(s => s.id === student.id)) return prev
                return [student, ...prev].slice(0, 50)
              })
            } else {
              setLeftStudents((prev) => {
                if (prev.some(s => s.id === student.id)) return prev
                return [...prev, student].sort((a, b) => a.name.localeCompare(b.name))
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            const student = payload.new as Student
            if (student.scanned_at) {
              // Add/update in entries (Live Entry Feed)
              setEntries((prev) => {
                if (prev.some((s) => s.id === student.id)) {
                  return prev.map(s => s.id === student.id ? student : s)
                }
                return [student, ...prev].slice(0, 50)
              })
              // Remove from leftStudents
              setLeftStudents((prev) => prev.filter(s => s.id !== student.id))
            } else {
              // Remove from entries
              setEntries((prev) => prev.filter(s => s.id !== student.id))
              // Add/update in leftStudents
              setLeftStudents((prev) => {
                if (prev.some((s) => s.id === student.id)) {
                  return prev.map(s => s.id === student.id ? student : s)
                }
                return [...prev, student].sort((a, b) => a.name.localeCompare(b.name))
              })
            }
          } else if (payload.eventType === 'DELETE') {
            const studentId = payload.old.id
            setEntries((prev) => prev.filter(s => s.id !== studentId))
            setLeftStudents((prev) => prev.filter(s => s.id !== studentId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  if (!eventId) return null

  // Filter left students based on search query
  const filteredLeftStudents = leftStudents.filter((student) => {
    const query = leftSearch.toLowerCase()
    return (
      student.name.toLowerCase().includes(query) ||
      (student.roll_no && student.roll_no.toLowerCase().includes(query)) ||
      (student.whatsapp_number && !student.whatsapp_number.startsWith('no-phone-') && student.whatsapp_number.includes(query))
    )
  })

  return (
    <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] h-[600px] flex flex-col relative overflow-hidden">
      {/* Subtle corner glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--color-marketnera)]/5 blur-[50px] rounded-full pointer-events-none"></div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] mb-4 sticky top-0 bg-[var(--color-surface)] z-10 select-none">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest text-center border-b-2 transition-all duration-200 ${
            activeTab === 'feed'
              ? 'border-[var(--color-marketnera)] text-[var(--color-text)]'
              : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          Live Feed
        </button>
        <button
          onClick={() => setActiveTab('left')}
          className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest text-center border-b-2 transition-all duration-200 ${
            activeTab === 'left'
              ? 'border-[var(--color-marketnera)] text-[var(--color-text)]'
              : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          Left Students ({leftStudents.length})
        </button>
      </div>

      {/* Search Input for Left Students */}
      {activeTab === 'left' && (
        <div className="relative mb-4 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="Search remaining students..."
            value={leftSearch}
            onChange={(e) => setLeftSearch(e.target.value)}
            className="pl-9 pr-3 py-2 w-full border border-[var(--color-border)] rounded-xl bg-[#0A0F0D] text-xs focus:outline-none focus:border-[var(--color-marketnera)] text-[var(--color-text)] placeholder-[var(--color-muted)] transition-colors"
          />
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {activeTab === 'feed' ? (
          loading ? (
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
          )
        ) : (
          leftLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="feed-item flex items-center gap-3 p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)] animate-pulse">
                <div className="w-9 h-9 rounded-full bg-[var(--color-border)]"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--color-border)] rounded w-32"></div>
                  <div className="h-3 bg-[var(--color-border)] rounded w-24"></div>
                </div>
              </div>
            ))
          ) : filteredLeftStudents.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-[var(--color-muted)] font-mono">NO STUDENTS LEFT TO ENTER</p>
            </div>
          ) : (
            filteredLeftStudents.map((student) => (
              <div key={student.id} className="feed-item flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-marketnera)]/30 transition-all">
                <div className="w-9 h-9 rounded-full bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-400 font-bold text-sm flex-shrink-0">
                  {student.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text)] truncate">{student.name}</p>
                  <p className="text-xs text-[var(--color-muted)] font-mono">
                    {student.roll_no || student.student_id || (!student.whatsapp_number || student.whatsapp_number.startsWith('no-phone-') ? '' : student.whatsapp_number)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">PENDING</span>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}
