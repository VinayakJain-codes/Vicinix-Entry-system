import { createClient } from '@/utils/supabase/server'
import ImportRosterForm from './ImportRosterForm'
import GenerateQRsSection from './GenerateQRsSection'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleData } = await supabase.from('user_roles').select('role').eq('id', user.id).single()
  if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
    redirect('/login?error=Unauthorized')
  }

  // Fetch events
  const { data: events } = await supabase.from('events').select('*').order('created_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans dark:bg-zinc-900 p-8">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8 text-center">
        Admin Dashboard
      </h1>

      <main className="flex flex-col items-center max-w-4xl mx-auto w-full space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <ImportRosterForm />
          <GenerateQRsSection events={events || []} />
        </div>

      </main>
    </div>
  )
}
