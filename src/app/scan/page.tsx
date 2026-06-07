'use client'

import { useEffect, useState, useRef } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle2, XCircle, RefreshCw, Zap } from 'lucide-react'
import { getGuardScanCount } from './actions'

type ScanResult = {
  status: 'idle' | 'scanning' | 'success' | 'invalid' | 'duplicate' | 'master'
  message?: string
  student?: any
  event?: any
}

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<ScanResult>({ status: 'scanning' })
  const [guardEmail, setGuardEmail] = useState<string>('')
  const [sessionScans, setSessionScans] = useState(0)
  
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchUserAndScans = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setGuardEmail(user.email)
      }

      // Load persistent scan count from the database
      const { count } = await getGuardScanCount()
      setSessionScans(count)
    }
    fetchUserAndScans()
  }, [])

  // Haptics and Sounds
  const triggerHaptic = (type: 'success' | 'error') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') navigator.vibrate(200) // Short pulse
      else navigator.vibrate([200, 100, 200, 100, 200]) // 3 pulses for error
    }
  }

  const handleScan = async (decodedText: string) => {
    if (scanResult.status !== 'scanning') return;
    
    setScanResult({ status: 'idle' })

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: decodedText })
      })
      const data = await res.json()

      if (res.ok) {
        setSessionScans(prev => prev + 1)
        triggerHaptic('success')
        if (data.isMaster) {
          setScanResult({ status: 'master', event: data.event })
        } else {
          setScanResult({ status: 'success', student: data.student })
        }
      } else if (res.status === 404) {
        triggerHaptic('error')
        setScanResult({ status: 'invalid', message: data.error })
      } else if (res.status === 400) {
        triggerHaptic('error')
        setScanResult({ status: 'duplicate', message: data.error, student: data.student })
      } else {
        triggerHaptic('error')
        setScanResult({ status: 'invalid', message: 'Unknown error' })
      }
    } catch (e) {
      triggerHaptic('error')
      setScanResult({ status: 'invalid', message: 'Network error' })
    }
  }

  // Auto-reset effect for results
  useEffect(() => {
    if (['success', 'master', 'invalid', 'duplicate'].includes(scanResult.status)) {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      
      const delay = (scanResult.status === 'invalid' || scanResult.status === 'duplicate') ? 3000 : 1200;

      resetTimerRef.current = setTimeout(() => {
        setScanResult({ status: 'scanning' })
      }, delay)
    }

    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [scanResult.status])

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0A0F0D] text-[#E8F5F0] overflow-hidden relative">
      
      {/* Sticky Header */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-[#0A0F0D]/80 backdrop-blur-md z-40 border-b border-[#1F2D28]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#13EC5B] animate-pulse"></div>
            <h1 className="font-black tracking-widest text-[#13EC5B] uppercase text-sm">MARKETNERA</h1>
          </div>
          <div className="text-[10px] font-mono text-[#4B6358] mt-1 truncate max-w-[150px]">
            {guardEmail || 'Authenticating...'}
          </div>
        </div>
      </div>

      {/* Main Scan Area */}
      <div className="flex-1 flex flex-col items-center justify-center pt-20 pb-24 relative">
        {scanResult.status === 'scanning' && (
          <div className="w-full max-w-sm px-4">
            <div className="scan-frame relative rounded-[2rem] overflow-hidden border-4 border-transparent shadow-[0_0_40px_rgba(19,236,91,0.1)]">
              <Scanner 
                onScan={(result) => handleScan(result[0].rawValue)}
                allowMultiple={true}
                scanDelay={300}
              />
            </div>
          </div>
        )}

        {scanResult.status === 'idle' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#13EC5B] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold tracking-widest uppercase text-[#4B6358]">Verifying...</p>
          </div>
        )}
      </div>

      {/* Bottom Session Counter */}
      {scanResult.status === 'scanning' && (
        <div className="absolute bottom-0 left-0 w-full p-6 flex justify-between items-center bg-gradient-to-t from-black to-transparent z-30">
          <div className="flex gap-4">
            <button className="p-3 rounded-full bg-[#111918] border border-[#1F2D28] text-[#4B6358] hover:text-[#13EC5B] transition-colors">
              <Zap className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-full bg-[#111918] border border-[#1F2D28] text-[#4B6358] hover:text-[#13EC5B] transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-[#4B6358] font-bold">Total Scans</span>
            <span className="text-3xl font-black text-[#E8F5F0] font-mono">{sessionScans}</span>
          </div>
        </div>
      )}

      {/* Overlays */}
      {scanResult.status !== 'scanning' && scanResult.status !== 'idle' && (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200 ${
          scanResult.status === 'success' || scanResult.status === 'master' ? 'bg-[#13EC5B] text-black' : 
          'bg-red-500 text-white'
        }`}>
          <div className="flex flex-col items-center text-center max-w-sm w-full">
            {scanResult.status === 'success' || scanResult.status === 'master' ? (
              <CheckCircle2 className="w-24 h-24 mb-6 stroke-[3]" />
            ) : (
              <XCircle className="w-24 h-24 mb-6 stroke-[3]" />
            )}
            
            <h1 className="text-5xl font-black uppercase tracking-tight mb-2">
              {scanResult.status === 'success' ? 'GRANTED' : 
               scanResult.status === 'master' ? 'VIP GRANTED' : 
               'DENIED'}
            </h1>
            
            <div className="h-1 w-16 bg-current opacity-20 rounded-full mb-6"></div>

            {scanResult.student && (
              <div className="space-y-1">
                <p className="text-3xl font-bold">{scanResult.student.name}</p>
                {!scanResult.student.whatsapp_number || scanResult.student.whatsapp_number.startsWith('no-phone-') ? null : (
                  <p className="text-lg opacity-80 font-mono">{scanResult.student.whatsapp_number}</p>
                )}
                {scanResult.student.roll_no && (
                  <p className="text-sm opacity-60 font-mono">Roll No: {scanResult.student.roll_no}</p>
                )}
              </div>
            )}
            
            {scanResult.event && (
              <div className="space-y-1">
                <p className="text-3xl font-bold">{scanResult.event.name}</p>
                <p className="text-lg opacity-80 font-mono">Master Token</p>
              </div>
            )}

            {scanResult.message && (
              <p className="text-xl font-semibold mt-4 bg-black/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                {scanResult.message}
              </p>
            )}

            <button
              onClick={() => setScanResult({ status: 'scanning' })}
              className="mt-12 w-full py-4 rounded-2xl bg-black/10 backdrop-blur-md border border-current/20 font-bold uppercase tracking-widest hover:bg-black/20 transition-colors active:scale-95"
            >
              Scan Next →
            </button>
            
            <p className="absolute bottom-8 text-[10px] font-black tracking-[0.3em] opacity-30">MARKETNERA</p>
          </div>
        </div>
      )}
    </div>
  )
}
