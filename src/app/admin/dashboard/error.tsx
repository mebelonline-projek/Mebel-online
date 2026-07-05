'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold text-gray-800">
        Terjadi Kesalahan
      </h2>
      <p className="text-sm text-gray-600">
        {error.message || 'Something went wrong while loading this section.'}
      </p>
      <button
        onClick={retry}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  )
}