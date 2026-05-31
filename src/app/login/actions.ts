'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function login(email: string, password: string) {
  const supabase = await createClient()

  const { error, data: authData } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('Login error:', error.message)
    return { error: error.message }
  }

  const user = authData.user

  if (user) {
    // Use service role client to bypass RLS for role lookup
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Role lookup:', roleData, roleError?.message)
    const role = roleData?.role || 'guard'

    revalidatePath('/', 'layout')
    
    return { success: true, role, redirectUrl: role === 'guard' ? '/scan' : '/dashboard' }
  }

  return { error: 'Unknown error' }
}
