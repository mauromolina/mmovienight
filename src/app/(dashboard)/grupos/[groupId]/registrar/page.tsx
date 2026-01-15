'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Calendar,
  MapPin,
  Wifi,
  Star,
  ChevronRight,
  Check,
  Plus,
  Clock,
  Award,
  ThumbsUp,
  X,
  Film,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: number
  title: string
  year: number
  poster: string | null
}

interface SelectedMovie {
  id: string
  title: string
  year: number
  poster: string | null
  duration: string
  rating: number
  synopsis: string
  genres: string[]
}

interface Member {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
}

export default function RegisterWatchedPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = params.groupId as string
  const movieIdFromUrl = searchParams.get('movie')

  // Group and members state
  const [group, setGroup] = useState<{ name: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMovie, setIsLoadingMovie] = useState(false)

  // Form state
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<SelectedMovie | null>(null)
  const [watchDate, setWatchDate] = useState(new Date().toISOString().split('T')[0])
  const [functionType, setFunctionType] = useState<'presencial' | 'remota'>('presencial')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [quickThoughts, setQuickThoughts] = useState('')

  // Submit state
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch group data
  useEffect(() => {
    async function fetchGroupData() {
      try {
        const response = await fetch(`/api/groups/${groupId}`)
        if (response.ok) {
          const data = await response.json()
          setGroup({ name: data.group.name })
          setMembers(data.members || [])
        }
      } catch (error) {
        console.error('Error fetching group data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchGroupData()
  }, [groupId])

  // Auto-load movie from URL parameter
  useEffect(() => {
    async function loadMovieFromUrl() {
      if (!movieIdFromUrl || selectedMovie) return

      setIsLoadingMovie(true)
      try {
        const response = await fetch(`/api/tmdb/movie/${movieIdFromUrl}`)
        if (response.ok) {
          const details = await response.json()
          setSelectedMovie({
            id: String(movieIdFromUrl),
            title: details.title,
            year: details.release_date ? new Date(details.release_date).getFullYear() : 0,
            poster: details.poster_path || null,
            duration: details.runtime ? `${details.runtime} min` : 'N/A',
            rating: details.vote_average || 0,
            synopsis: details.overview || 'Sin sinopsis disponible.',
            genres: details.genres?.map((g: any) => g.name) || [],
          })
        }
      } catch (error) {
        console.error('Error loading movie from URL:', error)
      } finally {
        setIsLoadingMovie(false)
      }
    }
    loadMovieFromUrl()
  }, [movieIdFromUrl])

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
            })) || [])
            setShowSearchResults(true)
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
      setShowSearchResults(false)
    }
  }, [searchQuery])

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    )
  }

  const handleSelectMovie = async (movie: SearchResult) => {
    try {
      // Fetch detailed movie info from TMDB
      const response = await fetch(`/api/tmdb/movie/${movie.id}`)
      if (response.ok) {
        const details = await response.json()
        setSelectedMovie({
          id: String(movie.id),
          title: details.title || movie.title,
          year: details.release_date ? new Date(details.release_date).getFullYear() : movie.year,
          poster: details.poster_path || movie.poster,
          duration: details.runtime ? `${details.runtime} min` : 'N/A',
          rating: details.vote_average || 0,
          synopsis: details.overview || 'Sin sinopsis disponible.',
          genres: details.genres?.map((g: any) => g.name) || [],
        })
      } else {
        // Fallback to basic info
        setSelectedMovie({
          id: String(movie.id),
          title: movie.title,
          year: movie.year,
          poster: movie.poster,
          duration: 'N/A',
          rating: 0,
          synopsis: 'Sin sinopsis disponible.',
          genres: [],
        })
      }
    } catch (error) {
      console.error('Error fetching movie details:', error)
      setSelectedMovie({
        id: String(movie.id),
        title: movie.title,
        year: movie.year,
        poster: movie.poster,
        duration: 'N/A',
        rating: 0,
        synopsis: 'Sin sinopsis disponible.',
        genres: [],
      })
    }
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const clearSelectedMovie = () => {
    setSelectedMovie(null)
    setSearchQuery('')
  }

  const handleConfirmRegistro = async () => {
    if (!selectedMovie || isSaving) return

    setIsSaving(true)
    setError(null)

    try {
      // 1. Agregar película al grupo con asistentes
      const addMovieResponse = await fetch(`/api/groups/${groupId}/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: parseInt(selectedMovie.id, 10),
          watched_at: watchDate,
          attendees: selectedMembers,
        }),
      })

      const addMovieData = await addMovieResponse.json()

      if (!addMovieResponse.ok) {
        throw new Error(addMovieData.error || 'Error al agregar la película')
      }

      // 2. Si hay calificación, guardarla
      if (rating > 0) {
        const movieId = addMovieData.movie.id

        const ratingResponse = await fetch(
          `/api/groups/${groupId}/movies/${movieId}/ratings`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              score: rating,
              comment: quickThoughts.trim() || null,
            }),
          }
        )

        if (!ratingResponse.ok) {
          const ratingData = await ratingResponse.json()
          console.error('Error saving rating:', ratingData.error)
          // No fallamos por esto, la película ya se agregó
        }
      }

      // Redirigir al grupo
      router.push(`/grupos/${groupId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#16C7D9]/30 border-t-[#16C7D9] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in relative min-h-screen">
      {/* Blurred Background from Poster - Full Screen Backdrop */}
      {selectedMovie && selectedMovie.poster && (
        <div className="fixed inset-0 -z-10">
          <Image
            src={`https://image.tmdb.org/t/p/original${selectedMovie.poster}`}
            alt=""
            fill
            className="object-cover blur-2xl scale-125 opacity-30"
            priority
          />
          {/* Dark overlay with gradient */}
          <div className="absolute inset-0 bg-[#0B0D10]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D10]/50 via-transparent to-[#0B0D10]/50" />
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-8">
        <Link href={`/grupos/${groupId}`} className="hover:text-[#16C7D9] transition-colors">
          {group?.name || 'Grupo'}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-[#9AA3AD]">Registrar actividad</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
          <span className="text-[#F2F4F6]">Registrar como </span>
          <span className="text-[#16C7D9]">vista</span>
        </h1>
        <p className="text-[#6B7280] text-lg">
          Documentá una nueva función del grupo y compartí tu primera impresión.
        </p>
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex flex-col lg:flex-row gap-10 pb-16">
        {/* Left Column - Form */}
        <div className="flex-1 space-y-10 order-2 lg:order-1">
          {/* Movie Search Section */}
          <section>
            <h2 className="text-sm font-semibold text-[#9AA3AD] uppercase tracking-wider mb-4">
              Buscar película
            </h2>

            {isLoadingMovie ? (
              <div className="flex items-center gap-4 p-4 bg-[#0B0D10]/80 backdrop-blur-sm border-2 border-[#1E2328] rounded-2xl">
                <div className="w-14 h-20 rounded-xl bg-[#1A2026] animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-[#1A2026] rounded animate-pulse mb-2" />
                  <div className="h-4 w-24 bg-[#1A2026] rounded animate-pulse" />
                </div>
              </div>
            ) : !selectedMovie ? (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A5568]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Escribí el nombre de la película..."
                  className="w-full pl-12 pr-4 py-4 bg-[#0B0D10] border-2 border-[#1E2328] rounded-2xl text-lg text-[#F2F4F6] placeholder-[#4A5568] focus:outline-none focus:border-[#16C7D9] focus:ring-4 focus:ring-[#16C7D9]/10 transition-all"
                />

                {/* Loading state */}
                {isSearching && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#14181D] border border-[#2A3038] rounded-2xl shadow-2xl shadow-black/50 z-50 p-6 text-center">
                    <div className="w-6 h-6 mx-auto border-2 border-[#16C7D9]/30 border-t-[#16C7D9] rounded-full animate-spin" />
                  </div>
                )}

                {/* Search Results Dropdown */}
                {!isSearching && showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#14181D] border border-[#2A3038] rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
                    {searchResults.map((movie) => (
                      <button
                        key={movie.id}
                        onClick={() => handleSelectMovie(movie)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-[#1A2026] transition-colors cursor-pointer border-b border-[#1E2328] last:border-b-0"
                      >
                        <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg bg-[#1A2026]">
                          {movie.poster ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w200${movie.poster}`}
                              alt={movie.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-5 h-5 text-[#4A5568]" />
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-[#F2F4F6]">{movie.title}</p>
                          <p className="text-sm text-[#6B7280]">{movie.year > 0 ? movie.year : 'Fecha desconocida'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results */}
                {!isSearching && showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#14181D] border border-[#2A3038] rounded-2xl shadow-2xl shadow-black/50 z-50 p-6 text-center">
                    <p className="text-[#6B7280]">No se encontraron películas</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-[#0B0D10]/80 backdrop-blur-sm border-2 border-[#16C7D9]/30 rounded-2xl">
                <div className="relative w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-lg shadow-black/30 bg-[#1A2026]">
                  {selectedMovie.poster ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster}`}
                      alt={selectedMovie.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-6 h-6 text-[#4A5568]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-[#F2F4F6]">{selectedMovie.title}</p>
                  <p className="text-sm text-[#6B7280]">{selectedMovie.year > 0 ? selectedMovie.year : 'Fecha desconocida'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#16C7D9]/10 border border-[#16C7D9]/30 rounded-full text-sm font-medium text-[#16C7D9]">
                    <Check className="w-4 h-4" />
                    Seleccionada
                  </span>
                  <button
                    onClick={clearSelectedMovie}
                    className="p-2 rounded-full hover:bg-[#1A2026] text-[#6B7280] hover:text-[#F2F4F6] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Date Section */}
          <section className="overflow-hidden">
            <h2 className="text-sm font-semibold text-[#9AA3AD] uppercase tracking-wider mb-4">
              Fecha de visualización
            </h2>
            <div className="relative max-w-full sm:max-w-72">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A5568] pointer-events-none z-10" />
              <input
                type="date"
                value={watchDate}
                onChange={(e) => setWatchDate(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#0B0D10]/80 backdrop-blur-sm border-2 border-[#1E2328] rounded-2xl text-[#F2F4F6] focus:outline-none focus:border-[#16C7D9] transition-colors cursor-pointer [color-scheme:dark] appearance-none"
              />
            </div>
          </section>

          {/* Function Type Section */}
          <section>
            <h2 className="text-sm font-semibold text-[#9AA3AD] uppercase tracking-wider mb-4">
              Tipo de función
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => setFunctionType('presencial')}
                className={cn(
                  'flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all cursor-pointer',
                  functionType === 'presencial'
                    ? 'bg-[#16C7D9] text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25'
                    : 'bg-[#0B0D10]/80 backdrop-blur-sm border-2 border-[#1E2328] text-[#6B7280] hover:border-[#2A3038] hover:text-[#9AA3AD]'
                )}
              >
                <MapPin className="w-5 h-5" />
                Presencial
              </button>
              <button
                onClick={() => setFunctionType('remota')}
                className={cn(
                  'flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all cursor-pointer',
                  functionType === 'remota'
                    ? 'bg-[#16C7D9] text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25'
                    : 'bg-[#0B0D10]/80 backdrop-blur-sm border-2 border-[#1E2328] text-[#6B7280] hover:border-[#2A3038] hover:text-[#9AA3AD]'
                )}
              >
                <Wifi className="w-5 h-5" />
                Remota
              </button>
            </div>
          </section>

          {/* Attendees Section */}
          <section>
            <h2 className="text-sm font-semibold text-[#9AA3AD] uppercase tracking-wider mb-4">
              ¿Quiénes estuvieron presentes?
            </h2>

            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8 px-6 rounded-2xl bg-[#0B0D10]/80 backdrop-blur-sm border-2 border-dashed border-[#1E2328]">
                <Users className="w-10 h-10 text-[#4A5568] mb-3" />
                <p className="text-sm text-[#6B7280]">
                  Los miembros del grupo aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {members.map((member) => {
                  const isSelected = selectedMembers.includes(member.id)
                  const displayName = member.display_name || member.email?.split('@')[0] || 'Usuario'
                  const initials = displayName.charAt(0).toUpperCase()
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className="group flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <div className="relative">
                        <div
                          className={cn(
                            'w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all overflow-hidden',
                            isSelected
                              ? 'ring-4 ring-[#16C7D9] shadow-lg shadow-[#16C7D9]/30'
                              : 'ring-2 ring-transparent group-hover:ring-[#2A3038]'
                          )}
                        >
                          {member.avatar_url ? (
                            <Image
                              src={member.avatar_url}
                              alt={displayName}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className={cn(
                              'w-full h-full flex items-center justify-center',
                              isSelected
                                ? 'bg-[#16C7D9] text-[#0B0D10]'
                                : 'bg-[#1A2026] text-[#4A5568] group-hover:bg-[#242A32] group-hover:text-[#6B7280]'
                            )}>
                              {initials}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center border-2 border-[#0B0D10] shadow-md">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium transition-colors text-center',
                          isSelected ? 'text-[#F2F4F6]' : 'text-[#6B7280]'
                        )}
                      >
                        {displayName}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Rating Section */}
          <section className="rounded-3xl bg-[#13161B]/90 backdrop-blur-sm border border-[#1E2328]/60 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#F2F4F6] mb-2">Tu primera impresión</h2>
            <p className="text-sm text-[#6B7280] mb-8">
              Esta calificación se compartirá automáticamente con el grupo al confirmar el registro.
            </p>

            {/* Star Rating */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="flex items-center gap-1 sm:gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-0.5 sm:p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95"
                  >
                    <Star
                      className={cn(
                        'w-6 h-6 sm:w-8 sm:h-8 transition-all duration-150',
                        (hoverRating || rating) >= star
                          ? 'text-[#D4AF37] fill-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]'
                          : 'text-[#2A3038] hover:text-[#3A4048]'
                      )}
                    />
                  </button>
                ))}
              </div>
              {(rating > 0 || hoverRating > 0) && (
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#D4AF37]">{hoverRating || rating}</span>
                  <span className="text-xl text-[#4A5568]">/ 10</span>
                </div>
              )}
            </div>

            {/* Quick Thoughts */}
            <div>
              <label className="block text-sm font-medium text-[#9AA3AD] mb-3">
                Pensamientos rápidos
              </label>
              <textarea
                value={quickThoughts}
                onChange={(e) => setQuickThoughts(e.target.value)}
                placeholder="¿Qué te pareció la fotografía, la historia, el clima de la película?"
                rows={4}
                className="w-full px-5 py-4 bg-[#0B0D10] border-2 border-[#1E2328] rounded-2xl text-[#F2F4F6] placeholder-[#4A5568] resize-none focus:outline-none focus:border-[#16C7D9] focus:ring-4 focus:ring-[#16C7D9]/10 transition-all"
              />
            </div>
          </section>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleConfirmRegistro}
              disabled={!selectedMovie || isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-[#16C7D9] hover:bg-[#14B8C9] disabled:bg-[#16C7D9]/50 disabled:cursor-not-allowed rounded-2xl text-lg font-bold text-[#0B0D10] transition-all shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0B0D10]/30 border-t-[#0B0D10] rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirmar registro
                </>
              )}
            </button>
            <Link
              href={`/grupos/${groupId}`}
              className="flex-1 sm:flex-none flex items-center justify-center px-10 py-4 bg-[#14181D]/80 backdrop-blur-sm hover:bg-[#1A2026] border-2 border-[#2A3038] hover:border-[#3A4048] rounded-2xl text-lg font-medium text-[#6B7280] hover:text-[#9AA3AD] transition-all"
            >
              Cancelar
            </Link>
          </div>
        </div>

        {/* Right Column - Movie Context */}
        <div className="w-full lg:w-[380px] flex-shrink-0 order-1 lg:order-2">
          <div className="lg:sticky lg:top-24">
            {selectedMovie ? (
              <div className="space-y-6">
                {/* Movie Poster Card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                  <div className="relative aspect-[2/3] bg-[#14181D]">
                    {selectedMovie.poster ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster}`}
                        alt={selectedMovie.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-16 h-16 text-[#4A5568]" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/20 to-transparent" />

                    {/* Movie Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl font-black text-[#F2F4F6] mb-2">{selectedMovie.title}</h3>

                      <div className="flex items-center gap-4 text-sm text-[#9AA3AD] mb-4">
                        <span>{selectedMovie.year > 0 ? selectedMovie.year : 'N/A'}</span>
                        {selectedMovie.duration !== 'N/A' && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-[#4A5568]" />
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {selectedMovie.duration}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Genres */}
                      {selectedMovie.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedMovie.genres.map((genre) => (
                            <span
                              key={genre}
                              className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-[#F2F4F6]"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics Cards */}
                {selectedMovie.rating > 0 && (
                  <div className="rounded-2xl bg-[#0B0D10]/80 backdrop-blur-sm border border-[#1E2328] p-5 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]" />
                      <span className="text-3xl font-black text-[#D4AF37]">{selectedMovie.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wider">Promedio TMDB</p>
                  </div>
                )}

                {/* Synopsis */}
                {selectedMovie.synopsis && selectedMovie.synopsis !== 'Sin sinopsis disponible.' && (
                  <p className="text-[#6B7280] text-sm leading-relaxed">{selectedMovie.synopsis}</p>
                )}
              </div>
            ) : (
              <div className="rounded-3xl bg-[#0B0D10]/80 backdrop-blur-sm border-2 border-dashed border-[#1E2328] p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#14181D] flex items-center justify-center">
                  <Search className="w-10 h-10 text-[#2A3038]" />
                </div>
                <h3 className="text-xl font-bold text-[#4A5568] mb-2">Buscá una película</h3>
                <p className="text-sm text-[#3A4048]">
                  Usá el buscador para encontrar la película que vieron juntos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
