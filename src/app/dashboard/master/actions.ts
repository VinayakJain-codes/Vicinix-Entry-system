'use server'

import { createClient } from '@/utils/supabase/server'

export async function getMasterQRInfo(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('master_qr_token, master_scan_count')
    .eq('id', eventId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}
