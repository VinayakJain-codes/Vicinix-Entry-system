import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen relative overflow-hidden">
      {/* Cinematic faint grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
      
      {/* Subtle green gradient radial */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#13EC5B]/10 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '4s' }}></div>

      <main className="flex flex-col items-center justify-center text-center p-10 sm:p-12 z-10 w-full max-w-md">
        
        {/* Animated green pulsing circle behind logo */}
        <div className="relative mb-12 flex justify-center items-center">
          <div className="absolute w-32 h-32 bg-[#13EC5B]/20 blur-2xl rounded-full animate-pulse"></div>
          <img src="/Marketneraxvicinix.png" alt="Marketnera x Vicinix" className="w-64 object-contain relative z-10" />
        </div>
        
        <h1 className="text-5xl font-black tracking-tight mb-4 uppercase">
          Marketnera
        </h1>
        
        <p className="text-lg text-[var(--color-muted)] mb-12 max-w-sm leading-relaxed font-medium">
          Event Entry System
        </p>
        
        <Link 
          href="/login" 
          className="w-full flex justify-between items-center py-4 px-6 rounded-xl text-lg font-bold text-black bg-[var(--color-marketnera)] hover:bg-[var(--color-marketnera-dark)] transition-all shadow-[0_0_20px_rgba(19,236,91,0.2)] hover:shadow-[0_0_30px_rgba(19,236,91,0.4)] active:scale-[0.98]"
        >
          <span>Staff Login</span>
          <ArrowRight className="w-5 h-5" />
        </Link>

        <Link 
          href="/student/login" 
          className="w-full flex justify-between items-center py-4 px-6 mt-4 rounded-xl text-lg font-bold text-[var(--color-text)] bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-[0.98]"
        >
          <span>Student Access</span>
          <ArrowRight className="w-5 h-5 text-[var(--color-marketnera)]" />
        </Link>
        
        {/* Footer Branding */}
        <div className="mt-16 pt-8 w-full">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--color-vicinix)] opacity-70 uppercase">
            Tech by Vicinix
          </p>
        </div>
      </main>
    </div>
  );
}
