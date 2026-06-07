'use client'

import { useEffect, useState, useMemo } from 'react'
import { getStudents, updateStudent, resendStudentQR, deleteStudent, deleteMultipleStudents } from './actions'
import { Tables } from '@/types/database.types'
import { QrCode, Search, Download, X, Edit2, Loader2, Send, Trash2, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react'
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
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      return
    }

    setDeletingId(student.id)
    try {
      const res = await deleteStudent(student.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Student ${student.name} deleted successfully`)
        setStudents(prev => prev.filter(s => s.id !== student.id))
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete student')
    } finally {
      setDeletingId(null)
    }
  }

  const [isDuplicatesModalOpen, setIsDuplicatesModalOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const handleDeleteMultiple = async (studentIds: string[]) => {
    if (!confirm(`Are you sure you want to delete all ${studentIds.length} duplicate students? This action cannot be undone.`)) {
      return
    }

    setIsBulkDeleting(true)
    try {
      const res = await deleteMultipleStudents(studentIds)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Deleted ${studentIds.length} duplicate students successfully`)
        setStudents(prev => prev.filter(s => !studentIds.includes(s.id)))
        setIsDuplicatesModalOpen(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete duplicates')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleDeleteDuplicatesKeepingOne = async () => {
    // 1. Group duplicate students by normalized roll_no
    const groups: { [key: string]: Student[] } = {}
    duplicateStudentsList.forEach(s => {
      if (s.roll_no) {
        const roll = s.roll_no.trim().toLowerCase()
        if (!groups[roll]) {
          groups[roll] = []
        }
        groups[roll].push(s)
      }
    })

    // 2. Identify which ones to delete (keep only one per group)
    const toDeleteIds: string[] = []
    Object.keys(groups).forEach(roll => {
      const group = groups[roll]
      // Sort by created_at ascending (oldest first) so we keep the first one
      const sortedGroup = [...group].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateA - dateB
      })
      // Keep the first one, and mark all others for deletion
      const duplicatesToDelete = sortedGroup.slice(1).map(s => s.id)
      toDeleteIds.push(...duplicatesToDelete)
    })

    if (toDeleteIds.length === 0) {
      toast.error("No duplicates to resolve.")
      return
    }

    if (!confirm(`Are you sure you want to resolve duplicates? This will delete ${toDeleteIds.length} redundant duplicate records and keep exactly 1 student record per roll number.`)) {
      return
    }

    setIsBulkDeleting(true)
    try {
      const res = await deleteMultipleStudents(toDeleteIds)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Resolved duplicates: deleted ${toDeleteIds.length} redundant records.`)
        setStudents(prev => prev.filter(s => !toDeleteIds.includes(s.id)))
        setIsDuplicatesModalOpen(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve duplicates')
    } finally {
      setIsBulkDeleting(false)
    }
  }

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
      whatsapp_number: !student.whatsapp_number || student.whatsapp_number.startsWith('no-phone-') ? '' : student.whatsapp_number,
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
        
        // Update local state using returned student
        if (res.student) {
          setStudents(prev => prev.map(s => 
            s.id === editModalStudent.id ? res.student : s
          ))
        }
        
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

  const duplicateRollNos = useMemo(() => {
    const counts: { [key: string]: number } = {}
    students.forEach(s => {
      if (s.roll_no) {
        const normalized = s.roll_no.trim().toLowerCase()
        counts[normalized] = (counts[normalized] || 0) + 1
      }
    })
    return new Set(
      Object.keys(counts).filter(roll => counts[roll] > 1)
    )
  }, [students])

  const duplicateStudentsList = useMemo(() => {
    return students.filter(s => s.roll_no && duplicateRollNos.has(s.roll_no.trim().toLowerCase()))
  }, [students, duplicateRollNos])

  const filteredStudents = useMemo(() => {
    const filtered = students.filter((s) => {
      const searchLower = search.toLowerCase()
      const phoneString = s.whatsapp_number || ''
      const matchesSearch = 
        s.name.toLowerCase().includes(searchLower) || 
        (!phoneString.startsWith('no-phone-') && phoneString.includes(searchLower)) ||
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

    const headers = ['Name', 'Phone Number', 'Roll No', 'QR Status', 'Scanned At']
    const rows = filteredStudents.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${!s.whatsapp_number || s.whatsapp_number.startsWith('no-phone-') ? '' : s.whatsapp_number}"`,
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <h3 className="text-lg font-bold text-[var(--color-text)] uppercase tracking-widest">Student Roster</h3>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
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
          
          <div className="relative">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-3 pr-8 py-2 border border-[var(--color-border)] rounded-xl bg-[#0A0F0D] text-sm focus:outline-none focus:border-[var(--color-marketnera)] text-[var(--color-text)] transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="entered">Entered</option>
              <option value="pending">Pending</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-3 pr-8 py-2 border border-[var(--color-border)] rounded-xl bg-[#0A0F0D] text-sm focus:outline-none focus:border-[var(--color-marketnera)] text-[var(--color-text)] transition-colors appearance-none cursor-pointer"
            >
              <option value="name">Sort by Name</option>
              <option value="uploaded">Sort by Upload Order</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] pointer-events-none" />
          </div>

          {duplicateStudentsList.length > 0 && (
            <>
              <button 
                onClick={handleDeleteDuplicatesKeepingOne}
                disabled={isBulkDeleting}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-black" /> Resolving...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 text-black" /> Resolve Duplicates (Keep 1)</>
                )}
              </button>

              <button 
                onClick={() => setIsDuplicatesModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-all active:scale-[0.98]"
              >
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Review ({duplicateStudentsList.length})</span>
              </button>
            </>
          )}

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
              filteredStudents.map((s) => {
                const isDuplicateRoll = s.roll_no && duplicateRollNos.has(s.roll_no.trim().toLowerCase())
                return (
                  <tr key={s.id} className="hover:bg-[var(--color-surface-2)] transition-colors group">
                    <td className="px-6 py-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{s.name}</span>
                        {isDuplicateRoll && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold uppercase tracking-wider">
                            Duplicate Roll
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[var(--color-muted)]">
                      {!s.whatsapp_number || s.whatsapp_number.startsWith('no-phone-') ? '-' : s.whatsapp_number}
                    </td>
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
                      <button 
                        onClick={() => handleDelete(s)}
                        disabled={deletingId !== null}
                        className={`p-2 rounded-lg bg-[var(--color-surface)] border transition-all ${
                          isDuplicateRoll 
                            ? 'border-red-500/30 text-red-500 hover:text-red-400 hover:border-red-500/50 opacity-100' 
                            : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-red-400 hover:border-red-500/30 opacity-50 group-hover:opacity-100'
                        }`}
                        title={isDuplicateRoll ? "Delete Duplicate Student" : "Delete Student"}
                      >
                        {deletingId === s.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })
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
            <p className="text-sm font-mono text-center text-[var(--color-muted)] mb-6">
              {!qrModalStudent.whatsapp_number || qrModalStudent.whatsapp_number.startsWith('no-phone-') ? 'No Phone Registered' : qrModalStudent.whatsapp_number}
            </p>
            
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
                <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">WhatsApp Number (Optional)</label>
                <input 
                  type="text" 
                  value={editForm.whatsapp_number}
                  onChange={(e) => setEditForm(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  className="w-full bg-[#0A0F0D] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-marketnera)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Roll Number</label>
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

      {/* Review Duplicates Modal */}
      {isDuplicatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 w-full max-w-2xl shadow-[0_0_50px_rgba(239,68,68,0.1)] relative flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setIsDuplicatesModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[var(--color-surface-2)] hover:text-white transition-colors text-[var(--color-muted)]"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-widest text-[var(--color-text)]">Review Duplicate Records</h3>
                <p className="text-xs text-[var(--color-muted)] mt-1">The following students share a duplicate Roll Number in this event.</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar border border-[var(--color-border)] rounded-2xl mb-6 bg-[#0A0F0D]">
              <table className="w-full text-left text-[11px] whitespace-nowrap">
                <thead className="bg-[#0A0F0D] text-[var(--color-muted)] uppercase tracking-widest text-[9px] border-b border-[var(--color-border)] sticky top-0">
                  <tr>
                    <th className="px-3 py-1.5 font-bold">Roll No</th>
                    <th className="px-3 py-1.5 font-bold">Name</th>
                    <th className="px-3 py-1.5 font-bold">Phone</th>
                    <th className="px-3 py-1.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {duplicateStudentsList.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--color-surface-2)] text-[var(--color-text)]">
                      <td className="px-3 py-1 font-mono text-red-400 font-bold">{s.roll_no}</td>
                      <td className="px-3 py-1 font-semibold">{s.name}</td>
                      <td className="px-3 py-1 font-mono text-[var(--color-muted)]">
                        {!s.whatsapp_number || s.whatsapp_number.startsWith('no-phone-') ? '-' : s.whatsapp_number}
                      </td>
                      <td className="px-3 py-1 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${s.name}?`)) {
                              deleteStudent(s.id).then((res) => {
                                if (res.error) {
                                  toast.error(res.error)
                                } else {
                                  toast.success(`Deleted ${s.name}`)
                                  setStudents(prev => prev.filter(p => p.id !== s.id))
                                }
                              })
                            }
                          }}
                          className="text-red-500 hover:text-red-400 font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-[var(--color-border)] w-full">
              <button
                onClick={() => setIsDuplicatesModalOpen(false)}
                className="w-full sm:w-auto px-5 py-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white font-bold rounded-xl hover:bg-[var(--color-border)] transition-colors text-sm"
              >
                Close
              </button>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={handleDeleteDuplicatesKeepingOne}
                  disabled={isBulkDeleting || duplicateStudentsList.length === 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 text-sm shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                >
                  {isBulkDeleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Resolving...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Keep Only 1 Per Roll No</>
                  )}
                </button>

                <button
                  onClick={() => handleDeleteMultiple(duplicateStudentsList.map(s => s.id))}
                  disabled={isBulkDeleting || duplicateStudentsList.length === 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                >
                  {isBulkDeleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Delete All Records</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
