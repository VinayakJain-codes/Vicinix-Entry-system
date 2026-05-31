import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import ImportRosterForm from './ImportRosterForm'
import GenerateQRsSection from './GenerateQRsSection'
import BlastSection from './BlastSection'
import MasterQRSection from './MasterQRSection'
import EventOverview from './EventOverview'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service role client to bypass RLS for role check
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: roleData } = await adminClient.from('user_roles').select('role').eq('id', user.id).single()
  if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
    redirect('/login?error=Unauthorized')
  }

  // Fetch events
  const { data: events } = await supabase.from('events').select('*').order('created_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans dark:bg-zinc-900 p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8 text-center">
        Admin Dashboard
      </h1>

      <main className="flex flex-col items-center max-w-7xl mx-auto w-full space-y-12">
        
        {/* Main Event Overview (Stats, Feed, Table) */}
        <EventOverview events={events || []} />

        <div className="w-full border-t border-zinc-200 dark:border-zinc-800 pt-8">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Administrative Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <ImportRosterForm />
            <GenerateQRsSection events={events || []} />
            <BlastSection events={events || []} />
            <MasterQRSection events={events || []} />
          </div>
        </div>

      </main>
    </div>
  )
}
