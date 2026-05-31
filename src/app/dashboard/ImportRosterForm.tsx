'use client'

import { useActionState } from 'react'
import { importRoster } from './importAction'

type State = {
  imported: number;
  skipped: number;
  error: string | null;
}

const initialState: State = {
  imported: 0,
  skipped: 0,
  error: null,
}

export default function ImportRosterForm() {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return await importRoster(formData)
  }, initialState)

  return (
    <section className="bg-white dark:bg-black rounded-2xl shadow-xl w-full p-8 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
        Import Student Roster
      </h2>
      
      <form action={formAction} className="space-y-6">
        <div>
          <label htmlFor="eventName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Event Name
          </label>
          <input
            type="text"
            name="eventName"
            id="eventName"
            required
            className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 dark:bg-zinc-900 dark:text-white"
            placeholder="e.g. Annual Gala 2026"
          />
        </div>

        <div>
          <label htmlFor="roster" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Excel File (.xlsx, .csv)
          </label>
          <input
            type="file"
            name="roster"
            id="roster"
            accept=".xlsx, .xls, .csv"
            required
            className="mt-1 block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Uploading...' : 'Upload Roster'}
        </button>
      </form>

      {state?.error && (
        <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-400">
          {state.error}
        </div>
      )}

      {state?.imported !== undefined && state.imported > 0 && (
        <div className="mt-4 p-4 text-sm text-green-700 bg-green-100 rounded-md dark:bg-green-900/30 dark:text-green-400">
          Successfully imported {state.imported} students. Skipped {state.skipped} duplicates.
        </div>
      )}
    </section>
  )
}
