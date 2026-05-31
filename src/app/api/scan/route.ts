import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  const supabaseServer = await createClient()

  // 1. Authenticate Guard/Admin
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await request.json()
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  // 2. Bypass RLS for atomic update
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Server misconfiguration: missing service role key' }, { status: 500 })
  }

  const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey)

  // 3. Look up student
  const { data: student, error: findError } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('token', token)
    .single()

  if (findError || !student) {
    return NextResponse.json({ error: 'Invalid Token' }, { status: 404 })
  }

  if (student.qr_status === 'scanned') {
    return NextResponse.json({ error: 'Already Scanned', student }, { status: 400 })
  }

  // 4. Atomic update
  const { data: updatedStudent, error: updateError } = await supabaseAdmin
    .from('students')
    .update({ qr_status: 'scanned', scanned_at: new Date().toISOString() })
    .eq('token', token)
    .neq('qr_status', 'scanned')
    .select()
    .single()

  if (updateError || !updatedStudent) {
    // If update fails due to neq condition failing in race condition
    return NextResponse.json({ error: 'Already Scanned', student }, { status: 400 })
  }

  return NextResponse.json({ success: true, student: updatedStudent }, { status: 200 })
}
