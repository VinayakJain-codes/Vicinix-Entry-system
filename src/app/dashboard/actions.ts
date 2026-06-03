'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Tables } from '@/types/database.types'

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
