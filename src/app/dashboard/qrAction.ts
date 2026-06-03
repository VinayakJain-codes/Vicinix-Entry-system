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
    
    // Generate QR matrix without margin so it's fully maximized in its box
    const qrBuffer = await qrcode.toBuffer(fullUrl, { type: 'png', width: 360, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
    
    const svgOverlay = Buffer.from(`
<svg width="512" height="620" xmlns="http://www.w3.org/2000/svg">
  <!-- Zone 1: Green top strip -->
  <rect x="0" y="0" width="512" height="8" fill="#13EC5B" />
  
  <!-- Zone 2: Dark header -->
  <rect x="0" y="8" width="512" height="80" fill="#0A0F0D" />
  <text x="24" y="52" font-family="Arial" font-size="28" font-weight="900" fill="#13EC5B" letter-spacing="4">MARKETNERA</text>
  <text x="24" y="74" font-family="Arial" font-size="13" font-weight="600" fill="#4B6358">${eventName.toUpperCase()}  ·  ${eventDate}</text>
  
  <!-- Zone 3: White QR zone (background is already white, just placeholders if needed) -->
  <rect x="0" y="88" width="512" height="380" fill="#FFFFFF" />
  
  <!-- Zone 4: White info zone -->
  <rect x="0" y="468" width="512" height="92" fill="#FFFFFF" />
  <text x="256" y="508" font-family="Arial" font-size="20" font-weight="800" fill="#111827" text-anchor="middle">${student.name}</text>
  <text x="256" y="534" font-family="Arial" font-size="13" font-weight="600" fill="#6B7280" text-anchor="middle">ID: ${student.student_id || 'N/A'}  ·  Enrollment: ${student.roll_no || 'N/A'}</text>
  
  <!-- Zone 5: Dark footer -->
  <rect x="0" y="560" width="512" height="60" fill="#0A0F0D" />
  <text x="24" y="595" font-family="Arial" font-size="12" font-weight="700" fill="#13EC5B">marketnera.in</text>
  <text x="488" y="595" font-family="Arial" font-size="11" font-weight="600" fill="#F97316" text-anchor="end" opacity="0.8">Tech: Vicinix</text>
</svg>
    `)

    // Composite using sharp
    const finalBuffer = await sharp({
      create: {
        width: 512,
        height: 620,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      { input: svgOverlay, top: 0, left: 0 },
      { input: qrBuffer, top: 98, left: 76 } // Center 360px QR in 512px width -> (512-360)/2 = 76. Top 98 is in the 88-468 zone
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
