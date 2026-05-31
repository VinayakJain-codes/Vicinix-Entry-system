import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 font-sans dark:bg-zinc-900 p-4 relative overflow-hidden">
      
      {/* Background decoration for premium feel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/10 dark:bg-green-500/5 rounded-full blur-3xl -z-10"></div>
      
      <main className="flex flex-col items-center justify-center text-center p-10 sm:p-12 bg-white dark:bg-black rounded-[2rem] shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 max-w-lg w-full border border-zinc-100 dark:border-zinc-800 z-10 relative">
        
        {/* Marketneraxvicinix Logo */}
        <img src="/Marketneraxvicinix.png" alt="Marketnera x Vicinix" className="w-64 object-contain mb-8 p-4 bg-black rounded-xl" style={{ minHeight: '80px' }} />
        
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
          Marketnera Entry
        </h1>
        
        <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-10 max-w-sm leading-relaxed">
          Real-time, fraud-resistant digital entry validation.
        </p>
        
        <Link 
          href="/login" 
          className="w-full flex justify-center items-center py-4 px-4 rounded-xl text-base font-bold text-white bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:text-white dark:hover:bg-green-500 transition-all shadow-lg active:scale-[0.98]"
        >
          Sign In to Dashboard
        </Link>
        
        {/* Footer Branding */}
        <div className="mt-10 pt-6 border-t border-zinc-100 dark:border-zinc-800 w-full">
          <p className="text-[11px] font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 uppercase">
            Tech by Vicinix
          </p>
        </div>
      </main>
    </div>
  );
}
