'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { blastWhatsAppForEvent } from './blastAction'

export default function BlastSection({ events }: { events: any[] }) {
  const [selectedEvent, setSelectedEvent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<{ processed: number; remaining: number; errors: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleBlast = async () => {
    if (!selectedEvent) return
    setIsProcessing(true)
    
    try {
      let currentRemaining = -1
      
      while (currentRemaining !== 0) {
        const result = await blastWhatsAppForEvent(selectedEvent)
        if (result.error) {
          toast.error(result.error)
          break
        }
        
        setProgress(prev => ({
          processed: (prev?.processed || 0) + (result.processed || 0),
          remaining: result.remaining || 0,
          errors: (prev?.errors || 0) + (result.errors || 0)
        }))
        
        currentRemaining = result.remaining || 0
      }
      toast.success('WhatsApp blast completed.')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <section className="bg-white dark:bg-black rounded-2xl shadow-xl w-full p-8 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
        WhatsApp Blast
      </h2>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="blastEventSelect" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Select Event
          </label>
          <select
            id="blastEventSelect"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:bg-zinc-900 dark:text-white"
          >
            <option value="">-- Choose an event --</option>
            {events.map((e: any) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleBlast}
          disabled={!selectedEvent || isProcessing}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-zinc-900 bg-green-400 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Blasting...' : 'Blast QRs via WhatsApp'}
        </button>

        {progress && (
          <div className="mt-4 p-4 text-sm text-green-700 bg-green-100 rounded-md dark:bg-green-900/30 dark:text-green-400">
            Sent: {progress.processed}. Errors: {progress.errors}. Remaining: {progress.remaining}.
          </div>
        )}
      </div>
    </section>
  )
}
