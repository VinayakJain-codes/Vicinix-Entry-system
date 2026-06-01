'use client'

import { useEffect, useState, useMemo } from 'react'
import { getStudents } from './actions'
import { Tables } from '@/types/database.types'
import { QrCode, Search, Download, X } from 'lucide-react'

type Student = Tables<'students'>

export default function StudentTable({ eventId }: { eventId: string }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'entered' | 'pending'>('all')
  const [qrModalStudent, setQrModalStudent] = useState<Student | null>(null)

  useEffect(() => {
    if (!eventId) return
    
    async function fetchStudents() {
      const data = await getStudents(eventId)
      setStudents(data)
      setLoading(false)
    }
    
    fetchStudents()
  }, [eventId])

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const searchLower = search.toLowerCase()
      const matchesSearch = 
        s.name.toLowerCase().includes(searchLower) || 
        s.phone_number.includes(searchLower) ||
        (s.student_id && s.student_id.toLowerCase().includes(searchLower)) ||
        (s.enrollment_no && s.enrollment_no.toLowerCase().includes(searchLower))
      
      let matchesStatus = true
      if (statusFilter === 'entered') matchesStatus = s.scanned_at !== null
      if (statusFilter === 'pending') matchesStatus = s.scanned_at === null

      return matchesSearch && matchesStatus
    })
  }, [students, search, statusFilter])

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return

    const headers = ['Name', 'Phone Number', 'Student ID', 'Enrollment No', 'QR Status', 'Scanned At']
    const rows = filteredStudents.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.phone_number}"`,
      `"${s.student_id || ''}"`,
      `"${s.enrollment_no || ''}"`,
      `"${s.qr_status || 'N/A'}"`,
      s.scanned_at ? `"${new Date(s.scanned_at).toLocaleString()}"` : '"Pending"'
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `students_export_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!eventId) return null

  return (
    <div className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] h-[600px] flex flex-col relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-bold text-[var(--color-text)] uppercase tracking-widest">Student Roster</h3>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
            <input 
              type="text" 
              placeholder="Search name, ID, phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-[var(--color-border)] rounded-xl bg-[#0A0F0D] text-sm focus:outline-none focus:border-[var(--color-marketnera)] text-[var(--color-text)] placeholder-[var(--color-muted)] transition-colors"
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[#0A0F0D] text-sm focus:outline-none focus:border-[var(--color-marketnera)] text-[var(--color-text)] transition-colors appearance-none"
          >
            <option value="all">All Status</option>
            <option value="entered">Entered</option>
            <option value="pending">Pending</option>
          </select>

          <button 
            onClick={handleExportCSV}
            disabled={filteredStudents.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-bold rounded-xl hover:bg-[var(--color-border)] transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto border border-[var(--color-border)] rounded-xl custom-scrollbar">
        <table className="w-full text-left text-sm text-[var(--color-text)] whitespace-nowrap">
          <thead className="bg-[#0A0F0D] sticky top-0 uppercase tracking-widest text-[10px] text-[var(--color-muted)] z-10 border-b border-[var(--color-border)]">
            <tr>
              <th className="px-6 py-4 font-bold">Name</th>
              <th className="px-6 py-4 font-bold">Student ID</th>
              <th className="px-6 py-4 font-bold">Phone</th>
              <th className="px-6 py-4 font-bold">QR Status</th>
              <th className="px-6 py-4 font-bold">Entry Status</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse bg-[var(--color-surface)]">
                  <td className="px-6 py-5"><div className="h-4 bg-[var(--color-border)] rounded w-3/4"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-[var(--color-border)] rounded w-1/2"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-[var(--color-border)] rounded w-1/2"></div></td>
                  <td className="px-6 py-5"><div className="h-6 bg-[var(--color-border)] rounded-full w-20"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-[var(--color-border)] rounded w-16"></div></td>
                  <td className="px-6 py-5"><div className="h-8 bg-[var(--color-border)] rounded-lg w-10 ml-auto"></div></td>
                </tr>
              ))
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-muted)] font-mono">
                  NO STUDENTS FOUND
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--color-surface-2)] transition-colors group">
                  <td className="px-6 py-4 font-semibold">{s.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[var(--color-muted)]">{s.student_id || '-'}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[var(--color-muted)]">{s.phone_number}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${s.qr_status === 'sent' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {s.qr_status || 'generated'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {s.scanned_at ? (
                      <span className="text-[var(--color-marketnera)] font-bold text-xs uppercase tracking-wider">Granted</span>
                    ) : (
                      <span className="text-[var(--color-muted)] font-medium text-xs uppercase tracking-wider">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setQrModalStudent(s)}
                      className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-marketnera)] hover:border-[var(--color-marketnera)]/50 transition-all opacity-50 group-hover:opacity-100"
                      title="View QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View QR Modal */}
      {qrModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(19,236,91,0.1)] relative">
            <button 
              onClick={() => setQrModalStudent(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[var(--color-surface-2)] hover:text-white transition-colors text-[var(--color-muted)]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-center mb-1">{qrModalStudent.name}</h3>
            <p className="text-sm font-mono text-center text-[var(--color-muted)] mb-6">{qrModalStudent.student_id || qrModalStudent.phone_number}</p>
            
            <div className="bg-white p-4 rounded-xl mx-auto w-48 h-48 flex items-center justify-center mb-6">
              {/* Using a simple placeholder image for the QR since we don't have the QR generation logic client-side easily accessible here without a library. The master plan implies showing it if it's there. Let's just use an img tag to the qr_token if we had an API, or a placeholder if we don't. We'll use a placeholder for now since we're just building the UI framework. */}
              <QrCode className="w-24 h-24 text-black" />
            </div>
            
            <div className="text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${qrModalStudent.qr_status === 'sent' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {qrModalStudent.qr_status || 'Generated'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
