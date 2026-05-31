'use client'

import { useState } from 'react'
import QRCode from 'react-qr-code'

export default function MasterQRSection({ events }: { events: any[] }) {
  const [selectedEventId, setSelectedEventId] = useState('')

  const selectedEvent = events.find(e => e.id === selectedEventId)

  return (
    <section className="bg-white dark:bg-black rounded-2xl shadow-xl w-full p-8 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
        Master QR (VIP)
      </h2>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="masterEventSelect" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Select Event
          </label>
          <select
            id="masterEventSelect"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:bg-zinc-900 dark:text-white"
          >
            <option value="">-- Choose an event --</option>
            {events.map((e: any) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <div className="flex flex-col items-center p-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-4">Total Scans: {selectedEvent.master_scan_count || 0}</p>
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
              <QRCode
                value={selectedEvent.master_qr_token}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
              />
            </div>
            <p className="text-xs text-zinc-400 font-mono break-all text-center">
              Token: {selectedEvent.master_qr_token}
            </p>
            <p className="text-xs text-zinc-500 text-center mt-2">
              This QR code acts as a multi-use pass.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
