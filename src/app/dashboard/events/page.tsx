'use client'

import { useEffect, useState } from 'react'
import { getEventsWithCounts, createEvent, toggleEventActive } from './actions'
import { Calendar, Plus, Archive, CheckCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchEvents = async () => {
    const data = await getEventsWithCounts()
    setEvents(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const date = formData.get('date') as string

    const result = await createEvent(name, date || null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Event created successfully')
      setIsModalOpen(false)
      fetchEvents()
    }
    setIsSubmitting(false)
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const result = await toggleEventActive(id, !currentStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Event ${!currentStatus ? 'activated' : 'archived'}`)
      fetchEvents()
    }
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-widest">Events Management</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">Manage all entry events across the platform.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--color-marketnera)] text-black px-4 py-2 rounded-xl font-bold hover:bg-[var(--color-marketnera-dark)] transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#0A0F0D] text-[var(--color-muted)] uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]">
            <tr>
              <th className="px-6 py-4 font-bold">Event Name</th>
              <th className="px-6 py-4 font-bold">Date</th>
              <th className="px-6 py-4 font-bold">Students</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {loading ? (
               Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-5"><div className="h-4 bg-[var(--color-border)] rounded w-48"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-[var(--color-border)] rounded w-24"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-[var(--color-border)] rounded w-12"></div></td>
                  <td className="px-6 py-5"><div className="h-6 bg-[var(--color-border)] rounded-full w-20"></div></td>
                  <td className="px-6 py-5"><div className="h-8 bg-[var(--color-border)] rounded-lg w-24 ml-auto"></div></td>
                </tr>
              ))
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-muted)] font-mono">
                  NO EVENTS FOUND
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-text)]">
                  <td className="px-6 py-4 font-bold">{event.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[var(--color-muted)]">
                    {event.date ? new Date(event.date).toLocaleDateString() : 'No Date'}
                  </td>
                  <td className="px-6 py-4 font-mono">{event.student_count}</td>
                  <td className="px-6 py-4">
                    {event.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[var(--color-marketnera)]/10 text-[var(--color-marketnera)] border border-[var(--color-marketnera)]/20">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Archive className="w-3 h-3" /> Archived
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleToggleActive(event.id, event.is_active)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                        event.is_active 
                          ? 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-amber-500 hover:border-amber-500/50' 
                          : 'border-[var(--color-marketnera)]/30 text-[var(--color-marketnera)] hover:bg-[var(--color-marketnera)]/10'
                      }`}
                    >
                      {event.is_active ? 'Archive' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(19,236,91,0.05)] relative">
            <h2 className="text-xl font-bold text-[var(--color-text)] uppercase tracking-widest mb-6">Create New Event</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Event Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="w-full bg-[#0A0F0D] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-marketnera)] transition-colors"
                  placeholder="e.g. Annual Tech Gala"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Event Date (Optional)</label>
                <input 
                  type="date" 
                  name="date" 
                  className="w-full bg-[#0A0F0D] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-marketnera)] transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] font-bold hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-marketnera)] text-black font-bold hover:bg-[var(--color-marketnera-dark)] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
