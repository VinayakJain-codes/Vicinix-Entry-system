'use client'

import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<{ status: 'idle' | 'scanning' | 'success' | 'invalid' | 'duplicate' | 'master'; message?: string; student?: any; event?: any }>({ status: 'scanning' })

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (scanResult.status === 'scanning') {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      )

      scanner.render(async (decodedText) => {
        // Pause scanning
        scanner?.clear()
        setScanResult({ status: 'idle' })

        try {
          const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: decodedText })
          })
          const data = await res.json()

          if (res.ok) {
            if (data.isMaster) {
              setScanResult({ status: 'master', event: data.event })
            } else {
              setScanResult({ status: 'success', student: data.student })
            }
          } else if (res.status === 404) {
            setScanResult({ status: 'invalid', message: data.error })
          } else if (res.status === 400) {
            setScanResult({ status: 'duplicate', message: data.error, student: data.student })
          } else {
            setScanResult({ status: 'invalid', message: 'Unknown error' })
          }
        } catch (e) {
          setScanResult({ status: 'invalid', message: 'Network error' })
        }
      }, (err) => {
        // ignore continuous scanning errors
      })
    }

    return () => {
      scanner?.clear().catch(console.error)
    }
  }, [scanResult.status])

  return (
    <div className={`flex flex-col min-h-screen font-sans ${
      scanResult.status === 'success' ? 'bg-green-500' :
      scanResult.status === 'master' ? 'bg-blue-500' :
      scanResult.status === 'invalid' ? 'bg-red-500' :
      scanResult.status === 'duplicate' ? 'bg-yellow-500' :
      'bg-zinc-900'
    } transition-colors duration-300 items-center justify-center p-4`}>
      
      {scanResult.status === 'scanning' && (
        <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-zinc-100 text-center font-bold text-zinc-800">
            Scan QR Code
          </div>
          <div id="qr-reader" className="w-full text-black"></div>
        </div>
      )}

      {scanResult.status !== 'scanning' && scanResult.status !== 'idle' && (
        <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl max-w-sm w-full border border-white/20 text-white">
          <h1 className="text-5xl font-black mb-4 uppercase tracking-wider">
            {scanResult.status === 'master' ? 'VIP ENTRY' : scanResult.status}
          </h1>
          {scanResult.message && <p className="text-xl mb-6 font-medium">{scanResult.message}</p>}
          {scanResult.student && (
            <div className="mb-8 p-4 bg-black/20 rounded-xl">
              <p className="text-2xl font-bold">{scanResult.student.name}</p>
              <p className="text-sm opacity-80 mt-1">{scanResult.student.phone_number}</p>
            </div>
          )}
          {scanResult.event && (
            <div className="mb-8 p-4 bg-black/20 rounded-xl">
              <p className="text-2xl font-bold">{scanResult.event.name}</p>
              <p className="text-sm opacity-80 mt-1">Master Token (Multi-Use)</p>
            </div>
          )}
          
          <button
            onClick={() => setScanResult({ status: 'scanning' })}
            className="w-full py-4 px-6 bg-white text-zinc-900 rounded-xl font-bold text-lg hover:bg-zinc-100 transition-transform active:scale-95 shadow-xl"
          >
            Scan Next
          </button>
        </div>
      )}
      
      {scanResult.status === 'idle' && (
        <div className="text-white font-bold animate-pulse text-2xl">Processing...</div>
      )}
    </div>
  )
}
