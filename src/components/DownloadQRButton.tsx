'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DownloadQRButtonProps {
  qrUrl: string
  eventName: string
}

export default function DownloadQRButton({ qrUrl, eventName }: DownloadQRButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    
    const toastId = toast.loading('Preparing your QR ticket...')

    try {
      // Try to fetch image and download it as blob (so it triggers save dialog instead of opening tab)
      const res = await fetch(qrUrl, { mode: 'cors' })
      if (!res.ok) throw new Error('Fetch failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      // Format filename nicely, e.g. "Web_Dev_Workshop_QR.png"
      const formattedName = `${eventName.trim().replace(/\s+/g, '_')}_QR.png`
      a.download = formattedName
      
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Ticket downloaded!', { id: toastId })
    } catch (err) {
      console.warn('[QR Download] CORS or fetch error, falling back to opening in new window:', err)
      // Fallback: Open in new tab so they can manually download/long-press save
      try {
        window.open(qrUrl, '_blank')
        toast.success('Opening ticket in new tab (long press to save)', { id: toastId })
      } catch (e) {
        toast.error('Failed to open ticket. Please try again.', { id: toastId })
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-black bg-[var(--color-marketnera)] hover:bg-[var(--color-marketnera-dark)] disabled:opacity-50 transition-all cursor-pointer shadow-[0_0_10px_rgba(19,236,91,0.1)] active:scale-[0.98]"
    >
      {downloading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5" /> Download Ticket
        </>
      )}
    </button>
  )
}
