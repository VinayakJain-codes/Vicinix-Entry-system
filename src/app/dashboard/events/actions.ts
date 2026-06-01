'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEvent(name: string, date: string | null) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .insert([{ name, date }])
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/events')
  revalidatePath('/dashboard')
  return { success: true, event: data }
}

export async function toggleEventActive(id: string, is_active: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('events')
    .update({ is_active })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/events')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getEventsWithCounts() {
  const supabase = await createClient()

  const { data: events, error } = await supabase
    .from('events')
    .select('*, students(count)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return events.map((e: any) => ({
    ...e,
    student_count: e.students[0]?.count || 0
  }))
}
