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

  const { token, gate_label } = await request.json()
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  let lookupToken = token
  try {
    const url = new URL(token)
    lookupToken = url.searchParams.get('token') || token
  } catch {
    // token is already a raw string, use as-is
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
    .eq('token', lookupToken)
    .single()

  if (findError || !student) {
    // Before failing, check if it's a master token
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('master_qr_token', lookupToken)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Invalid Token' }, { status: 404 })
    }

    // It's a master token!
    await supabaseAdmin.rpc('increment_master_scan', { event_uuid: event.id })
    
    // Log MASTER scan
    await supabaseAdmin.from('scan_logs').insert({
      event_id: event.id,
      scanned_by: user.id,
      scan_result: 'MASTER',
      gate_label: gate_label || 'Main Gate'
    })
    
    return NextResponse.json({ success: true, isMaster: true, event }, { status: 200 })
  }

  if (student.qr_status === 'scanned') {
    // Log DENIED scan
    await supabaseAdmin.from('scan_logs').insert({
      student_id: student.id,
      event_id: student.event_id,
      scanned_by: user.id,
      scan_result: 'DENIED',
      gate_label: gate_label || 'Main Gate'
    })
    return NextResponse.json({ error: 'Already Scanned', student }, { status: 400 })
  }

  // 4. Atomic update
  const { data: updatedStudent, error: updateError } = await supabaseAdmin
    .from('students')
    .update({ qr_status: 'scanned', scanned_at: new Date().toISOString() })
    .eq('token', lookupToken)
    .neq('qr_status', 'scanned')
    .select()
    .single()

  if (updateError || !updatedStudent) {
    // If update fails due to neq condition failing in race condition
    await supabaseAdmin.from('scan_logs').insert({
      student_id: student.id,
      event_id: student.event_id,
      scanned_by: user.id,
      scan_result: 'DENIED',
      gate_label: gate_label || 'Main Gate'
    })
    return NextResponse.json({ error: 'Already Scanned', student }, { status: 400 })
  }

  // Log GRANTED scan
  await supabaseAdmin.from('scan_logs').insert({
    student_id: updatedStudent.id,
    event_id: updatedStudent.event_id,
    scanned_by: user.id,
    scan_result: 'GRANTED',
    gate_label: gate_label || 'Main Gate'
  })

  return NextResponse.json({ success: true, isMaster: false, student: updatedStudent }, { status: 200 })
}
