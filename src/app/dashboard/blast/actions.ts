'use server'

import { createClient } from '@/utils/supabase/server'

export async function getDeliveryStats(eventId: string) {
  const supabase = await createClient()

  // Get total students for event
  const { count: total } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  const { count: sent } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('qr_status', 'sent')

  const { count: error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('qr_status', 'error')

  const { count: generated } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('qr_status', 'generated')

  return {
    total: total || 0,
    sent: sent || 0,
    error: error || 0,
    generated: generated || 0,
    pending: (total || 0) - (sent || 0) - (error || 0)
  }
}
