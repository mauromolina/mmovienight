'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Heart,
  Film,
  ChevronDown,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FavoriteMovie {
  id: string
  created_at: string
  movie: {
    id: string
    tmdb_id: number
    title: string
    year: number | null
    poster_path: string | null
  }
}

type SortOption = 'recent' | 'year' | 'title'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Agregadas recientemente' },
  { value: 'year', label: 'Por año' },
  { value: 'title', label: 'Por título' },
]

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  const ITEMS_PER_PAGE = 18

  // Fetch favorites
  const fetchFavorites = async (offset: number = 0, append: boolean = false) => {
    if (offset === 0) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const response = await fetch(
        `/api/favorites?limit=${ITEMS_PER_PAGE}&offset=${offset}&sortBy=${sortBy}`
      )
      if (response.ok) {
        const data = await response.json()
        if (append) {
          setFavorites((prev) => [...prev, ...data.favorites])
        } else {
          setFavorites(data.favorites)
        }
        setTotal(data.total)
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Initial fetch and refetch on sort change
  useEffect(() => {
    fetchFavorites(0, false)
  }, [sortBy])

  // Load more
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchFavorites(favorites.length, true)
    }
  }

  // Remove from favorites
  const handleRemoveFavorite = async (movieId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setRemovingIds((prev) => new Set(prev).add(movieId))

    try {
      const response = await fetch(`/api/favorites?movieId=${movieId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFavorites((prev) => prev.filter((f) => f.movie.id !== movieId))
        setTotal((prev) => prev - 1)
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    } finally {
      setRemovingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(movieId)
        return newSet
      })
    }
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
        <span className="text-[#F2F4F6]">Favoritas</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        {/* Title & Count */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F2F4F6] mb-2">
            Películas <span className="text-[#D4AF37]">Favoritas</span>
          </h1>
          <p className="text-sm sm:text-base text-[#6B7280]">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando...
              </span>
            ) : (
              `${total} ${total === 1 ? 'película guardada' : 'películas guardadas'}`
            )}
          </p>
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#14181D] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all cursor-pointer"
            >
              <span className="hidden sm:inline">
                {sortOptions.find((o) => o.value === sortBy)?.label}
              </span>
              <span className="sm:hidden">Ordenar</span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform',
                  showSortDropdown && 'rotate-180'
                )}
              />
            </button>

            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSortDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-[#14181D] border border-[#2A3038] rounded-xl shadow-xl z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value)
                        setShowSortDropdown(false)
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer',
                        sortBy === option.value
                          ? 'text-[#16C7D9] bg-[#16C7D9]/10'
                          : 'text-[#9AA3AD] hover:text-[#F2F4F6] hover:bg-[#1A2026]'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filter Button (for future use) */}
          <button
            className="p-2.5 bg-[#14181D] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-[#6B7280] hover:text-[#F2F4F6] transition-all cursor-pointer"
            title="Filtros (próximamente)"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#16C7D9] animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 w-24 h-24 rounded-full bg-[#D4AF37]/10 blur-xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#1A2026] to-[#14181D] border-2 border-[#2A3038] flex items-center justify-center">
              <Heart className="w-12 h-12 text-[#4A5568]" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-[#F2F4F6] mb-2">
            Sin películas favoritas
          </h3>
          <p className="text-sm text-[#6B7280] max-w-sm mb-6">
            Explorá películas y marcá tus favoritas tocando el ícono de corazón para
            verlas acá.
          </p>
          <Link
            href="/explorar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] hover:bg-[#C9A432] rounded-xl text-sm font-bold text-[#0B0D10] transition-all shadow-lg shadow-[#D4AF37]/20"
          >
            <Film className="w-5 h-5" />
            Explorar películas
          </Link>
        </div>
      ) : (
        <>
          {/* Movie Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {favorites.map((favorite) => (
              <Link
                key={favorite.id}
                href={`/pelicula/${favorite.movie.tmdb_id}`}
                className="group relative"
              >
                {/* Card */}
                <div className="relative aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden bg-[#14181D] border border-[#1E2328] group-hover:border-[#2A3038] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-black/40">
                  {/* Poster */}
                  {favorite.movie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${favorite.movie.poster_path}`}
                      alt={favorite.movie.title}
                      fill
                      className="object-cover transition-all duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1A2026]">
                      <Film className="w-12 h-12 text-[#4A5568]" />
                    </div>
                  )}

                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Favorite Heart Badge */}
                  <button
                    onClick={(e) => handleRemoveFavorite(favorite.movie.id, e)}
                    disabled={removingIds.has(favorite.movie.id)}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-black/80 hover:scale-110 cursor-pointer disabled:opacity-50"
                    title="Quitar de favoritos"
                  >
                    {removingIds.has(favorite.movie.id) ? (
                      <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                    ) : (
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] fill-[#D4AF37]" />
                    )}
                  </button>
                </div>

                {/* Movie Info */}
                <div className="mt-3 px-1">
                  <h3 className="text-sm sm:text-base font-semibold text-[#F2F4F6] line-clamp-2 group-hover:text-[#16C7D9] transition-colors">
                    {favorite.movie.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
                    {favorite.movie.year || 'Año desconocido'}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#14181D] hover:bg-[#1A2026] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  'Cargar más favoritas'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Back to Profile Link - Mobile friendly */}
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
