'use client'

import { useState, useEffect, useRef } from 'react'
import { getActiveEvents } from '../import/actions'
import { getMasterQRInfo } from './actions'
import { createClient } from '@/utils/supabase/client'
import QRCode from 'react-qr-code'
import { ShieldCheck, Download, Printer } from 'lucide-react'

export default function MasterQRPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState<number>(0)
  
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getActiveEvents().then(data => {
      setEvents(data)
      if (data.length > 0) setSelectedEventId(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedEventId) return

    let channel: any = null

    const initInfo = async () => {
      const info = await getMasterQRInfo(selectedEventId)
      if (info) {
        setQrToken(info.master_qr_token)
        setScanCount(info.master_scan_count)
      }

      const supabase = createClient()
      channel = supabase
        .channel(`public:events-master-${selectedEventId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'events',
            filter: `id=eq.${selectedEventId}`,
          },
          (payload: any) => {
            if (payload.new && typeof payload.new.master_scan_count === 'number') {
              setScanCount(payload.new.master_scan_count)
            }
          }
        )
        .subscribe()
    }

    initInfo()

    return () => {
      if (channel) {
        const supabase = createClient()
        supabase.removeChannel(channel)
      }
    }
  }, [selectedEventId])

  const handleDownload = () => {
    if (!qrRef.current) return
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `master-qr-${selectedEventId}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const scanUrl = qrToken ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://marketnera.com'}/scan?token=${qrToken}` : ''

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="print:hidden">
        <h1 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-widest">VIP Master QR</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">Multi-use infinite QR code for VIP guests and crew members.</p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 shadow-xl relative overflow-hidden print:border-none print:shadow-none print:p-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none print:hidden"></div>

        <div className="space-y-8 relative z-10 flex flex-col items-center text-center">
          <div className="w-full print:hidden">
            <label className="block text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3 text-left">Target Event</label>
            <select 
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-[#0A0F0D] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] focus:outline-none focus:border-purple-500 transition-colors appearance-none"
            >
              {events.length === 0 ? <option value="">No active events found</option> : null}
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          {!qrToken ? (
            <div className="py-24 text-[var(--color-muted)] font-mono text-sm print:hidden">
              SELECT AN EVENT TO VIEW MASTER QR
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.15)] print:shadow-none print:p-0" ref={qrRef}>
                <QRCode value={scanUrl} size={300} level="H" />
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-black text-[var(--color-text)] uppercase tracking-widest flex items-center justify-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-purple-500" />
                  VIP ACCESS TICKET
                </h3>
                <p className="text-[var(--color-muted)] text-sm font-medium">Keep this QR secure. It grants infinite entries.</p>
              </div>

              <div className="flex gap-4 print:hidden w-full max-w-sm mt-6">
                <button 
                  onClick={handleDownload}
                  className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white font-bold hover:bg-[var(--color-border)] transition-colors active:scale-95"
                >
                  <Download className="w-4 h-4" /> SVG
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-[var(--color-border)] w-full print:hidden">
                <div className="inline-flex flex-col items-center p-6 bg-[#0A0F0D] rounded-2xl border border-[var(--color-border)] min-w-[200px]">
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-2">Live Scans</span>
                  <span className="text-5xl font-black text-white font-mono animate-[count-up_0.3s_ease-out]">{scanCount}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
