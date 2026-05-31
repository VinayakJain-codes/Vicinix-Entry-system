export default function ScanPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 font-sans dark:bg-zinc-900">
      <main className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-black rounded-2xl shadow-xl max-w-lg w-full">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
          Scan QR Code
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Guard interface for scanning entries.
        </p>
      </main>
    </div>
  );
}
