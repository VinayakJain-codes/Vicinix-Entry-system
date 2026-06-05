'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import qrcode from 'qrcode'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

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

  try {
    let processed = 0
    const eventName = event.name || 'Special Event'
    const eventDate = event.date ? new Date(event.date).toLocaleDateString() : 'TBA'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://entrysystem.vicinix.co.in'

    // Load template image - try filesystem first, fall back to HTTP fetch
    let templateBuffer: Buffer
    const templatePath = path.join(process.cwd(), 'public', 'template.png')
    
    if (fs.existsSync(templatePath)) {
      templateBuffer = fs.readFileSync(templatePath)
    } else {
      // Fallback for Vercel: fetch via HTTP using VERCEL_URL (auto-set by Vercel)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://entrysystem.vicinix.co.in'
      console.log('[QR] Template not on filesystem, fetching from:', `${baseUrl}/template.png`)
      const templateRes = await fetch(`${baseUrl}/template.png`)
      if (!templateRes.ok) {
        return { error: `Failed to fetch template image (${templateRes.status}) from ${baseUrl}/template.png` }
      }
      templateBuffer = Buffer.from(await templateRes.arrayBuffer())
    }

    for (const student of students) {
      const token = crypto.randomBytes(32).toString('hex')
      const fullUrl = `${appUrl}/scan?token=${token}`
      
      // Generate QR matrix
      const qrBuffer = await qrcode.toBuffer(fullUrl, { type: 'png', width: 540, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      
      const svgOverlay = Buffer.from(`
<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <text x="50" y="90" font-family="sans-serif" font-size="52" font-weight="bold" fill="#000000" text-anchor="start">${eventName}</text>
  <text x="1030" y="65" font-family="sans-serif" font-size="52" font-weight="bold" fill="#000000" text-anchor="end">${student.name}</text>
  <text x="1030" y="125" font-family="sans-serif" font-size="40" font-weight="bold" fill="#000000" text-anchor="end">ENR: ${student.roll_no || 'N/A'}</text>
</svg>
      `)

      // Composite using sharp
      const finalBuffer = await sharp(templateBuffer)
      .composite([
        { input: svgOverlay, top: 0, left: 0 },
        { input: qrBuffer, top: 310, left: 270 } 
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
  } catch (err: any) {
    console.error('[QR] Generation error:', err)
    return { error: err.message || 'Unknown error during QR generation' }
  }
}
