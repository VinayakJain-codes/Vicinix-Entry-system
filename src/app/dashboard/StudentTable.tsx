'use client'

import { useEffect, useState, useMemo } from 'react'
import { getStudents, updateStudent, resendStudentQR } from './actions'
import { Tables } from '@/types/database.types'
import { QrCode, Search, Download, X, Edit2, Loader2, Send } from 'lucide-react'
import toast from 'react-hot-toast'

type Student = Tables<'students'>

export default function StudentTable({ eventId }: { eventId: string }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'entered' | 'pending'>('all')
  const [qrModalStudent, setQrModalStudent] = useState<Student | null>(null)
  const [editModalStudent, setEditModalStudent] = useState<Student | null>(null)
  const [editForm, setEditForm] = useState({ name: '', whatsapp_number: '', roll_no: '' })
  const [saving, setSaving] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'uploaded'>('name')

  const handleResend = async (student: Student) => {
    if (resendingId) return
    setResendingId(student.id)
    try {
      const res = await resendStudentQR(student.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`QR code sent to ${student.name} successfully`)
        setStudents(prev => prev.map(s => 
          s.id === student.id 
            ? { ...s, qr_status: res.qr_status || 'sent', qr_url: res.qr_url || s.qr_url } 
            : s
        ))
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend QR code')
    } finally {
      setResendingId(null)
    }
  }

  const handleEditClick = (student: Student) => {
    setEditModalStudent(student)
    setEditForm({
      name: student.name || '',
      whatsapp_number: student.whatsapp_number || '',
      roll_no: student.roll_no || ''
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModalStudent) return

    setSaving(true)
    try {
      const res = await updateStudent(
        editModalStudent.id,
        editForm.name,
        editForm.whatsapp_number,
        editForm.roll_no
      )

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Student details updated successfully')
        
        // Update local state
        setStudents(prev => prev.map(s => 
          s.id === editModalStudent.id 
            ? { 
                ...s, 
                name: editForm.name.trim(), 
                whatsapp_number: editForm.whatsapp_number.replace(/\D/g, ''),
                roll_no: editForm.roll_no ? editForm.roll_no.trim() : null
              } 
            : s
        ))
        
        setEditModalStudent(null)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update student details')
    } finally {
      setSaving(false)
    }
  }

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
    const filtered = students.filter((s) => {
      const searchLower = search.toLowerCase()
      const matchesSearch = 
        s.name.toLowerCase().includes(searchLower) || 
        s.whatsapp_number.includes(searchLower) ||
        (s.roll_no && s.roll_no.toLowerCase().includes(searchLower))
      
      let matchesStatus = true
      if (statusFilter === 'entered') matchesStatus = s.scanned_at !== null
      if (statusFilter === 'pending') matchesStatus = s.scanned_at === null

      return matchesSearch && matchesStatus
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'uploaded') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateA - dateB
      } else {
        return a.name.localeCompare(b.name)
      }
    })
  }, [students, search, statusFilter, sortBy])

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return

    const headers = ['Name', 'Phone Number', 'Enrollment No', 'QR Status', 'Scanned At']
    const rows = filteredStudents.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.whatsapp_number}"`,
      `"${s.roll_no || ''}"`,
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

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[#0A0F0D] text-sm focus:outline-none focus:border-[var(--color-marketnera)] text-[var(--color-text)] transition-colors appearance-none"
          >
            <option value="name">Sort by Name</option>
            <option value="uploaded">Sort by Upload Order</option>
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
                  <td className="px-6 py-5"><div className="h-6 bg-[var(--color-border)] rounded-full w-20"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-[var(--color-border)] rounded w-16"></div></td>
                  <td className="px-6 py-5"><div className="h-8 bg-[var(--color-border)] rounded-lg w-10 ml-auto"></div></td>
                </tr>
              ))
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-muted)] font-mono">
                  NO STUDENTS FOUND
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--color-surface-2)] transition-colors group">
                  <td className="px-6 py-4 font-semibold">{s.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[var(--color-muted)]">{s.whatsapp_number}</td>
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
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => handleResend(s)}
                      disabled={resendingId !== null}
                      className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-marketnera)] hover:border-[var(--color-marketnera)]/50 transition-all opacity-50 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Resend QR Code"
                    >
                      {resendingId === s.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--color-marketnera)]" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleEditClick(s)}
                      className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-marketnera)] hover:border-[var(--color-marketnera)]/50 transition-all opacity-50 group-hover:opacity-100"
                      title="Edit Student"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
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
            <p className="text-sm font-mono text-center text-[var(--color-muted)] mb-6">{qrModalStudent.whatsapp_number}</p>
            
            <div className="bg-white p-4 rounded-xl mx-auto w-48 h-48 flex items-center justify-center mb-6 overflow-hidden">
              {qrModalStudent.qr_url ? (
                <img src={qrModalStudent.qr_url} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-24 h-24 text-black opacity-20" />
              )}
            </div>
            
            <div className="text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${qrModalStudent.qr_status === 'sent' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {qrModalStudent.qr_status || 'Generated'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(19,236,91,0.1)] relative">
            <button 
              onClick={() => {
                setEditModalStudent(null)
                setEditForm({ name: '', whatsapp_number: '', roll_no: '' })
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-[var(--color-surface-2)] hover:text-white transition-colors text-[var(--color-muted)]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-6 uppercase tracking-widest text-[var(--color-text)]">Edit Student Details</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full bg-[#0A0F0D] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-marketnera)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">WhatsApp Number</label>
                <input 
                  type="text" 
                  value={editForm.whatsapp_number}
                  onChange={(e) => setEditForm(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  required
                  className="w-full bg-[#0A0F0D] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-marketnera)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Enrollment No (Roll No)</label>
                <input 
                  type="text" 
                  value={editForm.roll_no}
                  onChange={(e) => setEditForm(prev => ({ ...prev, roll_no: e.target.value }))}
                  className="w-full bg-[#0A0F0D] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-marketnera)] transition-colors"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalStudent(null)
                    setEditForm({ name: '', whatsapp_number: '', roll_no: '' })
                  }}
                  className="flex-1 px-4 py-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white font-bold rounded-xl hover:bg-[var(--color-border)] transition-colors text-center text-sm"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 text-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
