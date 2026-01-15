'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, Search, Star, Plus, Check, Film } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: number
  title: string
  year: number
  poster: string | null
  genres: string[]
  rating: number
}

interface AddToWatchlistModalProps {
  isOpen: boolean
  onClose: () => void
  groupName?: string
}

export function AddToWatchlistModal({ isOpen, onClose, groupName = 'the group' }: AddToWatchlistModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [addedMovies, setAddedMovies] = useState<number[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Search movies using TMDB API
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true)
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(searchQuery)}`)
          if (response.ok) {
            const data = await response.json()
            setSearchResults(data.results?.slice(0, 5).map((movie: any) => ({
              id: movie.tmdb_id,
              title: movie.title,
              year: movie.year || 0,
              poster: movie.poster_path,
              genres: [],
              rating: movie.vote_average || 0,
            })) || [])
          }
        } catch (error) {
          console.error('Search error:', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleAddMovie = (movieId: number) => {
    setAddedMovies((prev) => [...prev, movieId])
    // TODO: Call API to add movie to watchlist
  }

  const handleSelectMovie = (movieId: number) => {
    setSelectedMovie(selectedMovie === movieId ? null : movieId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-gradient-to-b from-[#14181D] to-[#0F1318] border border-[#2A3038] shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-[#1E2328]">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-[#6B7280] hover:text-[#F2F4F6] hover:bg-[#1A2026] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <h2 className="text-2xl font-bold text-[#F2F4F6]">
            Agregar a <span className="text-[#16C7D9]">Watchlist</span>
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Proponé una película para {groupName}
          </p>
        </div>

        {/* Search Section */}
        <div className="px-6 pt-5 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribí el nombre de una película..."
              className="w-full pl-12 pr-4 py-4 bg-[#0B0D10] border-2 border-[#2A3038] rounded-xl text-[#F2F4F6] text-lg placeholder-[#4A5568] focus:outline-none focus:border-[#16C7D9] focus:ring-4 focus:ring-[#16C7D9]/20 transition-all"
            />
            {/* Glow effect on focus */}
            <div className="absolute inset-0 -z-10 rounded-xl bg-[#16C7D9]/10 blur-xl opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </div>

        {/* Results */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-220px)]">
          {isSearching && (
            <div className="py-12 text-center">
              <div className="w-8 h-8 mx-auto mb-4 border-2 border-[#16C7D9]/30 border-t-[#16C7D9] rounded-full animate-spin" />
              <p className="text-[#6B7280]">Buscando...</p>
            </div>
          )}

          {!isSearching && searchQuery.length >= 2 && searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map((movie, index) => {
                const isSelected = selectedMovie === movie.id
                const isAdded = addedMovies.includes(movie.id)
                const isPrimary = index === 0

                return (
                  <div
                    key={movie.id}
                    className={cn(
                      'relative rounded-xl border transition-all',
                      isSelected
                        ? 'bg-[#16C7D9]/5 border-[#16C7D9]/50'
                        : 'bg-[#0B0D10]/50 border-[#1E2328] hover:border-[#2A3038]'
                    )}
                  >
                    <div className="flex items-start gap-4 p-4">
                      {/* Poster */}
                      <div
                        className="relative w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer bg-[#14181D]"
                        onClick={() => handleSelectMovie(movie.id)}
                      >
                        {movie.poster ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w200${movie.poster}`}
                            alt={movie.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-6 h-6 text-[#4A5568]" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleSelectMovie(movie.id)}
                      >
                        <h3 className="text-base font-semibold text-[#F2F4F6] truncate">
                          {movie.title}
                        </h3>
                        <p className="text-sm text-[#6B7280] mt-0.5">
                          {movie.year > 0 ? movie.year : 'Fecha desconocida'}
                        </p>
                        {movie.rating > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                            <span className="text-sm font-medium text-[#D4AF37]">
                              {movie.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {isAdded ? (
                          <div className="flex items-center gap-1.5 px-4 py-2 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg text-[#10B981]">
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">Agregada</span>
                          </div>
                        ) : isPrimary ? (
                          <button
                            onClick={() => handleAddMovie(movie.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#16C7D9] hover:bg-[#14B8C9] rounded-lg text-sm font-semibold text-[#0B0D10] transition-all shadow-lg shadow-[#16C7D9]/20 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddMovie(movie.id)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-[#1A2026] hover:bg-[#242A32] border border-[#2A3038] hover:border-[#3A4048] rounded-lg text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reason field for selected movie */}
                    {isSelected && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="pl-20">
                          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
                            ¿Por qué la recomendás? (opcional)
                          </label>
                          <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ej: Me dijeron que el sonido en cine es increíble"
                            rows={2}
                            className="w-full px-3 py-2 bg-[#0B0D10] border border-[#2A3038] rounded-lg text-sm text-[#F2F4F6] placeholder-[#4A5568] resize-none focus:outline-none focus:border-[#16C7D9] transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty state - no results */}
          {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1A2026] flex items-center justify-center">
                <Search className="w-8 h-8 text-[#4A5568]" />
              </div>
              <p className="text-[#6B7280]">No se encontraron películas</p>
              <p className="text-sm text-[#4A5568] mt-1">Probá con otro término de búsqueda</p>
            </div>
          )}

          {/* Initial state */}
          {searchQuery.length < 2 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1A2026] flex items-center justify-center">
                <Search className="w-8 h-8 text-[#4A5568]" />
              </div>
              <p className="text-[#6B7280]">Buscá una película</p>
              <p className="text-sm text-[#4A5568] mt-1">
                Empezá a escribir para encontrar películas para agregar a la watchlist
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
