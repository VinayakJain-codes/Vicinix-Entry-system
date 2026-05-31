'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=Could not authenticate user')
  }

  const user = authData.user

  if (user) {
    // Fetch the user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = roleData?.role || 'guard'

    revalidatePath('/', 'layout')
    
    if (role === 'guard') {
      redirect('/scan')
    } else {
      redirect('/dashboard')
    }
  }

  redirect('/login?error=Unknown error')
}
