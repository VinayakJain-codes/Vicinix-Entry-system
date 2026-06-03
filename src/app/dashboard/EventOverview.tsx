'use client'

import { useState } from 'react'
import StatCards from './StatCards'
import LiveEntryFeed from './LiveEntryFeed'
import StudentTable from './StudentTable'
import { deleteEvent } from './actions'
import { Trash2 } from 'lucide-react'
import { Tables } from '@/types/database.types'

export default function EventOverview({ events }: { events: Tables<'events'>[] }) {
  const [selectedEventId, setSelectedEventId] = useState(events.length > 0 ? events[0].id : '')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteEvent = async () => {
    if (!selectedEventId) return
    if (!window.confirm('Are you sure you want to delete this event and all associated data (students, scan logs)? This action cannot be undone.')) return
    
    setIsDeleting(true)
    const res = await deleteEvent(selectedEventId)
    setIsDeleting(false)
    
    if (res.error) {
      alert(res.error)
    } else {
      window.location.reload()
    }
  }

  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm text-center">
        <p className="text-zinc-500">No events found. Create an event first.</p>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col space-y-8">
      {/* Event Selector */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Event Overview</h2>
        <div className="flex items-center gap-4">
          <select 
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-white"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id} className="dark:bg-zinc-800">{e.name}</option>
            ))}
          </select>
          {selectedEventId && (
            <button
              onClick={handleDeleteEvent}
              disabled={isDeleting}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
              title="Delete Event"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {selectedEventId && (
        <>
          <StatCards eventId={selectedEventId} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <StudentTable eventId={selectedEventId} />
            </div>
            <div className="lg:col-span-1">
              <LiveEntryFeed eventId={selectedEventId} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
