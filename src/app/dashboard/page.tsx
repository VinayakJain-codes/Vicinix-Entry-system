import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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
  const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', user.id).single()
  if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
    redirect('/login?error=Unauthorized')
  }

  // Fetch events
  const { data: events } = await supabase.from('events').select('*').order('created_at', { ascending: false })

  return (
    <div className="flex flex-col w-full h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-widest">Global Overview</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">Real-time statistics and entry feed across all events.</p>
      </div>

      <main className="flex-1 w-full flex flex-col space-y-12">
        <EventOverview events={events || []} />
      </main>
    </div>
  )
}
