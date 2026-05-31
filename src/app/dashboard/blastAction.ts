'use server'

import { createClient } from '@/utils/supabase/server'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function blastWhatsAppForEvent(eventId: string, batchSize: number = 50) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('id', user.id).single()
  if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
    return { error: 'Unauthorized role' }
  }

  // Fetch students with tokens but not sent yet
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('id, name, phone_number, qr_url')
    .eq('event_id', eventId)
    .neq('token', null)
    .eq('qr_status', 'pending')
    .limit(batchSize)

  if (fetchError) return { error: fetchError.message }
  if (!students || students.length === 0) return { processed: 0, remaining: 0, errors: 0 }

  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'qr_entry_ticket'

  if (!token || !phoneId) {
    return { error: 'WhatsApp API credentials are not configured.' }
  }

  let processed = 0
  let errors = 0

  for (const student of students) {
    if (!student.qr_url) {
      errors++
      continue
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: student.phone_number,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'image',
                  image: { link: student.qr_url }
                }
              ]
            },
            {
              type: 'body',
              parameters: [
                { type: 'text', text: student.name }
              ]
            }
          ]
        }
      }

      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        await supabase.from('students').update({ qr_status: 'sent' }).eq('id', student.id)
        processed++
      } else {
        console.error('WhatsApp API Error:', await res.text())
        await supabase.from('students').update({ qr_status: 'error' }).eq('id', student.id)
        errors++
      }
    } catch (e) {
      console.error('Fetch Error:', e)
      await supabase.from('students').update({ qr_status: 'error' }).eq('id', student.id)
      errors++
    }

    // Enforce 15ms delay for rate limit compliance (Meta max 80/sec)
    await delay(15)
  }

  // Check remaining
  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .neq('token', null)
    .eq('qr_status', 'pending')

  return { processed, remaining: count || 0, errors }
}
