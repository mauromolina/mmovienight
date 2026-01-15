'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Clock, Star, Play, X, MessageCircle, Send } from 'lucide-react'
import { AddToWatchlistButton } from '@/components/movies/add-to-watchlist-button'
import { FavoriteButton } from '@/components/movies/favorite-button'

interface WatchProvider {
  name: string
  logo: string
  type: 'flatrate' | 'rent' | 'buy'
}

interface MovieDetailContentProps {
  movie: {
    id: number
    title: string
    year: number | null
    runtime: number | null
    director: string | null
    poster_path: string | null
    backdrop_path: string | null
    genres: string[]
    overview: string
    vote_average: number
    vote_count: number
    tagline: string | null
    trailerKey: string | null
    cast: Array<{
      name: string
      character: string
      photo: string | null
    }>
    watchProviders: WatchProvider[]
    watchProvidersLink: string | null
  }
}

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}min`
}

function RatingStars({ rating, maxRating = 10 }: { rating: number; maxRating?: number }) {
  const normalizedRating = (rating / maxRating) * 5
  const fullStars = Math.floor(normalizedRating)
  const hasHalfStar = normalizedRating % 1 >= 0.5

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < fullStars
              ? 'text-[#D4AF37] fill-[#D4AF37]'
              : i === fullStars && hasHalfStar
                ? 'text-[#D4AF37] fill-[#D4AF37]/50'
                : 'text-[#3A4048]'
          }`}
        />
      ))}
    </div>
  )
}

// Trailer Modal Component
function TrailerModal({
  isOpen,
  onClose,
  trailerKey,
  movieTitle,
}: {
  isOpen: boolean
  onClose: () => void
  trailerKey: string
  movieTitle: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-5xl mx-4 aspect-video">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-8 h-8" />
        </button>

        {/* YouTube iframe */}
        <iframe
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
          title={`${movieTitle} - Trailer`}
          className="w-full h-full rounded-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}

export default function MovieDetailContent({ movie }: MovieDetailContentProps) {
  const router = useRouter()
  const [showTrailer, setShowTrailer] = useState(false)
  const [comment, setComment] = useState('')

  // TODO: Fetch real comments from database
  const [comments] = useState<
    Array<{
      id: string
      userName: string
      avatar: string | null
      comment: string
      createdAt: string
    }>
  >([])

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    // Here you would save the comment to the database
    console.log('Comment submitted:', comment)
    setComment('')
  }

  return (
    <div className="animate-fade-in pb-12 relative">
      {/* Cinematic Backdrop - Using backdrop_path */}
      <div
        className="absolute -top-8 h-[420px] sm:h-[480px] lg:h-[520px] overflow-hidden pointer-events-none"
        style={{
          width: '100vw',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        {/* Background Image - Sharp backdrop */}
        {movie.backdrop_path && (
          <div className="absolute inset-0">
            <Image
              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
              alt=""
              fill
              className="object-cover object-top"
              priority
            />
          </div>
        )}

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D10] via-[#0B0D10]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/50 to-transparent" />

        {/* Extra fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B0D10] to-transparent" />
      </div>

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="relative z-10 inline-flex items-center gap-2 text-sm text-[#16C7D9] hover:text-[#3DD4E4] transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      {/* Hero Section */}
      <div className="relative z-20 flex flex-col lg:flex-row gap-8 mb-10">
        {/* Poster */}
        <div className="flex-shrink-0 mx-auto lg:mx-0">
          <div className="relative w-64 sm:w-72 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
            {movie.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-[#1A2026] flex items-center justify-center">
                <span className="text-[#6B7280]">Sin imagen</span>
              </div>
            )}
          </div>
        </div>

        {/* Movie Info */}
        <div className="flex-1 text-center lg:text-left">
          {/* Genre badges */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4">
            {movie.genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 text-xs font-medium bg-[#1A2026]/80 backdrop-blur-sm border border-[#2A3038]/50 rounded-full text-[#9AA3AD]"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#F2F4F6] mb-2 drop-shadow-lg">
            {movie.title}
          </h1>

          {/* Tagline */}
          {movie.tagline && (
            <p className="text-lg text-[#9AA3AD] italic mb-4">&ldquo;{movie.tagline}&rdquo;</p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-[#9AA3AD] mb-6">
            {movie.year && <span className="font-medium">{movie.year}</span>}
            {movie.director && (
              <>
                <span className="text-[#3A4048]">·</span>
                <span>Dirigida por {movie.director}</span>
              </>
            )}
            {movie.runtime && (
              <>
                <span className="text-[#3A4048]">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatRuntime(movie.runtime)}
                </span>
              </>
            )}
          </div>

          {/* TMDB Rating */}
          <div className="inline-flex flex-col items-center lg:items-start bg-gradient-to-br from-[#14181D] to-[#12151A] rounded-2xl p-6 border border-[#1E2328]/60 mb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-5xl font-black text-[#D4AF37]">
                {movie.vote_average.toFixed(1).replace('.', ',')}
              </span>
              <RatingStars rating={movie.vote_average} />
            </div>
            <p className="text-sm text-[#6B7280]">
              Calificación TMDB · basada en{' '}
              <span className="text-[#9AA3AD] font-medium">
                {movie.vote_count.toLocaleString()} votos
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
            <AddToWatchlistButton tmdbId={movie.id} movieTitle={movie.title} variant="primary" />
            <FavoriteButton tmdbId={movie.id} variant="full" />
            {movie.trailerKey ? (
              <button
                onClick={() => setShowTrailer(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl text-sm font-medium text-[#F2F4F6] transition-all cursor-pointer"
              >
                <Play className="w-5 h-5" />
                Ver tráiler
              </button>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-[#6B7280] cursor-not-allowed"
              >
                <Play className="w-5 h-5" />
                Sin tráiler
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 grid gap-8 lg:grid-cols-3">
        {/* Left Column - Synopsis and Comments */}
        <div className="lg:col-span-2 space-y-10">
          {/* Synopsis */}
          <section>
            <h2 className="text-xl font-bold text-[#F2F4F6] mb-4">Sinopsis</h2>
            <p className="text-[#9AA3AD] leading-relaxed text-base">
              {movie.overview || 'Sin sinopsis disponible.'}
            </p>
          </section>

          {/* Comments Section */}
          <section>
            <h2 className="text-xl font-bold text-[#F2F4F6] mb-6">
              Comentarios
              <span className="ml-2 text-sm font-normal text-[#6B7280]">({comments.length})</span>
            </h2>

            {/* Comment Input */}
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#16C7D9] to-[#0EA5E9] flex items-center justify-center text-[#0B0D10] font-bold text-sm">
                  T
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="w-full px-4 py-3 pr-12 bg-[#14181D] border border-[#2A3038] rounded-xl text-[#F2F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#16C7D9] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!comment.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#16C7D9] hover:text-[#3DD4E4] disabled:text-[#3A4048] disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="p-4 bg-[#14181D] border border-[#1E2328] rounded-xl">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#6B7280] to-[#4A5568] flex items-center justify-center text-white font-bold text-sm">
                        {c.userName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-[#F2F4F6]">{c.userName}</span>
                          <span className="text-xs text-[#6B7280]">{c.createdAt}</span>
                        </div>
                        <p className="text-[#9AA3AD] text-sm leading-relaxed">{c.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl bg-gradient-to-b from-[#14181D] to-[#12151A] border border-[#1E2328]/60">
                <div className="w-16 h-16 rounded-full bg-[#1A2026] flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-[#4A5568]" />
                </div>
                <h3 className="text-lg font-bold text-[#F2F4F6] mb-2">Sin comentarios todavía</h3>
                <p className="text-sm text-[#6B7280] max-w-sm">
                  Sé el primero en compartir tu opinión sobre esta película.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Cast and Info */}
        <div className="space-y-6">
          {/* Cast Card */}
          {movie.cast.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-b from-[#14181D] to-[#12151A] border border-[#1E2328]/60 p-6">
              <h3 className="text-lg font-bold text-[#F2F4F6] mb-4">Reparto</h3>

              <div className="space-y-3">
                {movie.cast.slice(0, 6).map((actor) => (
                  <div key={actor.name} className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#2A3038] flex-shrink-0">
                      {actor.photo ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${actor.photo}`}
                          alt={actor.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#6B7280] text-xs">
                          {actor.name.charAt(0)}
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

          {/* Watch Providers Card */}
          {movie.watchProviders.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-b from-[#14181D] to-[#12151A] border border-[#1E2328]/60 p-6">
              <h3 className="text-lg font-bold text-[#F2F4F6] mb-4">Disponible en Argentina</h3>

              {/* Streaming (flatrate) */}
              {movie.watchProviders.filter((p) => p.type === 'flatrate').length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-[#6B7280] mb-3 uppercase tracking-wide">Streaming</p>
                  <div className="flex flex-wrap gap-3">
                    {movie.watchProviders
                      .filter((p) => p.type === 'flatrate')
                      .map((provider) => (
                        <div key={provider.name} className="group relative" title={provider.name}>
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#2A3038] ring-1 ring-white/10 group-hover:ring-[#16C7D9]/50 transition-all">
                            <Image
                              src={`https://image.tmdb.org/t/p/original${provider.logo}`}
                              alt={provider.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Rent */}
              {movie.watchProviders.filter((p) => p.type === 'rent').length > 0 && (
                <div>
                  <p className="text-xs text-[#6B7280] mb-3 uppercase tracking-wide">Alquiler</p>
                  <div className="flex flex-wrap gap-3">
                    {movie.watchProviders
                      .filter((p) => p.type === 'rent')
                      .map((provider) => (
                        <div key={provider.name} className="group relative" title={provider.name}>
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#2A3038] ring-1 ring-white/10 group-hover:ring-[#16C7D9]/50 transition-all">
                            <Image
                              src={`https://image.tmdb.org/t/p/original${provider.logo}`}
                              alt={provider.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Card */}
          <div className="rounded-2xl bg-gradient-to-b from-[#14181D] to-[#12151A] border border-[#1E2328]/60 p-6">
            <h3 className="text-lg font-bold text-[#F2F4F6] mb-4">Información</h3>

            <div className="space-y-3 text-sm">
              {movie.director && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Director</span>
                  <span className="text-[#F2F4F6] font-medium">{movie.director}</span>
                </div>
              )}
              {movie.year && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Año</span>
                  <span className="text-[#F2F4F6] font-medium">{movie.year}</span>
                </div>
              )}
              {movie.runtime && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Duración</span>
                  <span className="text-[#F2F4F6] font-medium">{formatRuntime(movie.runtime)}</span>
                </div>
              )}
              {movie.genres.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Géneros</span>
                  <span className="text-[#F2F4F6] font-medium text-right">
                    {movie.genres.slice(0, 3).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {movie.trailerKey && (
        <TrailerModal
          isOpen={showTrailer}
          onClose={() => setShowTrailer(false)}
          trailerKey={movie.trailerKey}
          movieTitle={movie.title}
        />
      )}
    </div>
  )
}
