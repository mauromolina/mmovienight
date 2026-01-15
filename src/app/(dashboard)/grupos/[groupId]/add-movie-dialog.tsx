'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Search, X, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { getTMDbImageUrl } from '@/types/tmdb'
import { addMovieToGroup } from './actions'
import { cn } from '@/lib/utils'

interface SearchResult {
  tmdb_id: number
  title: string
  year: number | null
  poster_path: string | null
  overview: string
  vote_average: number
}

interface AddMovieDialogProps {
  groupId: string
}

export function AddMovieDialog({ groupId }: AddMovieDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watchedAt, setWatchedAt] = useState('')

  const searchMovies = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(searchQuery)}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al buscar')
      }

      setResults(data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar películas')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce de búsqueda
  const handleSearchChange = (value: string) => {
    setQuery(value)
    const timeoutId = setTimeout(() => searchMovies(value), 300)
    return () => clearTimeout(timeoutId)
  }

  const handleAddMovie = async () => {
    if (!selectedMovie) return

    setIsAdding(true)
    setError(null)

    const result = await addMovieToGroup(
      groupId,
      selectedMovie.tmdb_id,
      watchedAt || undefined
    )

    if (result.error) {
      setError(result.error)
      setIsAdding(false)
    } else {
      setIsOpen(false)
      resetState()
    }
  }

  const resetState = () => {
    setQuery('')
    setResults([])
    setSelectedMovie(null)
    setError(null)
    setWatchedAt('')
  }

  const handleClose = () => {
    setIsOpen(false)
    resetState()
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
        Agregar película
      </Button>

      <Dialog
        open={isOpen}
        onClose={handleClose}
        title={selectedMovie ? 'Confirmar película' : 'Buscar película'}
        description={
          selectedMovie
            ? 'Revisá los datos y agregala al grupo'
            : 'Buscá la película que quieras agregar al grupo'
        }
        size="lg"
      >
        {selectedMovie ? (
          // Vista de confirmación
          <>
            <DialogContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <div className="w-32 flex-shrink-0">
                  {selectedMovie.poster_path ? (
                    <Image
                      src={getTMDbImageUrl(selectedMovie.poster_path, 'w185')!}
                      alt={selectedMovie.title}
                      width={128}
                      height={192}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-[var(--surface)] rounded-lg flex items-center justify-center">
                      <span className="text-3xl">🎬</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100">
                      {selectedMovie.title}
                    </h3>
                    {selectedMovie.year && (
                      <p className="text-sm text-gray-400">{selectedMovie.year}</p>
                    )}
                  </div>

                  {selectedMovie.overview && (
                    <p className="text-sm text-gray-400 line-clamp-3">
                      {selectedMovie.overview}
                    </p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Fecha de visionado (opcional)
                    </label>
                    <input
                      type="date"
                      value={watchedAt}
                      onChange={(e) => setWatchedAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-gray-100 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </DialogContent>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setSelectedMovie(null)}>
                Volver a buscar
              </Button>
              <Button
                onClick={handleAddMovie}
                isLoading={isAdding}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Agregar al grupo
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Vista de búsqueda
          <>
            <DialogContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Buscar por título..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:outline-none"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery('')
                      setResults([])
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                  </div>
                ) : results.length > 0 ? (
                  results.map((movie) => (
                    <button
                      key={movie.tmdb_id}
                      onClick={() => setSelectedMovie(movie)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors text-left"
                    >
                      <div className="w-12 h-18 flex-shrink-0">
                        {movie.poster_path ? (
                          <Image
                            src={getTMDbImageUrl(movie.poster_path, 'w92')!}
                            alt={movie.title}
                            width={48}
                            height={72}
                            className="rounded"
                          />
                        ) : (
                          <div className="w-12 h-18 bg-[var(--background-secondary)] rounded flex items-center justify-center">
                            <span className="text-xl">🎬</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-100 truncate">
                          {movie.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {movie.year || 'Año desconocido'}
                          {movie.vote_average > 0 && ` • ★ ${movie.vote_average.toFixed(1)}`}
                        </p>
                      </div>
                    </button>
                  ))
                ) : query ? (
                  <p className="text-center text-sm text-gray-500 py-8">
                    No se encontraron resultados
                  </p>
                ) : (
                  <p className="text-center text-sm text-gray-500 py-8">
                    Escribí el título de una película para buscar
                  </p>
                )}
              </div>
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  )
}
