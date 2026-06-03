'use server'

import * as xlsx from 'xlsx'
import { createClient } from '@/utils/supabase/server'

export async function importRoster(formData: FormData) {
  const file = formData.get('roster') as File
  const eventName = formData.get('eventName') as string
  const eventDate = formData.get('eventDate') as string | null

  if (!file || !eventName) {
    return { imported: 0, skipped: 0, error: 'Missing file or event name.' }
  }

  const supabase = await createClient()

  // 1. Create Event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert([{ name: eventName, date: eventDate || null }])
    .select()
    .single()

  if (eventError || !event) {
    return { imported: 0, skipped: 0, error: `Failed to create event: ${eventError?.message}` }
  }

  // 2. Parse Excel
  const buffer = await file.arrayBuffer()
  const workbook = xlsx.read(buffer, { type: 'buffer' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const json: any[] = xlsx.utils.sheet_to_json(worksheet, { header: 1 })

  if (json.length === 0) {
    return { imported: 0, skipped: 0, error: 'The file is empty.' }
  }

  // Smart header detection
  const headers = (json[0] as any[]).map(h => String(h || '').toLowerCase().trim())
  const detectedNameIdx = headers.findIndex(h => h.includes('name'))
  const detectedPhoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('whatsapp') || h.includes('mobile'))
  const sidIdx = headers.findIndex(h => h.includes('student') && h.includes('id'))
  const enrollIdx = headers.findIndex(h => h.includes('enroll'))
  const emailIdx = headers.findIndex(h => h.includes('email'))

  const nameIdx = detectedNameIdx >= 0 ? detectedNameIdx : 0
  const phoneIdx = detectedPhoneIdx >= 0 ? detectedPhoneIdx : 1

  // 3. Process & Deduplicate
  const studentsToInsert = []
  const seenPhones = new Set()

  let imported = 0
  let skipped = 0

  for (let i = 1; i < json.length; i++) {
    const row = json[i]
    if (!row) continue

    const name = row[nameIdx]
    let rawPhone = row[phoneIdx]

    if (!name || !rawPhone) {
      continue
    }

    // Clean phone number (remove non-digits)
    const phone = String(rawPhone).replace(/\D/g, '')

    if (seenPhones.has(phone)) {
      skipped++
      continue
    }
    seenPhones.add(phone)

    const studentId = sidIdx >= 0 && row[sidIdx] ? String(row[sidIdx]).trim() : null
    const enrollmentNo = enrollIdx >= 0 && row[enrollIdx] ? String(row[enrollIdx]).trim() : null
    const email = emailIdx >= 0 && row[emailIdx] ? String(row[emailIdx]).trim() : null

    studentsToInsert.push({
      event_id: event.id,
      name: String(name).trim(),
      whatsapp_number: phone,
      student_id: studentId,
      roll_no: enrollmentNo,
      email: email,
    })
  }

  if (studentsToInsert.length === 0) {
    return { imported: 0, skipped: 0, error: 'No valid rows found in the file.' }
  }

  // 4. Bulk Insert
  const { error: insertError } = await supabase
    .from('students')
    .insert(studentsToInsert)

  if (insertError) {
    return { imported: 0, skipped: 0, error: `Failed to insert students: ${insertError.message}` }
  }

  imported = studentsToInsert.length

  return { imported, skipped, error: null }
}
