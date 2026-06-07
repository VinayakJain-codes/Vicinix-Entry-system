'use client'

import { BarChart3, Users, Upload, QrCode, MessageCircle, ShieldCheck, Calendar, LogOut, Radio } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const navItems = [
  { href: '/dashboard',           label: 'Overview',  icon: BarChart3 },
  { href: '/dashboard/live-feed',  label: 'Live Feed', icon: Radio },
  { href: '/dashboard/students',  label: 'Students',  icon: Users },
  { href: '/dashboard/import',    label: 'Import',    icon: Upload },
  { href: '/dashboard/qr',        label: 'Generate',  icon: QrCode },
  { href: '/dashboard/blast',     label: 'WA Blast',  icon: MessageCircle },
  { href: '/dashboard/master',    label: 'Master QR', icon: ShieldCheck },
  { href: '/dashboard/events',    label: 'Events',    icon: Calendar },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] z-20">
        <div className="p-6">
          <h1 className="text-xl font-black tracking-widest text-[var(--color-marketnera)] uppercase">
            Marketnera
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-[var(--color-marketnera-glow)] text-[var(--color-marketnera)]' 
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-border)]">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
          <div className="mt-6 text-center">
            <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--color-vicinix)] opacity-50 uppercase">
              Tech by Vicinix
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] z-20">
          <h1 className="text-lg font-black tracking-widest text-[var(--color-marketnera)] uppercase">
            Marketnera
          </h1>
          <button onClick={handleLogout} className="p-2 text-[var(--color-muted)] hover:text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
        
        {/* Mobile Bottom Bar */}
        <nav className="md:hidden flex justify-around p-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] z-20">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  isActive 
                    ? 'text-[var(--color-marketnera)]' 
                    : 'text-[var(--color-muted)]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
