'use client'

import { useEffect, useState, useMemo } from 'react'
import { getStudents } from './actions'
import { Tables } from '@/types/database.types'

type Student = Tables<'students'>

export default function StudentTable({ eventId }: { eventId: string }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'entered' | 'pending'>('all')

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
      // Text search
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                            s.phone_number.includes(search)
      
      // Status filter
      let matchesStatus = true
      if (statusFilter === 'entered') matchesStatus = s.scanned_at !== null
      if (statusFilter === 'pending') matchesStatus = s.scanned_at === null

      return matchesSearch && matchesStatus
    })
  }, [students, search, statusFilter])

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return

    const headers = ['Name', 'Phone Number', 'QR Status', 'Scanned At']
    const rows = filteredStudents.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.phone_number}"`,
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
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 h-[600px] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Student Roster</h3>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Search name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-48 text-zinc-900 dark:text-white"
          />
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-white"
          >
            <option value="all" className="dark:bg-zinc-800">All</option>
            <option value="entered" className="dark:bg-zinc-800">Entered</option>
            <option value="pending" className="dark:bg-zinc-800">Pending</option>
          </select>

          <button 
            onClick={handleExportCSV}
            disabled={filteredStudents.length === 0}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 uppercase tracking-wider text-xs">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-300">Name</th>
              <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-300">Phone</th>
              <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-300">QR Status</th>
              <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-300">Entry Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">Loading...</td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">No students found.</td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{s.name}</td>
                  <td className="px-4 py-3">{s.phone_number}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${s.qr_status === 'sent' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {s.qr_status || 'generated'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.scanned_at ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Entered</span>
                    ) : (
                      <span className="text-zinc-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
