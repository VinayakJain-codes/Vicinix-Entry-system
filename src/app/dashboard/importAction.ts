'use server'

import * as xlsx from 'xlsx'
import { createClient } from '@/utils/supabase/server'

export async function importRoster(formData: FormData) {
  const file = formData.get('roster') as File
  const eventName = formData.get('eventName') as string

  if (!file || !eventName) {
    return { imported: 0, skipped: 0, error: 'Missing file or event name.' }
  }

  const supabase = await createClient()

  // 1. Create Event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert([{ name: eventName }])
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

  // 3. Process & Deduplicate
  const studentsToInsert = []
  const seenPhones = new Set()

  let imported = 0
  let skipped = 0

  for (let i = 1; i < json.length; i++) {
    const row = json[i]
    const name = row[0]
    let rawPhone = row[1]

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

    studentsToInsert.push({
      event_id: event.id,
      name: String(name),
      phone_number: phone,
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
