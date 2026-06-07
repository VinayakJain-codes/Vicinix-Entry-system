import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { verifySession } from '@/utils/studentAuth'
import { studentLogout } from './login/actions'
import DownloadQRButton from '@/components/DownloadQRButton'
import { Calendar, CheckCircle2, AlertCircle, LogOut, Ticket, Loader2 } from 'lucide-react'

// Fetch student records from database
async function getStudentTickets(rollNo: string) {
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await adminClient
    .from('students')
    .select(`
      id,
      name,
      roll_no,
      qr_status,
      qr_url,
      scanned_at,
      events (
        name,
        date,
        is_active
      )
    `)
    .ilike('roll_no', rollNo)

  if (error) {
    console.error('[Student Dashboard] Fetch Error:', error)
    return []
  }

  return data || []
}

export default async function StudentDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('student_session')?.value

  if (!token) {
    redirect('/student/login')
  }

  const rollNo = verifySession(token)
  if (!rollNo) {
    // If token is invalid/tampered, clear it and redirect to login
    redirect('/student/login')
  }

  const tickets = await getStudentTickets(rollNo)

  // Retrieve student name from the first ticket if available
  const studentName = tickets.length > 0 ? tickets[0].name : 'Student'

  return (
    <div className="flex-1 bg-[var(--color-bg)] min-h-screen pb-16 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#13EC5B]/5 rounded-full blur-[120px] -z-10"></div>
      
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[#0A0F0D]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-marketnera)]/10 flex items-center justify-center border border-[var(--color-marketnera)]/20">
              <Ticket className="w-4 h-4 text-[var(--color-marketnera)]" />
            </div>
            <div>
              <span className="text-sm font-black text-[var(--color-marketnera)] tracking-widest uppercase">MARKETNERA</span>
              <span className="text-[10px] block font-mono text-[var(--color-muted)] uppercase tracking-wider">Student Ticket Hub</span>
            </div>
          </div>
          
          <form
            action={async () => {
              'use server'
              await studentLogout()
              redirect('/student/login')
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2 py-1.5 px-3 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:text-red-400 hover:border-red-500/30 transition-all active:scale-[0.98] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight uppercase">
            My Entry Tickets
          </h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            Welcome back, <span className="text-[var(--color-text)] font-bold">{studentName}</span>. Your registered event passes are shown below.
          </p>
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-[var(--color-muted)]">
            Roll Number: <span className="text-[var(--color-text)] ml-1 font-bold">{rollNo.toUpperCase()}</span>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 max-w-md mx-auto shadow-sm">
            <AlertCircle className="w-12 h-12 text-[var(--color-vicinix)] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[var(--color-text)]">No Events Registered</h3>
            <p className="text-xs text-[var(--color-muted)] mt-2 max-w-xs mx-auto leading-relaxed">
              We couldn't find any registered events matching your roll number. If you think this is a mistake, please reach out to the event organizers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tickets.map((ticket: any) => {
              const event = ticket.events || { name: 'Special Event', date: null }
              const eventDate = event.date ? new Date(event.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'Date TBA'
              
              // Status Badge logic
              let statusLabel = 'Processing'
              let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              
              if (ticket.scanned_at) {
                statusLabel = 'Checked In'
                badgeColor = 'bg-[var(--color-granted)]/10 text-[var(--color-granted)] border-[var(--color-granted)]/20 font-bold'
              } else if (ticket.qr_status === 'generated' || ticket.qr_status === 'sent') {
                statusLabel = 'Ready'
                badgeColor = 'bg-[var(--color-granted)]/10 text-[var(--color-granted)] border-[var(--color-granted)]/20'
              } else if (ticket.qr_status === 'pending') {
                statusLabel = 'Pending'
                badgeColor = 'bg-[var(--color-pending)]/10 text-[var(--color-pending)] border-[var(--color-pending)]/20'
              }

              return (
                <div
                  key={ticket.id}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden card-glow transition-all flex flex-col"
                >
                  {/* Event Info Banner */}
                  <div className="p-5 border-b border-[var(--color-border)] flex-1">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${badgeColor}`}>
                        {statusLabel}
                      </span>
                      {ticket.scanned_at && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--color-granted)] shrink-0" />
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-[var(--color-text)] tracking-tight line-clamp-2 leading-tight">
                      {event.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] mt-2 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{eventDate}</span>
                    </div>
                  </div>

                  {/* QR Image Area */}
                  <div className="bg-[#0A0F0D] p-6 flex flex-col items-center justify-center border-t border-[var(--color-border)]">
                    {ticket.qr_url ? (
                      <div className="space-y-6 w-full flex flex-col items-center">
                        <div className="relative p-3 bg-white rounded-2xl shadow-inner group">
                          {/* Visual decorative corners */}
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[var(--color-marketnera)]"></div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[var(--color-marketnera)]"></div>
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[var(--color-marketnera)]"></div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[var(--color-marketnera)]"></div>
                          
                          <img
                            src={ticket.qr_url}
                            alt={`${event.name} QR Ticket`}
                            className="w-56 h-auto object-contain rounded-lg transition-transform group-hover:scale-[1.02] duration-300"
                          />
                        </div>
                        <div className="w-full">
                          <DownloadQRButton qrUrl={ticket.qr_url} eventName={event.name} />
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 px-4 text-center border-2 border-dashed border-[var(--color-border)] rounded-2xl w-full flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-[var(--color-vicinix)] animate-spin mb-3" />
                        <span className="text-xs font-bold text-[var(--color-text)]">Generating Ticket QR</span>
                        <p className="text-[10px] text-[var(--color-muted)] mt-1.5 max-w-[200px] leading-relaxed">
                          Your entry pass is in the queue. Organizers will generate it shortly. Please refresh this page later.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
