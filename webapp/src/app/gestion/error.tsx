'use client'

import { useEffect } from 'react'

export default function GestionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // ChunkLoadError after deploy = force reload
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
        <h2 className="text-xl font-bold mb-2">Error en el panel</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Algo falló al cargar esta sección.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2 border border-border rounded-full font-medium hover:bg-muted transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Recargar
          </button>
        </div>
      </div>
    </div>
  )
}
