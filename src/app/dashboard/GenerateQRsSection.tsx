'use client'

import { useState } from 'react'
import { generateQRsForEvent } from './qrAction'

export default function GenerateQRsSection({ events }: { events: any[] }) {
  const [selectedEvent, setSelectedEvent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<{ processed: number; remaining: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!selectedEvent) return
    setIsProcessing(true)
    setError(null)
    
    try {
      let currentRemaining = -1
      
      while (currentRemaining !== 0) {
        const result = await generateQRsForEvent(selectedEvent)
        if (result.error) {
          setError(result.error)
          break
        }
        
        setProgress(prev => ({
          processed: (prev?.processed || 0) + (result.processed || 0),
          remaining: result.remaining || 0
        }))
        
        currentRemaining = result.remaining || 0
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <section className="bg-white dark:bg-black rounded-2xl shadow-xl w-full p-8 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
        Generate QRs
      </h2>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="eventSelect" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Select Event
          </label>
          <select
            id="eventSelect"
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
          onClick={handleGenerate}
          disabled={!selectedEvent || isProcessing}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Generating...' : 'Generate QRs'}
        </button>

        {error && (
          <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {progress && (
          <div className="mt-4 p-4 text-sm text-green-700 bg-green-100 rounded-md dark:bg-green-900/30 dark:text-green-400">
            Processed: {progress.processed}. Remaining: {progress.remaining}.
          </div>
        )}
      </div>
    </section>
  )
}
