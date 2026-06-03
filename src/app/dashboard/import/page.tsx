'use client'

import { useState, useCallback, useEffect } from 'react'
import * as xlsx from 'xlsx'
import toast from 'react-hot-toast'
import { UploadCloud, CheckCircle, ArrowRight, Loader2, FileSpreadsheet } from 'lucide-react'
import { getActiveEvents, submitMappedRoster } from './actions'

type Step = 'upload' | 'mapping' | 'preview' | 'success'

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  
  const [fileData, setFileData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  
  const [mapping, setMapping] = useState({
    name: '',
    whatsapp_number: '',
    student_id: '',
    roll_no: '',
    email: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

  useEffect(() => {
    getActiveEvents().then(data => {
      setEvents(data)
      if (data.length > 0) setSelectedEventId(data[0].id)
    })
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result
        const wb = xlsx.read(buffer, { type: 'array' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][]
        
        if (data.length < 2) {
          toast.error('File appears to be empty or missing data rows')
          return
        }

        const fileHeaders = data[0].map(h => String(h || '').trim())
        const rows = data.slice(1).filter(r => r.length > 0 && r.some(c => c)) // filter empty rows

        setHeaders(fileHeaders)
        setFileData(rows)

        // Smart detect
        const hLower = fileHeaders.map(h => (h || '').toLowerCase())
        const find = (test: (h: string) => boolean) => {
          const idx = hLower.findIndex(h => h && test(h))
          return idx >= 0 ? fileHeaders[idx] : ''
        }
        setMapping({
          name: find(h => h.includes('name')),
          whatsapp_number: find(h => h.includes('phone') || h.includes('whatsapp') || h.includes('mobile')),
          student_id: find(h => h.includes('student') && h.includes('id')),
          roll_no: find(h => h.includes('enroll')),
          email: find(h => h.includes('email')),
        })

        setStep('mapping')
      } catch (err) {
        console.error(err)
        toast.error('Failed to parse Excel file')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleMappingNext = () => {
    if (!mapping.name || !mapping.whatsapp_number) {
      toast.error('Name and Phone Number mappings are required')
      return
    }
    setStep('preview')
  }

  const handleSubmit = async () => {
    if (!selectedEventId) {
      toast.error('Please select an event')
      return
    }

    setIsSubmitting(true)
    
    const nameIdx = headers.indexOf(mapping.name)
    const phoneIdx = headers.indexOf(mapping.whatsapp_number)
    const sidIdx = headers.indexOf(mapping.student_id)
    const enrollIdx = headers.indexOf(mapping.roll_no)
    const emailIdx = headers.indexOf(mapping.email)

    const mappedStudents = fileData.map(row => ({
      name: row[nameIdx],
      whatsapp_number: row[phoneIdx],
      student_id: sidIdx >= 0 ? row[sidIdx] : null,
      roll_no: enrollIdx >= 0 ? row[enrollIdx] : null,
      email: emailIdx >= 0 ? row[emailIdx] : null,
    })).filter(s => s.name && s.whatsapp_number)

    const res = await submitMappedRoster(selectedEventId, mappedStudents)
    
    setIsSubmitting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      setResult({ imported: res.imported!, skipped: res.skipped! })
      setStep('success')
    }
  }

  const reset = () => {
    setStep('upload')
    setFileData([])
    setHeaders([])
    setResult(null)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-widest">Import Roster</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">Upload and map student data from Excel or CSV.</p>
      </div>

      <div className="flex items-center gap-4 mb-8">
        {['upload', 'mapping', 'preview', 'success'].map((s, i) => (
          <div key={s} className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${
              step === s ? 'bg-[var(--color-marketnera)] text-black' : 
              ['upload', 'mapping', 'preview', 'success'].indexOf(step) > i ? 'bg-[var(--color-marketnera)]/20 text-[var(--color-marketnera)] border border-[var(--color-marketnera)]/30' : 
              'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
            }`}>
              {['upload', 'mapping', 'preview', 'success'].indexOf(step) > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            {i < 3 && <div className={`h-px w-12 ${['upload', 'mapping', 'preview', 'success'].indexOf(step) > i ? 'bg-[var(--color-marketnera)]/30' : 'bg-[var(--color-border)]'}`}></div>}
          </div>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-marketnera)]/5 blur-[100px] rounded-full pointer-events-none"></div>

        {step === 'upload' && (
          <div className="space-y-8 relative z-10">
            <div>
              <label className="block text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3">Target Event</label>
              <select 
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full bg-[#0A0F0D] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-marketnera)] transition-colors appearance-none"
              >
                {events.length === 0 ? <option value="">No active events found</option> : null}
                {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            <div className="border-2 border-dashed border-[var(--color-border)] rounded-3xl p-12 flex flex-col items-center justify-center text-center hover:border-[var(--color-marketnera)]/50 hover:bg-[var(--color-marketnera)]/5 transition-all group relative">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="w-8 h-8 text-[var(--color-muted)] group-hover:text-[var(--color-marketnera)] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">Drag & Drop your Excel file</h3>
              <p className="text-sm text-[var(--color-muted)]">or click to browse (.xlsx, .csv)</p>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'name', label: 'Student Name *' },
                { key: 'whatsapp_number', label: 'WhatsApp Number *' },
                { key: 'student_id', label: 'Student ID' },
                { key: 'roll_no', label: 'Enrollment Number' },
                { key: 'email', label: 'Email Address' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">{field.label}</label>
                  <select 
                    value={(mapping as any)[field.key]}
                    onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                    className="w-full bg-[#0A0F0D] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-marketnera)] transition-colors appearance-none"
                  >
                    <option value="">-- Ignore --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-[var(--color-border)]">
              <button 
                onClick={reset}
                className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] font-bold hover:bg-[var(--color-surface-2)] transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleMappingNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-marketnera)] text-black font-bold hover:bg-[var(--color-marketnera-dark)] transition-colors"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-8 relative z-10">
            <h3 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider">Preview (First 5 Rows)</h3>
            
            <div className="overflow-x-auto border border-[var(--color-border)] rounded-2xl custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#0A0F0D] text-[var(--color-muted)] uppercase tracking-widest text-[10px] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-6 py-4 font-bold">Name</th>
                    <th className="px-6 py-4 font-bold">Phone</th>
                    <th className="px-6 py-4 font-bold">Student ID</th>
                    <th className="px-6 py-4 font-bold">Enrollment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {fileData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-[var(--color-surface-2)] text-[var(--color-text)]">
                      <td className="px-6 py-4 font-bold">{row[headers.indexOf(mapping.name)] || '-'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{row[headers.indexOf(mapping.whatsapp_number)] || '-'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{mapping.student_id ? row[headers.indexOf(mapping.student_id)] || '-' : '-'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{mapping.roll_no ? row[headers.indexOf(mapping.roll_no)] || '-' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p className="text-sm text-[var(--color-muted)] font-medium">
              Total rows detected: <span className="text-[var(--color-text)] font-bold">{fileData.length}</span>
            </p>

            <div className="flex justify-between pt-4 border-t border-[var(--color-border)]">
              <button 
                onClick={() => setStep('mapping')}
                className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] font-bold hover:bg-[var(--color-surface-2)] transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-marketnera)] text-black font-bold hover:bg-[var(--color-marketnera-dark)] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(19,236,91,0.2)]"
              >
                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Importing...</> : 'Confirm & Import'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && result && (
          <div className="flex flex-col items-center justify-center text-center py-12 relative z-10 animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-[var(--color-marketnera)]/10 text-[var(--color-marketnera)] rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-widest text-[var(--color-text)] mb-2">Import Complete</h2>
            <p className="text-lg text-[var(--color-muted)] mb-8 max-w-md">
              Successfully imported <span className="font-bold text-[var(--color-marketnera)]">{result.imported}</span> students.
              {result.skipped > 0 && ` Skipped ${result.skipped} duplicate phone numbers.`}
            </p>
            
            <button 
              onClick={reset}
              className="px-8 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-bold hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Import Another File
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
