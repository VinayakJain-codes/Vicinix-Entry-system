'use server'

import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'
import qrcode from 'qrcode'

export async function generateQRsForEvent(eventId: string, batchSize: number = 50) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('id', user.id).single()
  if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
    return { error: 'Unauthorized role' }
  }

  // Fetch students without token
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('id, phone_number')
    .eq('event_id', eventId)
    .is('token', null)
    .limit(batchSize)

  if (fetchError) return { error: fetchError.message }
  if (!students || students.length === 0) return { processed: 0, remaining: 0 }

  let processed = 0

  for (const student of students) {
    const token = crypto.randomBytes(32).toString('hex')
    const qrBuffer = await qrcode.toBuffer(token, { type: 'png', width: 300 })
    
    const fileName = `${eventId}/${student.id}.png`
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('qrs')
      .upload(fileName, qrBuffer, { contentType: 'image/png', upsert: true })

    if (uploadError) {
      console.error('Failed to upload QR for', student.id, uploadError)
      continue
    }

    const { data: publicUrlData } = supabase.storage.from('qrs').getPublicUrl(fileName)

    // Update student record
    const { error: updateError } = await supabase
      .from('students')
      .update({ token, qr_url: publicUrlData.publicUrl })
      .eq('id', student.id)

    if (!updateError) {
      processed++
    }
  }

  // Check remaining
  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .is('token', null)

  return { processed, remaining: count || 0 }
}
