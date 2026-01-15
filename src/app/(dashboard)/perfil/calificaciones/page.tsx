'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Star,
  Film,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  MessageCircle,
  ThumbsUp,
  Loader2,
  Filter,
  Search,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Rating {
  id: string
  score: number
  comment: string | null
  created_at: string
  group_id: string
  movie_id: string
  movie: {
    id: string
    tmdb_id: number
    title: string
    year: number | null
    poster_path: string | null
  }
  group: {
    id: string
    name: string
  }
}

interface UserGroup {
  id: string
  name: string
}

type ScoreFilter = 'all' | '10' | '8+' | '6+' | '4-'

const scoreFilters: { value: ScoreFilter; label: string; min?: number; max?: number }[] = [
  { value: 'all', label: 'Todas' },
  { value: '10', label: '10 estrellas', min: 10, max: 10 },
  { value: '8+', label: '8 o más', min: 8 },
  { value: '6+', label: '6 o más', min: 6 },
  { value: '4-', label: 'Menos de 6', max: 5 },
]

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffMins < 1) return 'ahora'
  if (diffMins < 60) return `hace ${diffMins} min`
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  if (diffWeeks === 1) return 'hace 1 semana'
  if (diffWeeks < 4) return `hace ${diffWeeks} semanas`
  if (diffMonths === 1) return 'hace 1 mes'
  if (diffMonths < 12) return `hace ${diffMonths} meses`
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function RatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Stats
  const [totalRatings, setTotalRatings] = useState(0)
  const [averageScore, setAverageScore] = useState(0)

  // Filters
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedScore, setSelectedScore] = useState<ScoreFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showGroupDropdown, setShowGroupDropdown] = useState(false)
  const [showScoreDropdown, setShowScoreDropdown] = useState(false)

  const ITEMS_PER_PAGE = 10

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch ratings
  const fetchRatings = async (page: number = 1) => {
    setIsLoading(true)

    try {
      const offset = (page - 1) * ITEMS_PER_PAGE
      let url = `/api/ratings?limit=${ITEMS_PER_PAGE}&offset=${offset}`

      // Apply filters
      if (selectedGroup !== 'all') {
        url += `&groupId=${selectedGroup}`
      }

      const scoreFilter = scoreFilters.find((f) => f.value === selectedScore)
      if (scoreFilter?.min !== undefined) {
        url += `&minScore=${scoreFilter.min}`
      }
      if (scoreFilter?.max !== undefined) {
        url += `&maxScore=${scoreFilter.max}`
      }

      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setRatings(data.ratings)
        setTotal(data.total)
        setHasMore(data.hasMore)
        setTotalRatings(data.stats.totalRatings)
        setAverageScore(data.stats.averageScore)
        setUserGroups(data.userGroups)
      }
    } catch (error) {
      console.error('Error fetching ratings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch and refetch on filter/page change
  useEffect(() => {
    fetchRatings(currentPage)
  }, [currentPage, selectedGroup, selectedScore, debouncedSearch])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedGroup, selectedScore, debouncedSearch])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="animate-fade-in pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link
          href="/perfil"
          className="text-[#6B7280] hover:text-[#F2F4F6] transition-colors"
        >
          Perfil
        </Link>
        <span className="text-[#4A5568]">/</span>
        <span className="text-[#F2F4F6]">Mis Calificaciones</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        {/* Title & Description */}
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F2F4F6] mb-2">
            Historial de <span className="text-[#D4AF37]">Calificaciones</span>
          </h1>
          <p className="text-sm sm:text-base text-[#6B7280] max-w-xl">
            Un registro completo de todas las películas que calificaste en tus círculos de cine.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 rounded-xl bg-[#14181D] border border-[#2A3038]">
            <p className="text-2xl sm:text-3xl font-black text-[#16C7D9]">
              {isLoading ? '-' : totalRatings}
            </p>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide">Calificaciones</p>
          </div>
          <div className="px-5 py-3 rounded-xl bg-[#14181D] border border-[#2A3038]">
            <p className="text-2xl sm:text-3xl font-black text-[#D4AF37]">
              {isLoading ? '-' : averageScore.toFixed(1)}
            </p>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide">Promedio</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-[#1E2328]">
        {/* Search Input */}
        <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar película..."
            className="w-full pl-9 pr-9 py-2 bg-[#14181D] border border-[#2A3038] rounded-xl text-sm text-[#F2F4F6] placeholder-[#4A5568] focus:outline-none focus:border-[#16C7D9] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5568] hover:text-[#F2F4F6] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <Filter className="w-4 h-4" />
          <span>Filtros:</span>
        </div>

        {/* Score Filter */}
        <div className="relative">
          <button
            onClick={() => {
              setShowScoreDropdown(!showScoreDropdown)
              setShowGroupDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#14181D] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all cursor-pointer"
          >
            <Star className="w-4 h-4 text-[#D4AF37]" />
            <span>{scoreFilters.find((f) => f.value === selectedScore)?.label}</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', showScoreDropdown && 'rotate-180')} />
          </button>

          {showScoreDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowScoreDropdown(false)} />
              <div className="absolute left-0 top-full mt-2 w-48 py-2 bg-[#14181D] border border-[#2A3038] rounded-xl shadow-xl z-50">
                {scoreFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setSelectedScore(filter.value)
                      setShowScoreDropdown(false)
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer',
                      selectedScore === filter.value
                        ? 'text-[#D4AF37] bg-[#D4AF37]/10'
                        : 'text-[#9AA3AD] hover:text-[#F2F4F6] hover:bg-[#1A2026]'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Group Filter */}
        <div className="relative">
          <button
            onClick={() => {
              setShowGroupDropdown(!showGroupDropdown)
              setShowScoreDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#14181D] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-[#16C7D9]" />
            <span className="max-w-[120px] truncate">
              {selectedGroup === 'all'
                ? 'Todos los círculos'
                : userGroups.find((g) => g.id === selectedGroup)?.name || 'Círculo'}
            </span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', showGroupDropdown && 'rotate-180')} />
          </button>

          {showGroupDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowGroupDropdown(false)} />
              <div className="absolute left-0 top-full mt-2 w-56 py-2 bg-[#14181D] border border-[#2A3038] rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedGroup('all')
                    setShowGroupDropdown(false)
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer',
                    selectedGroup === 'all'
                      ? 'text-[#16C7D9] bg-[#16C7D9]/10'
                      : 'text-[#9AA3AD] hover:text-[#F2F4F6] hover:bg-[#1A2026]'
                  )}
                >
                  Todos los círculos
                </button>
                {userGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroup(group.id)
                      setShowGroupDropdown(false)
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer truncate',
                      selectedGroup === group.id
                        ? 'text-[#16C7D9] bg-[#16C7D9]/10'
                        : 'text-[#9AA3AD] hover:text-[#F2F4F6] hover:bg-[#1A2026]'
                    )}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Active filters indicator */}
        {(selectedScore !== 'all' || selectedGroup !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedScore('all')
              setSelectedGroup('all')
              setSearchQuery('')
            }}
            className="text-sm text-[#6B7280] hover:text-[#EF4444] transition-colors cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#16C7D9] animate-spin" />
        </div>
      ) : ratings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 w-24 h-24 rounded-full bg-[#D4AF37]/10 blur-xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#1A2026] to-[#14181D] border-2 border-[#2A3038] flex items-center justify-center">
              <Star className="w-12 h-12 text-[#4A5568]" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-[#F2F4F6] mb-2">
            {selectedScore !== 'all' || selectedGroup !== 'all' || debouncedSearch
              ? 'Sin resultados'
              : 'Sin calificaciones todavía'}
          </h3>
          <p className="text-sm text-[#6B7280] max-w-sm mb-6">
            {debouncedSearch
              ? `No se encontraron calificaciones para "${debouncedSearch}".`
              : selectedScore !== 'all' || selectedGroup !== 'all'
              ? 'No hay calificaciones que coincidan con los filtros seleccionados.'
              : 'Unite a un círculo y calificá películas para ver tu historial acá.'}
          </p>
          {selectedScore === 'all' && selectedGroup === 'all' && !debouncedSearch && (
            <Link
              href="/grupos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] hover:bg-[#C9A432] rounded-xl text-sm font-bold text-[#0B0D10] transition-all shadow-lg shadow-[#D4AF37]/20"
            >
              <Users className="w-5 h-5" />
              Ver mis círculos
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Ratings List */}
          <div className="space-y-4">
            {ratings.map((rating) => (
              <Link
                key={rating.id}
                href={`/grupos/${rating.group.id}/pelicula/${rating.movie.id}`}
                className="block group"
              >
                <div className="flex gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-[#14181D] border border-[#1E2328] hover:border-[#2A3038] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30">
                  {/* Poster */}
                  <div className="relative w-16 sm:w-20 md:w-24 aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0 bg-[#1A2026]">
                    {rating.movie.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${rating.movie.poster_path}`}
                        alt={rating.movie.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-8 h-8 text-[#4A5568]" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Header: Title, Rating, Date */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-[#F2F4F6] group-hover:text-[#16C7D9] transition-colors line-clamp-1">
                          {rating.movie.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#6B7280]">
                          {rating.movie.year || 'Año desconocido'}
                        </p>
                      </div>
                      <span className="text-xs text-[#4A5568] whitespace-nowrap flex-shrink-0">
                        {formatRelativeDate(rating.created_at)}
                      </span>
                    </div>

                    {/* Rating with stars */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'w-4 h-4 sm:w-5 sm:h-5',
                              star <= Math.round(rating.score / 2)
                                ? 'text-[#D4AF37] fill-[#D4AF37]'
                                : 'text-[#3A4048]'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-[#D4AF37]">
                        {rating.score.toFixed(1)}
                      </span>
                    </div>

                    {/* Group Badge */}
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#16C7D9]/10 text-xs font-medium text-[#16C7D9]">
                        <Users className="w-3 h-3" />
                        {rating.group.name}
                      </span>
                    </div>

                    {/* Comment */}
                    {rating.comment ? (
                      <p className="text-sm text-[#9AA3AD] line-clamp-2 mb-3">
                        &ldquo;{rating.comment}&rdquo;
                      </p>
                    ) : (
                      <p className="text-xs text-[#4A5568] italic mb-3">
                        Sin reseña escrita
                      </p>
                    )}

                    {/* Social indicators - placeholder for future */}
                    <div className="flex items-center gap-4 mt-auto">
                      <div className="flex items-center gap-1.5 text-[#4A5568]">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="text-xs">0</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#4A5568]">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-[#14181D] border border-[#2A3038] text-[#6B7280] hover:text-[#F2F4F6] hover:border-[#3A4048] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && handlePageChange(page)}
                    disabled={page === '...'}
                    className={cn(
                      'min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all',
                      page === currentPage
                        ? 'bg-[#16C7D9] text-[#0B0D10]'
                        : page === '...'
                        ? 'text-[#4A5568] cursor-default'
                        : 'bg-[#14181D] border border-[#2A3038] text-[#9AA3AD] hover:text-[#F2F4F6] hover:border-[#3A4048] cursor-pointer'
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-[#14181D] border border-[#2A3038] text-[#6B7280] hover:text-[#F2F4F6] hover:border-[#3A4048] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Back to Profile Link */}
      <div className="mt-12 pt-6 border-t border-[#1E2328]">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#F2F4F6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al perfil
        </Link>
      </div>
    </div>
  )
}
