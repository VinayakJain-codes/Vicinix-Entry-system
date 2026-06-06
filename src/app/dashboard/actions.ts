'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { Tables } from '@/types/database.types'
import crypto from 'crypto'
import qrcode from 'qrcode'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'


const getAdminClient = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getDashboardStats(eventId: string) {
  const supabase = getAdminClient()

  // Get headcount (students with scanned_at != null)
  const { count: headcount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .not('scanned_at', 'is', null)

  // Get total students
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  // Get master scans
  const { data: eventData } = await supabase
    .from('events')
    .select('master_scan_count')
    .eq('id', eventId)
    .single()

  // Get QR Delivered count
  const { count: qrDelivered } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('qr_status', 'sent')

  return {
    headcount: headcount || 0,
    totalStudents: totalStudents || 0,
    masterScans: eventData?.master_scan_count || 0,
    qrDelivered: qrDelivered || 0
  }
}

export async function getStudents(eventId: string) {
  const supabase = getAdminClient()
  
  const { data: students, error } = await supabase
    .from('students')
    .select('*')
    .eq('event_id', eventId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching students:', error)
    return []
  }

  return students as Tables<'students'>[]
}

export async function deleteEvent(eventId: string) {
  const supabase = getAdminClient()
  
  // Delete scan logs first
  await supabase.from('scan_logs').delete().eq('event_id', eventId)
  
  // Delete students
  await supabase.from('students').delete().eq('event_id', eventId)

  // Delete event
  const { error } = await supabase.from('events').delete().eq('id', eventId)

  if (error) {
    console.error('Error deleting event:', error)
    return { error: 'Failed to delete event' }
  }

  return { success: true }
}

export async function updateStudent(
  studentId: string,
  name: string,
  whatsappNumber: string,
  rollNo?: string | null
) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = getAdminClient()
  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
    return { error: 'Unauthorized role' }
  }

  let cleanedPhone = whatsappNumber.replace(/\D/g, '')
  if (!cleanedPhone) {
    return { error: 'Invalid WhatsApp number' }
  }

  // Automatically prepend '91' for standard 10-digit Indian numbers without country code
  if (cleanedPhone.length === 10) {
    cleanedPhone = '91' + cleanedPhone
  }

  const { error } = await adminClient
    .from('students')
    .update({
      name: name.trim(),
      whatsapp_number: cleanedPhone,
      roll_no: rollNo ? rollNo.trim() : null
    })
    .eq('id', studentId)

  if (error) {
    console.error('Error updating student:', error)
    return { error: error.message }
  }

  return { success: true }
}

export async function resendStudentQR(studentId: string) {
  const supabase = await createClient()

  // 1. Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = getAdminClient()
  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
    return { error: 'Unauthorized role' }
  }

  // 2. Fetch student details
  const { data: student, error: studentError } = await adminClient
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    return { error: 'Student not found' }
  }

  let qrUrl = student.qr_url
  let token = student.token

  // 3. Generate QR if it doesn't exist
  if (!token || !qrUrl) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://entrysystem.vicinix.co.in'
      const generatedToken = crypto.randomBytes(32).toString('hex')
      const fullUrl = `${appUrl}/scan?token=${generatedToken}`
      
      // Load template image
      let templateBuffer: Buffer
      const templatePath = path.join(process.cwd(), 'public', 'template.png')
      if (fs.existsSync(templatePath)) {
        templateBuffer = fs.readFileSync(templatePath)
      } else {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://entrysystem.vicinix.co.in'
        const templateRes = await fetch(`${baseUrl}/template.png`)
        if (!templateRes.ok) {
          return { error: 'Failed to fetch template image' }
        }
        templateBuffer = Buffer.from(await templateRes.arrayBuffer())
      }

      const qrBuffer = await qrcode.toBuffer(fullUrl, { 
        type: 'png', 
        width: 540, 
        margin: 1, 
        color: { dark: '#000000', light: '#ffffff' } 
      })

      const svgOverlay = Buffer.from(`
<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 52px Arial, sans-serif; fill: #000000; }
    .subtitle { font: bold 40px Arial, sans-serif; fill: #000000; }
  </style>
  <text x="1030" y="90" class="title" text-anchor="end">${student.name}</text>
  <text x="1030" y="150" class="subtitle" text-anchor="end">ENR: ${student.roll_no || 'N/A'}</text>
</svg>
      `)

      const finalBuffer = await sharp(templateBuffer)
        .composite([
          { input: svgOverlay, top: 0, left: 0 },
          { input: qrBuffer, top: 310, left: 270 }
        ])
        .png()
        .toBuffer()

      const fileName = `${student.event_id}/${student.id}.png`
      
      const { error: uploadError } = await adminClient.storage
        .from('qrs')
        .upload(fileName, finalBuffer, { contentType: 'image/png', upsert: true })

      if (uploadError) {
        return { error: 'Failed to upload QR code' }
      }

      const { data: publicUrlData } = adminClient.storage.from('qrs').getPublicUrl(fileName)
      qrUrl = publicUrlData.publicUrl
      token = generatedToken

      // Update student in DB
      await adminClient
        .from('students')
        .update({ token: token, qr_url: qrUrl, qr_status: 'generated' })
        .eq('id', student.id)
    } catch (e: any) {
      console.error('Error generating QR on the fly:', e)
      return { error: `Failed to generate QR code: ${e.message}` }
    }
  }

  // 4. Send WhatsApp message
  const waToken = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'qr_entry_ticket'

  if (!waToken || !phoneId) {
    return { error: 'WhatsApp API credentials are not configured.' }
  }

  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: student.whatsapp_number,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'header',
            parameters: [{ type: 'image', image: { link: qrUrl } }]
          },
          {
            type: 'body',
            parameters: [{ type: 'text', parameter_name: 'student_name', text: student.name }]
          }
        ]
      }
    }

    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      await adminClient.from('students').update({ qr_status: 'sent' }).eq('id', student.id)
      return { success: true, qr_status: 'sent', qr_url: qrUrl }
    } else {
      const errorText = await res.text()
      console.error('=== WhatsApp API Single Send Error ===', errorText)
      await adminClient.from('students').update({ qr_status: 'error' }).eq('id', student.id)
      return { error: 'Failed to send WhatsApp message (API Error)' }
    }
  } catch (e: any) {
    console.error('WhatsApp send error:', e)
    await adminClient.from('students').update({ qr_status: 'error' }).eq('id', student.id)
    return { error: `WhatsApp send error: ${e.message}` }
  }
}

