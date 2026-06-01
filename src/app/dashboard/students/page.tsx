'use client'

import { useState, useEffect } from 'react'
import StudentTable from '../StudentTable'
import { getActiveEvents } from '../import/actions'
import { Users } from 'lucide-react'

export default function StudentsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')

  useEffect(() => {
    getActiveEvents().then(data => {
      setEvents(data)
      if (data.length > 0) setSelectedEventId(data[0].id)
    })
  }, [])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-widest flex items-center gap-3">
            <Users className="w-6 h-6 text-[var(--color-marketnera)]" />
            Students Management
          </h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">View, filter, and manage student roster.</p>
        </div>

        <div className="w-full sm:w-64">
          <select 
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-[#0A0F0D] border border-[var(--color-border)] rounded-xl px-4 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-marketnera)] transition-colors appearance-none"
          >
            {events.length === 0 ? <option value="">No active events found</option> : null}
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {selectedEventId ? (
        <StudentTable eventId={selectedEventId} />
      ) : (
        <div className="bg-[var(--color-surface)] p-8 rounded-2xl border border-[var(--color-border)] text-center">
          <p className="text-[var(--color-muted)]">Select an event to view students.</p>
        </div>
      )}
    </div>
  )
}
