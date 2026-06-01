'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from './actions'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError('Please fill in both fields')
      setLoading(false)
      return
    }

    const result = await login(email, password)
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.success && result.redirectUrl) {
      router.push(result.redirectUrl)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[var(--color-bg)]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <h2 className="mt-2 text-center text-3xl font-black tracking-tight text-[var(--color-marketnera)] uppercase">
          MARKETNERA
        </h2>
        <p className="mt-2 text-center text-[var(--color-muted)] font-medium">
          Sign in to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--color-surface)] py-8 px-4 sm:rounded-2xl sm:px-10 border border-[var(--color-marketnera-glow)] shadow-[0_0_40px_rgba(19,236,91,0.03)] mx-4 sm:mx-0">
          
          {error && (
            <div className="mb-6 bg-red-500/10 text-red-400 p-4 rounded-xl text-sm border border-red-500/20 font-medium text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)]">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full appearance-none rounded-xl border border-[var(--color-border)] px-4 py-3 placeholder-[var(--color-muted)] shadow-sm focus:border-[var(--color-marketnera)] focus:outline-none focus:ring-1 focus:ring-[var(--color-marketnera)] sm:text-sm bg-[#0A0F0D] text-[var(--color-text)] transition-colors"
                  placeholder="admin@marketnera.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)]">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full appearance-none rounded-xl border border-[var(--color-border)] px-4 py-3 placeholder-[var(--color-muted)] shadow-sm focus:border-[var(--color-marketnera)] focus:outline-none focus:ring-1 focus:ring-[var(--color-marketnera)] sm:text-sm bg-[#0A0F0D] text-[var(--color-text)] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-xl border border-transparent bg-[var(--color-marketnera)] py-3 px-4 text-sm font-bold text-black shadow-[0_0_15px_rgba(19,236,91,0.2)] hover:shadow-[0_0_25px_rgba(19,236,91,0.4)] hover:bg-[var(--color-marketnera-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-marketnera)] focus:ring-offset-2 focus:ring-offset-[#111918] disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--color-vicinix)] opacity-50 uppercase">
            Built by Vicinix
          </p>
        </div>
      </div>
    </div>
  )
}
