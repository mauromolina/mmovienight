'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Clock,
  Star,
  Film,
  Calendar,
  MessageCircle,
  User,
  Eye,
  RefreshCw,
  TrendingUp,
  ThumbsUp,
  Flame,
  Award,
  Edit3,
  Trash2,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RatingModal } from './rating-modal'
import type { Group, MovieWithGroupData } from '@/types'

interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
}

interface TMDbData {
  tagline: string | null
  cast: CastMember[]
  voteAverage: number
  voteCount: number
}

interface GroupMovieDetailClientProps {
  movie: MovieWithGroupData
  group: Group
  userId: string
  memberCount: number
  tmdbData: TMDbData | null
}

function formatRuntime(minutes: number | null): string {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours} h ${mins} min` : `${mins} min`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'hoy'
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`
  return formatDate(dateStr)
}

function RatingStars({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const normalizedRating = (rating / 10) * 5
  const fullStars = Math.floor(normalizedRating)
  const hasHalfStar = normalizedRating % 1 >= 0.5
  const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClass,
            i < fullStars
              ? 'text-[#D4AF37] fill-[#D4AF37]'
              : i === fullStars && hasHalfStar
                ? 'text-[#D4AF37] fill-[#D4AF37]/50'
                : 'text-[#3A4048]'
          )}
        />
      ))}
    </div>
  )
}

export default function GroupMovieDetailClient({
  movie,
  group,
  userId,
  memberCount,
  tmdbData,
}: GroupMovieDetailClientProps) {
  const router = useRouter()
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent')

  const userRating = movie.ratings?.find((r) => r.user_id === userId)
  const membersWhoRated = movie.rating_count
  const watchedPercentage = memberCount > 0 ? Math.round((membersWhoRated / memberCount) * 100) : 0

  // Sort ratings
  const sortedRatings = [...(movie.ratings || [])].sort((a, b) => {
    if (sortBy === 'top') return b.score - a.score
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handleRatingSubmit = async (data: {
    score: number
    comment: string
    publishToGroup: boolean
  }) => {
    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/groups/${group.id}/movies/${movie.id}/ratings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: data.score,
            comment: data.comment || null,
          }),
        }
      )

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving rating:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate consensus text
  const getConsensusText = () => {
    if (movie.rating_count < 2) return null
    if (movie.average_rating >= 9) return 'Aclamación total'
    if (movie.average_rating >= 8) return 'Muy recomendada'
    if (movie.average_rating >= 7) return 'Bien recibida'
    if (movie.average_rating >= 5) return 'Opiniones mixtas'
    return 'Recepción fría'
  }

  const consensus = getConsensusText()

  return (
    <div className="animate-fade-in pb-16">
      {/* HERO SECTION with Backdrop - Full Width */}
      <section className="relative mb-12 overflow-hidden -mt-8" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        {/* Backdrop Image */}
        {movie.backdrop_path && (
          <div className="absolute inset-0">
            <Image
              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
              alt=""
              fill
              className="object-cover object-top"
              priority
            />
            {/* Gradient overlays for cinematic effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/70 to-[#0B0D10]/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D10]/80 via-[#0B0D10]/40 to-[#0B0D10]/80" />
          </div>
        )}

        {/* Fallback gradient when no backdrop */}
        {!movie.backdrop_path && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A2026] to-[#0B0D10]" />
        )}

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Back link */}
          <Link
            href={`/grupos/${group.id}`}
            className="inline-flex items-center gap-2 text-sm text-[#16C7D9] hover:text-[#3DD4E4] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al grupo {group.name}
          </Link>

          {/* Hero Grid */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Poster */}
        <div className="flex-shrink-0 mx-auto lg:mx-0">
          <div className="relative w-[280px] sm:w-[320px] aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl shadow-black/60 bg-[#14181D]">
            {movie.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-20 h-20 text-[#4A5568]" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col">
          {/* Genre badges */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-[#1A2026]/80 border border-[#2A3038] rounded-full text-xs font-medium text-[#9AA3AD]"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#F2F4F6] mb-4 leading-tight">
            {movie.title}
          </h1>

          {/* Metadata */}
          <p className="text-[#9AA3AD] text-lg mb-6">
            {movie.year && <span>{movie.year}</span>}
            {movie.director && <span> · Dirigida por {movie.director}</span>}
            {movie.runtime && <span> · {formatRuntime(movie.runtime)}</span>}
          </p>

          {/* Group rating */}
          <div className="mb-6">
            {movie.rating_count > 0 ? (
              <div className="flex items-center gap-4">
                <span className="text-5xl sm:text-6xl font-black text-[#D4AF37]">
                  {movie.average_rating.toFixed(1)}
                </span>
                <div>
                  <RatingStars rating={movie.average_rating} size="lg" />
                  <p className="text-sm text-[#6B7280] mt-1">
                    Promedio del grupo · basado en {movie.rating_count} {movie.rating_count === 1 ? 'amigo' : 'amigos'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[#6B7280]">
                Aún no hay calificaciones del grupo
              </p>
            )}
          </div>

          {/* Priority badge */}
          {movie.average_rating >= 8.5 && movie.rating_count >= 3 && (
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#16C7D9]/10 border border-[#16C7D9]/30 rounded-xl text-sm font-semibold text-[#16C7D9]">
                <Flame className="w-4 h-4" />
                Favorita del grupo
              </span>
            </div>
          )}

          {/* CTA - Calificar */}
          <div className="mt-auto">
            {userRating ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-3 bg-[#0B0D10]/60 backdrop-blur-sm border border-white/10 rounded-xl">
                  <span className="text-sm text-white/80">Ya calificaste esta película</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                    <span className="text-xl font-bold text-[#D4AF37]">{userRating.score}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsRatingModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-xl text-sm font-medium text-white transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar mi calificación
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsRatingModalOpen(true)}
                disabled={isSaving}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-[#16C7D9] hover:bg-[#14B8C9] disabled:bg-[#16C7D9]/50 rounded-2xl text-lg font-bold text-[#0B0D10] transition-all shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 cursor-pointer"
              >
                <Star className="w-5 h-5" />
                Calificar esta película
              </button>
            )}
          </div>
        </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Sinopsis */}
          {(movie.overview || tmdbData?.tagline) && (
            <section>
              <h2 className="text-xl font-bold text-[#F2F4F6] mb-4">La misión</h2>
              {tmdbData?.tagline && (
                <p className="text-[#16C7D9] italic mb-3">"{tmdbData.tagline}"</p>
              )}
              {movie.overview && (
                <p className="text-[#9AA3AD] leading-relaxed text-lg">{movie.overview}</p>
              )}
            </section>
          )}

          {/* Reacciones del grupo */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#F2F4F6] flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#16C7D9]" />
                Reacciones del grupo
              </h2>

              {/* Toggle de orden */}
              <div className="flex items-center gap-1 p-1 bg-[#14181D] rounded-lg border border-[#2A3038]">
                <button
                  onClick={() => setSortBy('recent')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer',
                    sortBy === 'recent'
                      ? 'bg-[#16C7D9] text-[#0B0D10]'
                      : 'text-[#6B7280] hover:text-[#9AA3AD]'
                  )}
                >
                  Más recientes
                </button>
                <button
                  onClick={() => setSortBy('top')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer',
                    sortBy === 'top'
                      ? 'bg-[#16C7D9] text-[#0B0D10]'
                      : 'text-[#6B7280] hover:text-[#9AA3AD]'
                  )}
                >
                  Mejor puntuadas
                </button>
              </div>
            </div>

            {sortedRatings.length > 0 ? (
              <div className="space-y-4">
                {sortedRatings.map((rating) => {
                  const isCurrentUser = rating.user_id === userId
                  return (
                    <div
                      key={rating.id}
                      className={cn(
                        'p-5 rounded-2xl border transition-colors',
                        isCurrentUser
                          ? 'bg-[#16C7D9]/5 border-[#16C7D9]/30'
                          : 'bg-[#14181D]/60 border-[#1E2328]'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#1A2026] flex items-center justify-center overflow-hidden border-2 border-[#2A3038]">
                            {rating.profile?.avatar_url ? (
                              <Image
                                src={rating.profile.avatar_url}
                                alt={rating.profile.display_name || ''}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-[#4A5568]" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[#F2F4F6]">
                                {rating.profile?.display_name || 'Usuario'}
                              </p>
                              {isCurrentUser && (
                                <span className="px-2 py-0.5 bg-[#16C7D9]/20 rounded text-[10px] font-bold text-[#16C7D9] uppercase tracking-wide">
                                  Tu reseña
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#6B7280]">
                              {formatRelativeDate(rating.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/10 rounded-lg">
                          <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                          <span className="font-bold text-[#D4AF37]">{rating.score}</span>
                        </div>
                      </div>

                      {rating.comment && (
                        <p className="text-[#9AA3AD] leading-relaxed pl-15 italic">
                          "{rating.comment}"
                        </p>
                      )}

                      {/* Actions for current user */}
                      {isCurrentUser && (
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#1E2328]">
                          <button
                            onClick={() => setIsRatingModalOpen(true)}
                            className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#16C7D9] transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Editar
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-6 rounded-2xl bg-[#14181D]/40 border border-[#1E2328]">
                <MessageCircle className="w-12 h-12 text-[#2A3038] mx-auto mb-4" />
                <p className="text-[#6B7280]">
                  Aún no hay reseñas. ¡Sé el primero en compartir tu opinión!
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Insights del grupo */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#14181D] to-[#111419] border border-[#1E2328]">
            <h3 className="text-lg font-bold text-[#F2F4F6] mb-2">Insights del grupo</h3>
            {consensus && (
              <p className="text-sm text-[#16C7D9] mb-4">Consenso: {consensus}</p>
            )}

            <div className="space-y-4">
              {/* Vistas */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#9AA3AD]">
                  <Eye className="w-4 h-4" />
                  Vistas
                </div>
                <span className="text-sm font-semibold text-[#F2F4F6]">
                  {watchedPercentage}% del grupo
                </span>
              </div>

              {/* Calificaciones */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#9AA3AD]">
                  <Star className="w-4 h-4" />
                  Calificaciones
                </div>
                <span className="text-sm font-semibold text-[#F2F4F6]">
                  {movie.rating_count} de {memberCount}
                </span>
              </div>

              {/* Comparación con TMDB */}
              {tmdbData && tmdbData.voteAverage > 0 && movie.rating_count >= 2 && (
                <div className="pt-4 border-t border-[#1E2328]">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-[#16C7D9] mt-0.5" />
                    <p className="text-xs text-[#6B7280] leading-relaxed">
                      {movie.average_rating > tmdbData.voteAverage
                        ? `Este grupo la califica ${(movie.average_rating - tmdbData.voteAverage).toFixed(1)} puntos más alto que el promedio global`
                        : movie.average_rating < tmdbData.voteAverage
                          ? `Este grupo la califica ${(tmdbData.voteAverage - movie.average_rating).toFixed(1)} puntos más bajo que el promedio global`
                          : 'Este grupo coincide con el promedio global'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fecha de visualización */}
          {movie.group_movie?.watched_at && (
            <div className="p-5 rounded-2xl bg-[#14181D]/60 border border-[#1E2328]">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#16C7D9]" />
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Vista el</p>
                  <p className="text-sm font-medium text-[#F2F4F6]">
                    {formatDate(movie.group_movie.watched_at)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Asistentes a la función */}
          {movie.attendees && movie.attendees.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#14181D]/60 border border-[#1E2328]">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#16C7D9]" />
                <h3 className="text-sm font-semibold text-[#F2F4F6]">
                  Estuvieron presentes
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {movie.attendees.map((attendee) => {
                  const displayName = attendee.profile?.display_name || attendee.profile?.email?.split('@')[0] || 'Usuario'
                  return (
                    <div
                      key={attendee.user_id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#1A2026] rounded-full"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#2A3038] overflow-hidden flex-shrink-0">
                        {attendee.profile?.avatar_url ? (
                          <Image
                            src={attendee.profile.avatar_url}
                            alt={displayName}
                            width={24}
                            height={24}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#16C7D9]">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-[#9AA3AD]">
                        {displayName}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Elenco */}
          {tmdbData && tmdbData.cast.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#14181D]/60 border border-[#1E2328]">
              <h3 className="text-lg font-bold text-[#F2F4F6] mb-4">Reparto</h3>
              <div className="space-y-3">
                {tmdbData.cast.slice(0, 5).map((actor) => (
                  <div key={actor.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1A2026] overflow-hidden flex-shrink-0">
                      {actor.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                          alt={actor.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-5 h-5 text-[#4A5568]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#F2F4F6] truncate">{actor.name}</p>
                      <p className="text-xs text-[#6B7280] truncate">{actor.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rating global TMDB */}
          {tmdbData && tmdbData.voteAverage > 0 && (
            <div className="p-5 rounded-2xl bg-[#14181D]/60 border border-[#1E2328]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">Rating TMDB</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                    <span className="text-2xl font-bold text-[#D4AF37]">
                      {tmdbData.voteAverage.toFixed(1)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#6B7280]">
                  {tmdbData.voteCount.toLocaleString()} votos
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        movie={{
          title: movie.title,
          director: movie.director || 'Desconocido',
          year: movie.year || 0,
          poster_path: movie.poster_path || '',
        }}
        groupName={group.name}
        memberCount={memberCount}
        existingRating={
          userRating
            ? { score: userRating.score, comment: userRating.comment || '' }
            : null
        }
        onSubmit={handleRatingSubmit}
      />
    </div>
  )
}
