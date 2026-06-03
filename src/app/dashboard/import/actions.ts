'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const getAdminClient = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function submitMappedRoster(eventId: string, students: any[]) {
  if (!eventId) {
    return { success: false, error: 'No event selected.' }
  }
  
  if (!students || students.length === 0) {
    return { success: false, error: 'No students to import.' }
  }

  const supabase = getAdminClient()

  // Verify event exists
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return { success: false, error: `Invalid event selected.` }
  }

  // Fetch existing phones for this event to deduplicate on the server side just in case
  const { data: existingStudents } = await supabase
    .from('students')
    .select('whatsapp_number')
    .eq('event_id', eventId)

  const existingPhones = new Set((existingStudents || []).map(s => s.whatsapp_number))

  const studentsToInsert = []
  let skipped = 0

  for (const row of students) {
    const rawPhone = row.whatsapp_number
    if (!rawPhone) continue

    const phone = String(rawPhone).replace(/\D/g, '')

    if (existingPhones.has(phone)) {
      skipped++
      continue
    }
    existingPhones.add(phone)

    studentsToInsert.push({
      event_id: eventId,
      name: String(row.name).trim(),
      whatsapp_number: phone,
      student_id: row.student_id ? String(row.student_id).trim() : null,
      roll_no: row.roll_no ? String(row.roll_no).trim() : null,
      email: row.email ? String(row.email).trim() : null,
    })
  }

  if (studentsToInsert.length === 0) {
    return { success: false, imported: 0, skipped, error: 'All students in the file were skipped (duplicates or missing data).' }
  }

  // Bulk Insert
  const { error: insertError } = await supabase
    .from('students')
    .insert(studentsToInsert)

  if (insertError) {
    return { success: false, imported: 0, skipped, error: `Failed to insert students: ${insertError.message}` }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/students')

  return { success: true, imported: studentsToInsert.length, skipped, error: null }
}

export async function getActiveEvents() {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('events')
    .select('id, name')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}
