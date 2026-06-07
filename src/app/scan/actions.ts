'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * Fetches the total number of GRANTED + MASTER scans performed by the
 * currently authenticated guard. Uses the service-role client to bypass
 * RLS (guards don't have SELECT on scan_logs by default).
 */
export async function getGuardScanCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { count: 0 }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { count, error } = await adminClient
    .from('scan_logs')
    .select('*', { count: 'exact', head: true })
    .eq('scanned_by', user.id)
    .in('scan_result', ['GRANTED', 'MASTER'])

  if (error) {
    console.error('Error fetching guard scan count:', error)
    return { count: 0 }
  }

  return { count: count || 0 }
}
