'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
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

  const cleanedPhone = whatsappNumber.replace(/\D/g, '')
  if (!cleanedPhone) {
    return { error: 'Invalid WhatsApp number' }
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
