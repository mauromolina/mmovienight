'use client'

import { useState, useEffect } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  tmdbId: number
  movieId?: string // If we already have the internal movie ID
  variant?: 'icon' | 'full'
  className?: string
}

export function FavoriteButton({
  tmdbId,
  movieId,
  variant = 'icon',
  className,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [internalMovieId, setInternalMovieId] = useState<string | null>(movieId || null)

  // Check if movie is favorited on mount
  useEffect(() => {
    async function checkFavorite() {
      // Can check by movieId or tmdbId
      if (!movieId && !tmdbId) {
        setIsChecking(false)
        return
      }

      try {
        const params = movieId
          ? `movieId=${movieId}`
          : `tmdbId=${tmdbId}`
        const res = await fetch(`/api/favorites/check?${params}`)
        if (res.ok) {
          const data = await res.json()
          setIsFavorite(data.isFavorite)
          if (data.movieId) {
            setInternalMovieId(data.movieId)
          }
        }
      } catch (error) {
        console.error('Error checking favorite:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkFavorite()
  }, [movieId, tmdbId])

  const handleToggleFavorite = async () => {
    if (isLoading) return

    setIsLoading(true)

    try {
      if (isFavorite && internalMovieId) {
        // Remove from favorites
        const res = await fetch(`/api/favorites?movieId=${internalMovieId}`, {
          method: 'DELETE',
        })

        if (res.ok) {
          setIsFavorite(false)
        }
      } else {
        // Add to favorites
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdbId }),
        })

        if (res.ok) {
          const data = await res.json()
          setInternalMovieId(data.movieId)
          setIsFavorite(true)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return variant === 'icon' ? (
      <button
        disabled
        className={cn(
          'p-3 rounded-full bg-[#0B0D10]/60 backdrop-blur-sm border border-white/10',
          className
        )}
      >
        <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
      </button>
    ) : (
      <button
        disabled
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14181D] border border-[#2A3038] text-[#6B7280]',
          className
        )}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Cargando...</span>
      </button>
    )
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={cn(
          'p-3 rounded-full transition-all cursor-pointer',
          isFavorite
            ? 'bg-red-500/20 border border-red-500/40 hover:bg-red-500/30'
            : 'bg-[#0B0D10]/60 backdrop-blur-sm border border-white/10 hover:bg-white/10',
          isLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
        title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Heart
            className={cn(
              'w-5 h-5 transition-colors',
              isFavorite ? 'text-red-500 fill-red-500' : 'text-white'
            )}
          />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer',
        isFavorite
          ? 'bg-red-500/15 border border-red-500/30 text-red-500 hover:bg-red-500/25'
          : 'bg-[#14181D] border border-[#2A3038] text-[#9AA3AD] hover:text-[#F2F4F6] hover:border-[#3A4048]',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart
          className={cn(
            'w-4 h-4',
            isFavorite && 'fill-red-500'
          )}
        />
      )}
      <span className="text-sm font-medium">
        {isFavorite ? 'En favoritos' : 'Agregar a favoritos'}
      </span>
    </button>
  )
}
