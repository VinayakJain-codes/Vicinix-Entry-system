'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { generateQRsForEvent } from '../qrAction'
import { getActiveEvents } from '../import/actions'
import { getStudents } from '../actions'
import { QrCode, Loader2, Search } from 'lucide-react'

export default function QRGenerationPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<{ processed: number; remaining: number } | null>(null)

  const [previews, setPreviews] = useState<any[]>([])

  const fetchPreviews = async (eventId: string) => {
    if (!eventId) return
    const data = await getStudents(eventId)
    setPreviews(data.filter(s => s.qr_url).slice(0, 10))
  }

  useEffect(() => {
    getActiveEvents().then(data => {
      setEvents(data)
      if (data.length > 0) {
        setSelectedEventId(data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (selectedEventId) {
      fetchPreviews(selectedEventId)
    }
  }, [selectedEventId])

  const handleGenerate = async () => {
    if (!selectedEventId) return
    setIsProcessing(true)
    setProgress({ processed: 0, remaining: 1 }) // just to show UI immediately
    
    try {
      let currentRemaining = -1
      
      while (currentRemaining !== 0) {
        const result = await generateQRsForEvent(selectedEventId)
        if (result.error) {
          toast.error(result.error)
          break
        }
        
        setProgress(prev => ({
          processed: (prev?.processed || 0) + (result.processed || 0),
          remaining: result.remaining || 0
        }))
        
        currentRemaining = result.remaining || 0
      }
      toast.success('QR generation completed.')
      fetchPreviews(selectedEventId)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsProcessing(false)
      // fetch previews or just reset progress after a few seconds
      setTimeout(() => setProgress(null), 5000)
    }
  }

  const totalStudents = progress ? progress.processed + progress.remaining : 0
  const progressPercent = totalStudents > 0 ? Math.round((progress!.processed / totalStudents) * 100) : 0

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-widest">Generate QRs</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">Batch generate unique QR tokens for imported students.</p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-marketnera)]/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="space-y-8 relative z-10">
          <div>
            <label className="block text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3">Target Event</label>
            <select 
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-[#0A0F0D] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-marketnera)] transition-colors appearance-none"
            >
              {events.length === 0 ? <option value="">No active events found</option> : null}
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div className="border border-[var(--color-border)] bg-[var(--color-surface-2)] rounded-2xl p-6 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-[var(--color-marketnera)]/10 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-8 h-8 text-[var(--color-marketnera)]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[var(--color-text)] mb-1">Batch Generation Engine</h3>
              <p className="text-sm text-[var(--color-muted)]">Generates secure, signed URL tokens and encodes them into QR codes for all students missing a token.</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!selectedEventId || isProcessing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-marketnera)] text-black font-bold hover:bg-[var(--color-marketnera-dark)] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(19,236,91,0.2)]"
            >
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : 'Generate All QRs'}
            </button>
          </div>

          {progress !== null && (
            <div className="bg-[#0A0F0D] border border-[var(--color-border)] rounded-2xl p-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-widest">Generation Progress</h4>
                  <p className="text-xs text-[var(--color-muted)] mt-1 font-mono">{progress.processed} / {totalStudents} completed</p>
                </div>
                <span className="text-3xl font-black text-[var(--color-marketnera)] font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[var(--color-surface-2)] rounded-full h-2">
                <div 
                  className="bg-[var(--color-marketnera)] h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(19,236,91,0.5)]" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Previews area */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
         {previews.length > 0 ? previews.map((s, i) => (
           <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col items-center hover:border-[var(--color-marketnera)]/50 transition-colors">
             <div className="w-full aspect-square bg-white rounded-lg border border-[var(--color-border)] flex items-center justify-center mb-3 overflow-hidden p-2">
               <img src={s.qr_url} alt="QR" className="w-full h-full object-contain" />
             </div>
             <div className="text-xs font-bold text-[var(--color-text)] truncate w-full text-center">{s.name}</div>
             <div className="text-[10px] text-[var(--color-muted)] font-mono truncate w-full text-center">{s.roll_no || s.whatsapp_number}</div>
           </div>
         )) : (
           Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col items-center opacity-50 pointer-events-none">
               <div className="w-full aspect-square bg-[#0A0F0D] rounded-lg border border-[var(--color-border)] flex items-center justify-center mb-3">
                 <QrCode className="w-10 h-10 text-[var(--color-muted)] opacity-30" />
               </div>
               <div className="w-3/4 h-2 bg-[var(--color-border)] rounded mb-1"></div>
               <div className="w-1/2 h-2 bg-[var(--color-border)] rounded"></div>
             </div>
           ))
         )}
      </div>
    </div>
  )
}
