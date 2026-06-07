'use server'

import { cookies } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { signSession } from '@/utils/studentAuth'

const getAdminClient = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function studentLogin(rollNo: string) {
  if (!rollNo) {
    return { error: 'Please enter your roll number' }
  }

  const trimmedRollNo = rollNo.trim()

  try {
    const adminClient = getAdminClient()

    // Query students table for the roll number (case-insensitive query)
    const { data: students, error } = await adminClient
      .from('students')
      .select('name, roll_no')
      .ilike('roll_no', trimmedRollNo)

    if (error) {
      console.error('[Student Login] DB Query Error:', error)
      return { error: 'An error occurred during verification' }
    }

    if (!students || students.length === 0) {
      return { error: 'Invalid roll number' }
    }

    // Verify the first matching student record
    const student = students[0]
    if (!student.name || !student.roll_no) {
      return { error: 'Student record is incomplete' }
    }

    // 3. Set the signed session cookie
    const cookieStore = await cookies()
    const token = signSession(student.roll_no)

    cookieStore.set('student_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    })

    return { success: true }
  } catch (e: any) {
    console.error('[Student Login] Exception:', e)
    return { error: e.message || 'An unexpected error occurred' }
  }
}

export async function studentLogout() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('student_session')
    return { success: true }
  } catch (e) {
    console.error('[Student Logout] Error clearing cookie:', e)
    return { error: 'Failed to log out' }
  }
}
