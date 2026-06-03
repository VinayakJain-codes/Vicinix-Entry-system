'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import qrcode from 'qrcode'
import sharp from 'sharp'

export async function generateQRsForEvent(eventId: string, batchSize: number = 50) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const adminClient = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', user.id).single()
  if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
    return { error: 'Unauthorized role' }
  }

  // Fetch event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('name, date')
    .eq('id', eventId)
    .single()

  if (eventError || !event) return { error: 'Event not found' }

  // Fetch students without tokens
  const { data: students, error: studentError } = await adminClient
    .from('students')
    .select('id, whatsapp_number, name, student_id, roll_no')
    .eq('event_id', eventId)
    .is('token', null)
    .limit(batchSize)

  if (studentError) return { error: studentError.message }
  if (!students || students.length === 0) return { processed: 0, remaining: 0 }

  let processed = 0
  const eventName = event.name || 'Special Event'
  const eventDate = event.date ? new Date(event.date).toLocaleDateString() : 'TBA'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://marketnera.com'

  for (const student of students) {
    const token = crypto.randomBytes(32).toString('hex')
    const fullUrl = `${appUrl}/scan?token=${token}`
    
    // Generate QR matrix
    const qrBuffer = await qrcode.toBuffer(fullUrl, { type: 'png', width: 688, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
    
    // Composite using sharp over Template.png
    const finalBuffer = await sharp('public/Template.png')
    .composite([
      { input: qrBuffer, top: 108, left: 239 } 
    ])
    .png()
    .toBuffer()
    
    const fileName = `${eventId}/${student.id}.png`
    
    // Upload to storage
    const { error: uploadError } = await adminClient.storage
      .from('qrs')
      .upload(fileName, finalBuffer, { contentType: 'image/png', upsert: true })

    if (uploadError) {
      console.error('Failed to upload QR for', student.id, uploadError)
      continue
    }

    const { data: publicUrlData } = adminClient.storage.from('qrs').getPublicUrl(fileName)

    const { error: updateError } = await adminClient
      .from('students')
      .update({ token: token, qr_url: publicUrlData.publicUrl, qr_status: 'generated' })
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
