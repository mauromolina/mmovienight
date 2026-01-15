import Link from 'next/link'
import Image from 'next/image'
import { Star, Calendar } from 'lucide-react'
import { cn, formatDate, getRatingColor, getRatingBgColor } from '@/lib/utils'
import { getTMDbImageUrl } from '@/types/tmdb'
import type { Movie } from '@/types'

interface MovieCardProps {
  groupId: string
  movie: Movie
  averageRating?: number
  ratingCount?: number
  userRating?: number
  watchedAt?: string | null
}

export function MovieCard({
  groupId,
  movie,
  averageRating = 0,
  ratingCount = 0,
  userRating,
  watchedAt,
}: MovieCardProps) {
  const posterUrl = getTMDbImageUrl(movie.poster_path, 'w342')

  return (
    <Link href={`/grupos/${groupId}/pelicula/${movie.id}`}>
      <div className="group relative rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] transition-all duration-200 hover:border-[var(--border-hover)] hover:-translate-y-1 hover:shadow-xl">
        {/* Poster */}
        <div className="aspect-[2/3] relative">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-[var(--background-secondary)] flex items-center justify-center">
              <span className="text-4xl text-gray-600">🎬</span>
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          {/* Rating badge */}
          {averageRating > 0 && (
            <div
              className={cn(
                'absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-sm',
                getRatingBgColor(averageRating)
              )}
            >
              <Star className={cn('w-3.5 h-3.5', getRatingColor(averageRating))} fill="currentColor" />
              <span className={cn('text-sm font-bold', getRatingColor(averageRating))}>
                {averageRating.toFixed(1)}
              </span>
            </div>
          )}

          {/* User rating indicator */}
          {userRating && (
            <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-900">{userRating}</span>
            </div>
          )}

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-base font-semibold text-white line-clamp-2 mb-1 group-hover:text-teal-300 transition-colors">
              {movie.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-300">
              {movie.year && <span>{movie.year}</span>}
              {ratingCount > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {ratingCount} {ratingCount === 1 ? 'voto' : 'votos'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom info */}
        {watchedAt && (
          <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--background-secondary)]">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              Vista el {formatDate(watchedAt)}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
