'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import qrcode from 'qrcode'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

export async function generateQRsForEvent(eventId: string, batchSize: number = 50) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const adminClient = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: roleData } = await adminClient.from('user_roles').select('role').eq('id', user.id).single()
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
  
  // Pre-load logo to compose with QR codes
  let logoBuffer: Buffer | null = null;
  let logoHeight = 0;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'Marketneraxvicinix.png');
    const rawLogo = await fs.promises.readFile(logoPath);
    logoBuffer = await sharp(rawLogo).resize({ width: 300, fit: 'inside' }).toBuffer();
    const meta = await sharp(logoBuffer).metadata();
    logoHeight = meta.height || 100;
  } catch (e) {
    console.warn('Could not load logo for QR generation:', e);
  }

  for (const student of students) {
    const token = crypto.randomBytes(32).toString('hex')
    const qrBuffer = await qrcode.toBuffer(token, { type: 'png', width: 300 })
    
    let finalBuffer = qrBuffer;
    
    // Compose if logo is available
    if (logoBuffer && logoHeight > 0) {
      finalBuffer = await sharp({
        create: {
          width: 300,
          height: 300 + logoHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .composite([
        { input: qrBuffer, top: 0, left: 0 },
        { input: logoBuffer, top: 300, left: 0 }
      ])
      .png()
      .toBuffer()
    }
    
    const fileName = `${eventId}/${student.id}.png`
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('qrs')
      .upload(fileName, finalBuffer, { contentType: 'image/png', upsert: true })

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
