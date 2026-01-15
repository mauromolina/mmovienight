'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Play,
  Star,
  ChevronDown,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Loader2,
  Film,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeaturedMovie } from '@/services/featured-movie'
import { AddToWatchlistButton } from './add-to-watchlist-button'

// Types for movie data
interface DiscoverMovie {
  id: number
  title: string
  year: number | null
  poster: string | null
  rating: number
  genre: string
}

interface AcclaimedMovie {
  id: number
  title: string
  year: number | null
  poster: string | null
  rating: number
  genre: string
  badge: string
}

interface NewReleaseMovie {
  id: number
  title: string
  year: number | null
  poster: string | null
  rating: number
  genre: string
  isNew: boolean
}

interface SearchResult {
  id: number
  title: string
  year: number | null
  poster_path: string | null
  vote_average: number
  genre_ids?: number[]
}

interface ExploreContentProps {
  featuredMovie: FeaturedMovie | null
  discoverMovies: DiscoverMovie[]
  criticallyAcclaimed: AcclaimedMovie[]
  newReleases: NewReleaseMovie[]
}

// Filter options
const genreOptions = [
  'Todos',
  'Acción',
  'Comedia',
  'Drama',
  'Terror',
  'Ciencia Ficción',
  'Romance',
  'Thriller',
  'Animación',
]
const yearOptions = ['Todos', '2024', '2023', '2022', '2021', '2020', '2010s', '2000s', 'Clásicos']
const platformOptions = [
  'Todas',
  'Netflix',
  'Prime Video',
  'Disney+',
  'HBO Max',
  'Apple TV+',
  'Paramount+',
]
const durationOptions = ['Todas', '< 90 min', '90-120 min', '120-150 min', '> 150 min']

// Genre ID to name mapping
const genreIdToName: Record<number, string> = {
  28: 'Acción',
  12: 'Aventura',
  16: 'Animación',
  35: 'Comedia',
  80: 'Crimen',
  99: 'Documental',
  18: 'Drama',
  10751: 'Familia',
  14: 'Fantasía',
  36: 'Historia',
  27: 'Terror',
  10402: 'Música',
  9648: 'Misterio',
  10749: 'Romance',
  878: 'Ciencia Ficción',
  10770: 'Película de TV',
  53: 'Thriller',
  10752: 'Bélica',
  37: 'Western',
}

// Helper to format runtime
function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
}

export default function ExploreContent({ featuredMovie, discoverMovies, criticallyAcclaimed, newReleases }: ExploreContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // Filter state
  const [selectedGenre, setSelectedGenre] = useState('Todos')
  const [selectedYear, setSelectedYear] = useState('Todos')
  const [selectedPlatform, setSelectedPlatform] = useState('Todas')
  const [selectedDuration, setSelectedDuration] = useState('Todas')
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [isFiltering, setIsFiltering] = useState(false)
  const [filterResults, setFilterResults] = useState<SearchResult[]>([])
  const [hasFiltered, setHasFiltered] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  // Carousel refs
  const discoverRef = useRef<HTMLDivElement>(null)
  const acclaimedRef = useRef<HTMLDivElement>(null)
  const releasesRef = useRef<HTMLDivElement>(null)

  // Update URL with current state
  const updateURL = useCallback((params: {
    q?: string
    genre?: string
    year?: string
    duration?: string
    platform?: string
    page?: number
  }) => {
    const url = new URLSearchParams()
    if (params.q) url.set('q', params.q)
    if (params.genre && params.genre !== 'Todos') url.set('genre', params.genre)
    if (params.year && params.year !== 'Todos') url.set('year', params.year)
    if (params.duration && params.duration !== 'Todas') url.set('duration', params.duration)
    if (params.platform && params.platform !== 'Todas') url.set('platform', params.platform)
    if (params.page && params.page > 1) url.set('page', params.page.toString())

    const queryString = url.toString()
    router.replace(queryString ? `/explorar?${queryString}` : '/explorar', { scroll: false })
  }, [router])

  // Restore state from URL on mount
  useEffect(() => {
    const q = searchParams.get('q') || ''
    const genre = searchParams.get('genre') || 'Todos'
    const year = searchParams.get('year') || 'Todos'
    const duration = searchParams.get('duration') || 'Todas'
    const platform = searchParams.get('platform') || 'Todas'
    const page = parseInt(searchParams.get('page') || '1', 10)

    setSearchQuery(q)
    setSelectedGenre(genre)
    setSelectedYear(year)
    setSelectedDuration(duration)
    setSelectedPlatform(platform)
    setCurrentPage(page)
    setIsInitialized(true)
  }, [searchParams])

  // Scroll carousel function
  const scrollCarousel = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right'
  ) => {
    if (ref.current) {
      const scrollAmount = 300
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // Execute search/filter on initialization if URL has params
  useEffect(() => {
    if (!isInitialized) return

    const q = searchParams.get('q')
    const hasFilters =
      searchParams.get('genre') ||
      searchParams.get('year') ||
      searchParams.get('duration') ||
      searchParams.get('platform')

    if (q) {
      // Execute search
      executeSearch(q)
    } else if (hasFilters) {
      // Execute filter
      executeFilter(parseInt(searchParams.get('page') || '1', 10))
    }
  }, [isInitialized]) // eslint-disable-line react-hooks/exhaustive-deps

  // Execute search (internal function)
  const executeSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    setHasFiltered(false)

    try {
      const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSearchResults(data.results || [])
      setTotalResults(data.total_results || 0)
    } catch (error) {
      console.error('Error searching:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Search function
  const handleSearch = useCallback(async (query: string) => {
    updateURL({ q: query })
    await executeSearch(query)
  }, [updateURL])

  // Execute filter (internal function)
  const executeFilter = async (page: number = 1, genre?: string, year?: string, duration?: string, platform?: string) => {
    const g = genre ?? selectedGenre
    const y = year ?? selectedYear
    const d = duration ?? selectedDuration
    const p = platform ?? selectedPlatform

    // Check if any filter is active
    const hasActiveFilters =
      g !== 'Todos' ||
      y !== 'Todos' ||
      d !== 'Todas' ||
      p !== 'Todas'

    if (!hasActiveFilters) {
      setFilterResults([])
      setHasFiltered(false)
      return
    }

    setIsFiltering(true)
    setHasFiltered(true)
    setHasSearched(false)
    setSearchQuery('')
    setCurrentPage(page)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        genre: g,
        year: y,
        duration: d,
        platform: p,
      })

      const response = await fetch(`/api/movies/discover?${params}`)
      const data = await response.json()
      setFilterResults(data.results || [])
      setTotalResults(data.total_results || 0)
      setTotalPages(data.total_pages || 0)
    } catch (error) {
      console.error('Error filtering:', error)
      setFilterResults([])
    } finally {
      setIsFiltering(false)
    }
  }

  // Filter function
  const handleApplyFilters = useCallback(async (page: number = 1) => {
    updateURL({
      genre: selectedGenre,
      year: selectedYear,
      duration: selectedDuration,
      platform: selectedPlatform,
      page,
    })
    await executeFilter(page)
  }, [selectedGenre, selectedYear, selectedDuration, selectedPlatform, updateURL])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSelectedGenre('Todos')
    setSelectedYear('Todos')
    setSelectedPlatform('Todas')
    setSelectedDuration('Todas')
    setFilterResults([])
    setHasFiltered(false)
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
    setCurrentPage(1)
    setTotalResults(0)
    setTotalPages(0)
    // Clear URL
    router.replace('/explorar', { scroll: false })
  }, [router])

  // Check if showing results
  const showingResults = hasSearched || hasFiltered
  const results = hasSearched ? searchResults : filterResults
  const isLoading = isSearching || isFiltering

  return (
    <div className="animate-fade-in pb-12">
      {/* Hero Section - Featured Movie of the Week */}
      {featuredMovie && (
        <div className="relative z-30 w-screen left-1/2 -translate-x-1/2 -mt-8 mb-8">
          {/* Background Image - Cinematic Backdrop */}
          <div className="absolute inset-0">
            <Image
              src={`https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`}
              alt={featuredMovie.title}
              fill
              className="object-cover object-center"
              priority
            />
            {/* Gradient overlays for cinematic effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D10] via-[#0B0D10]/80 to-[#0B0D10]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/40 to-transparent" />
            <div className="absolute inset-0 bg-[#0B0D10]/20" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-14 sm:pb-20">
            <div className="max-w-7xl mx-auto">
              <div className="max-w-2xl">
                {/* Editorial Badge */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="px-4 py-1.5 bg-[#D4AF37] rounded-full text-xs font-bold text-[#0B0D10] uppercase tracking-wider shadow-lg">
                    Recomendación de la semana
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#F2F4F6] mb-3 leading-tight drop-shadow-lg">
                  {featuredMovie.title}
                </h1>

                {/* Tagline */}
                {featuredMovie.tagline && (
                  <p className="text-lg sm:text-xl text-[#16C7D9] italic mb-4 drop-shadow">
                    &ldquo;{featuredMovie.tagline}&rdquo;
                  </p>
                )}

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                  {/* Rating */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/20 backdrop-blur-sm rounded-lg border border-[#D4AF37]/30">
                    <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                    <span className="font-bold text-[#D4AF37]">{featuredMovie.rating.toFixed(1)}</span>
                  </div>

                  {/* Year */}
                  {featuredMovie.year && (
                    <span className="text-[#9AA3AD] font-medium">{featuredMovie.year}</span>
                  )}

                  {/* Runtime */}
                  {featuredMovie.runtime && (
                    <>
                      <span className="text-[#4A5568]">·</span>
                      <span className="flex items-center gap-1 text-[#9AA3AD]">
                        <Clock className="w-4 h-4" />
                        {formatRuntime(featuredMovie.runtime)}
                      </span>
                    </>
                  )}

                  {/* Director */}
                  {featuredMovie.director && (
                    <>
                      <span className="text-[#4A5568]">·</span>
                      <span className="text-[#9AA3AD]">Dir. {featuredMovie.director}</span>
                    </>
                  )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {featuredMovie.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg text-xs font-medium text-[#F2F4F6] border border-white/10"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Synopsis */}
                <p className="text-sm sm:text-base text-[#C4C9CF] mb-6 leading-relaxed max-w-xl line-clamp-3">
                  {featuredMovie.synopsis}
                </p>

                {/* Streaming Platforms */}
                {featuredMovie.streamingProviders.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-3">
                      Disponible en streaming
                    </p>
                    <div className="flex items-center gap-3">
                      {featuredMovie.streamingProviders.map((provider) => (
                        <div
                          key={provider.name}
                          className="relative group"
                          title={provider.name}
                        >
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm ring-2 ring-white/20 group-hover:ring-[#16C7D9]/60 transition-all shadow-lg">
                            <Image
                              src={`https://image.tmdb.org/t/p/original${provider.logo}`}
                              alt={provider.name}
                              width={44}
                              height={44}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link
                    href={`/pelicula/${featuredMovie.id}`}
                    className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#16C7D9] hover:bg-[#14B8C9] rounded-xl text-sm sm:text-base font-semibold text-[#0B0D10] transition-all shadow-lg shadow-[#16C7D9]/30 hover:shadow-[#16C7D9]/50"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Ver detalles
                  </Link>
                  <AddToWatchlistButton
                    tmdbId={featuredMovie.id}
                    movieTitle={featuredMovie.title}
                    variant="hero"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="relative z-20 w-screen left-1/2 -translate-x-1/2 -mt-2 mb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-[#14181D] border border-[#2A3038] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery)
                }
              }}
              placeholder="Buscar películas por nombre..."
              className="w-full pl-12 pr-24 py-3 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#16C7D9] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults([])
                  setHasSearched(false)
                  // Clear search from URL but keep filters if any
                  if (hasFiltered) {
                    updateURL({
                      genre: selectedGenre,
                      year: selectedYear,
                      duration: selectedDuration,
                      platform: selectedPlatform,
                      page: currentPage,
                    })
                  } else {
                    router.replace('/explorar', { scroll: false })
                  }
                }}
                className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-[#F2F4F6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSearch(searchQuery)}
              disabled={!searchQuery.trim() || isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#16C7D9] hover:bg-[#14B8C9] disabled:bg-[#2A3038] disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-[#0B0D10] disabled:text-[#6B7280] transition-all"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Genre Filter */}
            <div className="relative flex-1">
              <button
                onClick={() => setOpenFilter(openFilter === 'genre' ? null : 'genre')}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-sm text-[#F2F4F6] hover:border-[#3A4048] transition-colors cursor-pointer"
              >
                <span className="text-[#6B7280]">Género:</span>
                <span className={cn('truncate', selectedGenre !== 'Todos' && 'text-[#16C7D9]')}>
                  {selectedGenre}
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-[#6B7280] transition-transform flex-shrink-0',
                    openFilter === 'genre' && 'rotate-180'
                  )}
                />
              </button>
              {openFilter === 'genre' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#14181D] border border-[#2A3038] rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  {genreOptions.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => {
                        setSelectedGenre(genre)
                        setOpenFilter(null)
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer',
                        selectedGenre === genre
                          ? 'bg-[#16C7D9]/10 text-[#16C7D9]'
                          : 'text-[#9AA3AD] hover:bg-[#1A2026] hover:text-[#F2F4F6]'
                      )}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Year Filter */}
            <div className="relative flex-1">
              <button
                onClick={() => setOpenFilter(openFilter === 'year' ? null : 'year')}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-sm text-[#F2F4F6] hover:border-[#3A4048] transition-colors cursor-pointer"
              >
                <span className="text-[#6B7280]">Año:</span>
                <span className={cn('truncate', selectedYear !== 'Todos' && 'text-[#16C7D9]')}>
                  {selectedYear}
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-[#6B7280] transition-transform flex-shrink-0',
                    openFilter === 'year' && 'rotate-180'
                  )}
                />
              </button>
              {openFilter === 'year' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#14181D] border border-[#2A3038] rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  {yearOptions.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year)
                        setOpenFilter(null)
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer',
                        selectedYear === year
                          ? 'bg-[#16C7D9]/10 text-[#16C7D9]'
                          : 'text-[#9AA3AD] hover:bg-[#1A2026] hover:text-[#F2F4F6]'
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Duration Filter */}
            <div className="relative flex-1">
              <button
                onClick={() => setOpenFilter(openFilter === 'duration' ? null : 'duration')}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-sm text-[#F2F4F6] hover:border-[#3A4048] transition-colors cursor-pointer"
              >
                <span className="text-[#6B7280]">Duración:</span>
                <span className={cn('truncate', selectedDuration !== 'Todas' && 'text-[#16C7D9]')}>
                  {selectedDuration}
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-[#6B7280] transition-transform flex-shrink-0',
                    openFilter === 'duration' && 'rotate-180'
                  )}
                />
              </button>
              {openFilter === 'duration' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#14181D] border border-[#2A3038] rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  {durationOptions.map((duration) => (
                    <button
                      key={duration}
                      onClick={() => {
                        setSelectedDuration(duration)
                        setOpenFilter(null)
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer',
                        selectedDuration === duration
                          ? 'bg-[#16C7D9]/10 text-[#16C7D9]'
                          : 'text-[#9AA3AD] hover:bg-[#1A2026] hover:text-[#F2F4F6]'
                      )}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Filter */}
            <div className="relative flex-1">
              <button
                onClick={() => setOpenFilter(openFilter === 'platform' ? null : 'platform')}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-[#0B0D10] border border-[#2A3038] rounded-xl text-sm text-[#F2F4F6] hover:border-[#3A4048] transition-colors cursor-pointer"
              >
                <span className="text-[#6B7280]">Plataforma:</span>
                <span className={cn('truncate', selectedPlatform !== 'Todas' && 'text-[#16C7D9]')}>
                  {selectedPlatform}
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-[#6B7280] transition-transform flex-shrink-0',
                    openFilter === 'platform' && 'rotate-180'
                  )}
                />
              </button>
              {openFilter === 'platform' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#14181D] border border-[#2A3038] rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  {platformOptions.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => {
                        setSelectedPlatform(platform)
                        setOpenFilter(null)
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer',
                        selectedPlatform === platform
                          ? 'bg-[#16C7D9]/10 text-[#16C7D9]'
                          : 'text-[#9AA3AD] hover:bg-[#1A2026] hover:text-[#F2F4F6]'
                      )}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Apply Button */}
            <button
              onClick={() => handleApplyFilters(1)}
              disabled={isFiltering}
              className="px-6 py-2.5 bg-[#16C7D9] hover:bg-[#14B8C9] disabled:bg-[#2A3038] rounded-xl text-sm font-semibold text-[#0B0D10] disabled:text-[#6B7280] transition-all cursor-pointer disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center gap-2"
            >
              {isFiltering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
            </button>
          </div>

          {/* Active filters indicator */}
          {showingResults && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2A3038]">
              <p className="text-sm text-[#9AA3AD]">
                {hasSearched ? (
                  <>
                    Resultados para &quot;<span className="text-[#F2F4F6]">{searchQuery}</span>&quot;
                  </>
                ) : (
                  'Resultados filtrados'
                )}
                <span className="ml-2 text-[#6B7280]">
                  ({totalResults.toLocaleString()} películas)
                </span>
              </p>
              <button
                onClick={handleClearFilters}
                className="text-sm text-[#16C7D9] hover:text-[#3DD4E4] transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Sections */}
      <div className="w-screen left-1/2 -translate-x-1/2 relative px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
          {/* Search/Filter Results */}
          {showingResults && (
            <section>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-[#16C7D9] animate-spin mb-4" />
                  <p className="text-[#6B7280]">Buscando películas...</p>
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {results.map((movie) => (
                      <Link
                        key={movie.id}
                        href={`/pelicula/${movie.id}`}
                        className="group"
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 border border-[#1A2026] group-hover:border-[#2A3038] transition-all group-hover:shadow-xl group-hover:shadow-black/30 group-hover:-translate-y-1">
                          {movie.poster_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                              alt={movie.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#1A2026] flex items-center justify-center">
                              <Film className="w-8 h-8 text-[#3A4048]" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-[#F2F4F6] line-clamp-1 group-hover:text-[#16C7D9] transition-colors mb-1">
                          {movie.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#6B7280]">
                            {movie.genre_ids?.[0] ? genreIdToName[movie.genre_ids[0]] || '' : ''}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                            <span className="text-xs font-medium text-[#D4AF37]">
                              {movie.vote_average.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  {hasFiltered && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => handleApplyFilters(currentPage - 1)}
                        disabled={currentPage === 1 || isFiltering}
                        className="px-4 py-2 bg-[#14181D] border border-[#2A3038] rounded-lg text-sm text-[#9AA3AD] hover:text-[#F2F4F6] hover:border-[#3A4048] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Anterior
                      </button>
                      <span className="px-4 py-2 text-sm text-[#9AA3AD]">
                        Página {currentPage} de {Math.min(totalPages, 500)}
                      </span>
                      <button
                        onClick={() => handleApplyFilters(currentPage + 1)}
                        disabled={currentPage >= Math.min(totalPages, 500) || isFiltering}
                        className="px-4 py-2 bg-[#14181D] border border-[#2A3038] rounded-lg text-sm text-[#9AA3AD] hover:text-[#F2F4F6] hover:border-[#3A4048] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <Film className="w-12 h-12 text-[#3A4048] mb-4" />
                  <h3 className="text-lg font-bold text-[#F2F4F6] mb-2">No se encontraron películas</h3>
                  <p className="text-sm text-[#6B7280] mb-4">
                    Intenta con otros términos de búsqueda o filtros
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-[#16C7D9] hover:text-[#3DD4E4] transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Default content - only show when not searching/filtering */}
          {!showingResults && (
            <>
              {/* Discover */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    <span className="text-[#F2F4F6]">Descubre </span>
                    <span className="text-[#16C7D9]">películas</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollCarousel(discoverRef, 'left')}
                      className="w-8 h-8 rounded-full bg-[#0B0D10] border border-[#2A3038] text-white hover:bg-[#1A2026] hover:border-[#3A4048] transition-all cursor-pointer flex items-center justify-center"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollCarousel(discoverRef, 'right')}
                      className="w-8 h-8 rounded-full bg-[#0B0D10] border border-[#2A3038] text-white hover:bg-[#1A2026] hover:border-[#3A4048] transition-all cursor-pointer flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  ref={discoverRef}
                  className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
                >
                  {discoverMovies.map((movie) => (
                    <Link
                      key={movie.id}
                      href={`/pelicula/${movie.id}`}
                      className="flex-shrink-0 w-36 sm:w-44 group"
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 border border-[#1A2026] group-hover:border-[#2A3038] transition-all group-hover:shadow-xl group-hover:shadow-black/30 group-hover:-translate-y-1">
                        {movie.poster ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w500${movie.poster}`}
                            alt={movie.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#1A2026] flex items-center justify-center">
                            <Film className="w-8 h-8 text-[#3A4048]" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-[#F2F4F6] line-clamp-1 group-hover:text-[#16C7D9] transition-colors mb-1">
                        {movie.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6B7280]">{movie.genre}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                          <span className="text-xs font-medium text-[#D4AF37]">{movie.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Critically Acclaimed */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    <span className="text-[#F2F4F6]">Aclamadas por </span>
                    <span className="text-[#16C7D9]">la crítica</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollCarousel(acclaimedRef, 'left')}
                      className="w-8 h-8 rounded-full bg-[#0B0D10] border border-[#2A3038] text-white hover:bg-[#1A2026] hover:border-[#3A4048] transition-all cursor-pointer flex items-center justify-center"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollCarousel(acclaimedRef, 'right')}
                      className="w-8 h-8 rounded-full bg-[#0B0D10] border border-[#2A3038] text-white hover:bg-[#1A2026] hover:border-[#3A4048] transition-all cursor-pointer flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  ref={acclaimedRef}
                  className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
                >
                  {criticallyAcclaimed.map((movie) => (
                    <Link
                      key={movie.id}
                      href={`/pelicula/${movie.id}`}
                      className="flex-shrink-0 w-36 sm:w-44 group"
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 border border-[#1A2026] group-hover:border-[#2A3038] transition-all group-hover:shadow-xl group-hover:shadow-black/30 group-hover:-translate-y-1">
                        {movie.poster ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w500${movie.poster}`}
                            alt={movie.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#1A2026] flex items-center justify-center">
                            <span className="text-[#6B7280] text-xs text-center px-2">Sin imagen</span>
                          </div>
                        )}
                        {/* Badge */}
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#D4AF37] rounded-lg text-[10px] sm:text-xs font-bold text-[#0B0D10]">
                            <Award className="w-3 h-3" />
                            {movie.badge}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold text-[#F2F4F6] line-clamp-1 group-hover:text-[#16C7D9] transition-colors mb-1">
                        {movie.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6B7280]">{movie.genre}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                          <span className="text-xs font-medium text-[#D4AF37]">{movie.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* New Releases */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    <span className="text-[#F2F4F6]">Nuevos </span>
                    <span className="text-[#16C7D9]">estrenos</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollCarousel(releasesRef, 'left')}
                      className="w-8 h-8 rounded-full bg-[#0B0D10] border border-[#2A3038] text-white hover:bg-[#1A2026] hover:border-[#3A4048] transition-all cursor-pointer flex items-center justify-center"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollCarousel(releasesRef, 'right')}
                      className="w-8 h-8 rounded-full bg-[#0B0D10] border border-[#2A3038] text-white hover:bg-[#1A2026] hover:border-[#3A4048] transition-all cursor-pointer flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  ref={releasesRef}
                  className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
                >
                  {newReleases.map((movie) => (
                    <Link
                      key={movie.id}
                      href={`/pelicula/${movie.id}`}
                      className="flex-shrink-0 w-36 sm:w-44 group"
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 border border-[#1A2026] group-hover:border-[#2A3038] transition-all group-hover:shadow-xl group-hover:shadow-black/30 group-hover:-translate-y-1">
                        {movie.poster ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w500${movie.poster}`}
                            alt={movie.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#1A2026] flex items-center justify-center">
                            <span className="text-[#6B7280] text-xs text-center px-2">Sin imagen</span>
                          </div>
                        )}
                        {/* New badge */}
                        {movie.isNew && (
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#16C7D9] rounded-lg text-[10px] sm:text-xs font-bold text-[#0B0D10]">
                              <Sparkles className="w-3 h-3" />
                              Estreno
                            </span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-[#F2F4F6] line-clamp-1 group-hover:text-[#16C7D9] transition-colors mb-1">
                        {movie.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6B7280]">{movie.genre}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                          <span className="text-xs font-medium text-[#D4AF37]">{movie.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
