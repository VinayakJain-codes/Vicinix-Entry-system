'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { studentLogin } from './actions'
import { Loader2, ArrowLeft, LogIn } from 'lucide-react'
import Link from 'next/link'

export default function StudentLoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const rollNo = formData.get('rollNo') as string

    if (!rollNo) {
      setError('Please enter your enrollment number')
      setLoading(false)
      return
    }

    try {
      const result = await studentLogin(rollNo)
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else if (result.success) {
        router.push('/student')
        router.refresh()
      }
    } catch (err) {
      setError('Failed to log in. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[var(--color-bg)] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#13EC5B]/5 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '6s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-[#F97316]/5 rounded-full blur-[80px] -z-10"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-marketnera)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="flex flex-col items-center">
          <img
            src="/Marketneraxvicinix.png"
            alt="Marketnera x Vicinix Logo"
            className="w-48 h-auto object-contain mb-4 rounded-xl"
          />
          <h2 className="text-center text-3xl font-black tracking-tight text-[var(--color-marketnera)] uppercase">
            <a 
              href="https://marketnera.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline underline-offset-8 decoration-2 decoration-[var(--color-marketnera)]/40 hover:decoration-[var(--color-marketnera)] transition-all"
            >
              MARKETNERA
            </a>
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--color-text)] font-semibold uppercase tracking-[0.15em] opacity-80">
            Student Portal
          </p>
          <p className="mt-1 text-center text-xs text-[var(--color-muted)] font-medium">
            Access your event entry QR tickets
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--color-surface)] py-8 px-6 sm:rounded-2xl sm:px-10 border border-[var(--color-border)] shadow-[0_0_50px_rgba(19,236,91,0.02)] backdrop-blur-md">
          
          {error && (
            <div className="mb-6 bg-red-500/10 text-red-400 p-4 rounded-xl text-sm border border-red-500/20 font-medium text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="rollNo" className="block text-sm font-semibold text-[var(--color-text)]">
                Enrollment Number
              </label>
              <div className="mt-2">
                <input
                  id="rollNo"
                  name="rollNo"
                  type="text"
                  required
                  className="block w-full appearance-none rounded-xl border border-[var(--color-border)] px-4 py-3 placeholder-[var(--color-muted)] shadow-sm focus:border-[var(--color-marketnera)] focus:outline-none focus:ring-1 focus:ring-[var(--color-marketnera)] sm:text-sm bg-[#0A0F0D] text-[var(--color-text)] transition-colors font-mono"
                  placeholder="e.g. 0901CS201132"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-xl border border-transparent bg-[var(--color-marketnera)] py-3 px-4 text-sm font-bold text-black shadow-[0_0_15px_rgba(19,236,91,0.2)] hover:shadow-[0_0_25px_rgba(19,236,91,0.4)] hover:bg-[var(--color-marketnera-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-marketnera)] focus:ring-offset-2 focus:ring-offset-[#111918] disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> View My QR
                  </>
                )}
              </button>
            </div>
          </form>


        </div>
        
        <div className="mt-8 text-center">
          <a
            href="https://vicinix.co.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--color-vicinix)] opacity-85 hover:opacity-100 underline underline-offset-4 decoration-1 decoration-[var(--color-vicinix)]/40 hover:decoration-[var(--color-vicinix)] hover:scale-[1.02] transition-all uppercase"
          >
            Built by Vicinix
          </a>
        </div>
      </div>
    </div>
  )
}
