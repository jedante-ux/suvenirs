'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // ChunkLoadError = stale deploy cache, force reload
    if (
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed')
    ) {
      window.location.reload()
      return
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md px-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Algo salió mal</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Hubo un error al cargar la página. Intenta recargar.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
        >
          Recargar página
        </button>
      </div>
    </div>
  )
}
