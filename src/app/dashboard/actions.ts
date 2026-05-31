'use server'

import { createClient } from '@/utils/supabase/server'
import { Tables } from '@/types/database.types'

export async function getDashboardStats(eventId: string) {
  const supabase = await createClient()

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

  return {
    headcount: headcount || 0,
    totalStudents: totalStudents || 0,
    masterScans: eventData?.master_scan_count || 0
  }
}

export async function getStudents(eventId: string) {
  const supabase = await createClient()
  
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
