'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function blastWhatsAppForEvent(eventId: string, batchSize: number = 50, retryFailedOnly: boolean = false) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const adminClient = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', user.id).single()
  if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
    return { error: 'Unauthorized role' }
  }

  // Fetch students with tokens but not sent yet
  let query = adminClient
    .from('students')
    .select('id, whatsapp_number, token, qr_status, name, qr_url')
    .eq('event_id', eventId)
    .not('token', 'is', null)
    .limit(batchSize)

  if (retryFailedOnly) {
    query = query.eq('qr_status', 'error')
  } else {
    // If we're not retrying, we send to 'generated' ones (meaning they have token & url but not sent).
    // The previous code checked for 'pending' but the DB status is usually 'generated' or 'sent'. Wait, let's use 'generated'.
    // If the schema uses 'pending', let's stick to what was there or check both.
    query = query.in('qr_status', ['generated', 'pending'])
  }

  const { data: students, error: fetchError } = await query

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
        to: student.whatsapp_number,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
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
                { type: 'text', parameter_name: 'student_name', text: student.name }
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
        await adminClient
        .from('students')
        .update({ qr_status: 'sent' })
        .eq('id', student.id)
        processed++
      } else {
        console.error('WhatsApp API Error:', await res.text())
        await adminClient.from('students').update({ qr_status: 'error' }).eq('id', student.id)
        errors++
      }
    } catch (e) {
      const { error: studentError } = await adminClient
      .from('students')
      .update({ qr_status: 'error' })
      .eq('id', student.id)
      errors++
    }

    // Enforce 15ms delay for rate limit compliance (Meta max 80/sec)
    await delay(15)
  }

  // Check remaining
  let remainingQuery = supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .neq('token', null)
  
  if (retryFailedOnly) {
    remainingQuery = remainingQuery.eq('qr_status', 'error')
  } else {
    remainingQuery = remainingQuery.in('qr_status', ['generated', 'pending'])
  }

  const { count } = await remainingQuery

  return { processed, remaining: count || 0, errors }
}
