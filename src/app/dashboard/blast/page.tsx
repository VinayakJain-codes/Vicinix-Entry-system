'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { blastWhatsAppForEvent } from '../blastAction'
import { getActiveEvents } from '../import/actions'
import { getDeliveryStats } from './actions'
import { MessageCircle, Loader2, Send, AlertTriangle, RefreshCw } from 'lucide-react'

export default function BlastPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [stats, setStats] = useState<{ total: number, sent: number, error: number, generated: number, pending: number } | null>(null)

  useEffect(() => {
    getActiveEvents().then(data => {
      setEvents(data)
      if (data.length > 0) setSelectedEventId(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (selectedEventId) {
      getDeliveryStats(selectedEventId).then(setStats)
    } else {
      setStats(null)
    }
  }, [selectedEventId])

  const handleBlast = async (retryFailedOnly = false) => {
    if (!selectedEventId) return
    setIsProcessing(true)
    
    try {
      let currentRemaining = -1
      
      while (currentRemaining !== 0) {
        const result = await blastWhatsAppForEvent(selectedEventId, 50, retryFailedOnly)
        if (result.error) {
          toast.error(result.error)
          break
        }
        
        currentRemaining = result.remaining || 0
        // Refresh stats mid-flight
        getDeliveryStats(selectedEventId).then(setStats)

        // Break if we are making no progress (everything in the batch failed)
        if (result.processed === 0 && result.errors > 0) {
          toast.error('Some messages failed to send. Check configuration or numbers and try again.')
          break
        }
      }
      toast.success('WhatsApp blast completed.')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsProcessing(false)
      getDeliveryStats(selectedEventId).then(setStats)
    }
  }

  const deliveryPercent = stats?.total ? Math.round((stats.sent / stats.total) * 100) : 0

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-widest">WhatsApp Blast</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">Deliver generated QR tickets to students via WhatsApp.</p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="space-y-8 relative z-10">
          <div>
            <label className="block text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3">Target Event</label>
            <select 
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-[#0A0F0D] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] focus:outline-none focus:border-green-500 transition-colors appearance-none"
            >
              {events.length === 0 ? <option value="">No active events found</option> : null}
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col justify-between">
              <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Ready to Send</span>
              <span className="text-4xl font-black text-white mt-2">{stats?.generated || 0}</span>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 flex flex-col justify-between">
              <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Delivered</span>
              <span className="text-4xl font-black text-green-500 mt-2">{stats?.sent || 0}</span>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex flex-col justify-between">
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Failed</span>
              <span className="text-4xl font-black text-red-500 mt-2">{stats?.error || 0}</span>
            </div>
          </div>

          <div className="bg-[#0A0F0D] border border-[var(--color-border)] rounded-2xl p-6">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h4 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-widest">Delivery Progress</h4>
              </div>
              <span className="text-3xl font-black text-green-500 font-mono">{deliveryPercent}%</span>
            </div>
            <div className="w-full bg-[var(--color-surface-2)] rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                style={{ width: `${deliveryPercent}%` }} 
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={() => handleBlast(false)}
              disabled={!selectedEventId || isProcessing || !stats || stats.generated === 0}
              className="flex-1 flex justify-center items-center gap-2 px-6 py-4 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Blasting...</> : <><Send className="w-5 h-5" /> Blast QRs via WhatsApp</>}
            </button>

            <button
              onClick={() => handleBlast(true)}
              disabled={!selectedEventId || isProcessing || !stats || stats.error === 0}
              className="flex justify-center items-center gap-2 px-6 py-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white font-bold hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
              title="Retry Failed"
            >
              <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Retry Failed ({stats?.error || 0})</span>
            </button>
          </div>

          {stats && stats.error > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>Some messages failed to deliver. This is usually due to an invalid WhatsApp number. Check the student roster to correct their phone numbers, then use 'Retry Failed'.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
