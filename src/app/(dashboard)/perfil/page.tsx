import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Edit3,
  Film,
  Star,
  Users,
  ChevronRight,
  Calendar,
  Award,
  Heart,
  BookmarkPlus,
  Clapperboard,
  ThumbsUp,
  MessageCircle,
} from 'lucide-react'

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
import { createClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'
import { getUserGroups } from '@/services/groups'
import { getUserStats, getUserRecentRatings, getUserTopGenres, getUserFavorites } from '@/services/movies'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's profile, groups, stats, ratings, genres and favorites in parallel
  const [profileData, groups, userStats, recentRatingsData, topGenres, favoriteMovies] = await Promise.all([
    getTable(supabase, 'profiles').select('*').eq('id', user.id).single(),
    getUserGroups(),
    getUserStats(user.id),
    getUserRecentRatings(user.id, 5),
    getUserTopGenres(user.id, 5),
    getUserFavorites(user.id),
  ])

  const dbProfile = profileData.data

  // User profile data - prioritize database values, fallback to user metadata
  const profile = {
    name: dbProfile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
    bio: dbProfile?.bio || null,
    avatar: dbProfile?.avatar_url || user.user_metadata?.avatar_url || null,
    banner: dbProfile?.banner_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&q=80',
    isVerified: false,
    memberSince: new Date(user.created_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
  }

  // Stats from database
  const stats = {
    moviesWatched: userStats.moviesWatched,
    reviewsWritten: userStats.reviewsWritten,
    circlesJoined: groups.length,
  }

  // Format recent ratings for display
  const recentRatings = recentRatingsData.map((rating) => ({
    id: rating.id,
    score: rating.score,
    comment: rating.comment,
    created_at: rating.created_at,
    movie: {
      id: rating.movie.id,
      title: rating.movie.title,
      year: rating.movie.year,
      poster: rating.movie.poster_path,
    },
    group: rating.group,
    // TODO: These would come from real data when implemented
    likes: 0,
    comments: 0,
  }))

  return (
    <div className="animate-fade-in pb-12">
      {/* Profile Hero - Full Width Banner */}
      <div className="relative w-screen left-1/2 -translate-x-1/2 -mt-8 mb-8 overflow-hidden">
        {/* Background - User's banner */}
        <div className="absolute inset-0">
          <Image
            src={profile.banner}
            alt="Profile banner"
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/70 to-transparent" />
        <div className="absolute inset-0 bg-[#0B0D10]/40" />

        {/* Hero Content */}
        <div className="relative z-10 pt-8 sm:pt-12 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Mobile: Action buttons at top right */}
            <div className="flex justify-end mb-4 sm:hidden">
              <Link
                href="/perfil/editar"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-xl text-xs font-medium text-[#F2F4F6] transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-[#0B0D10] p-1 shadow-xl shadow-black/30 ring-4 ring-[#16C7D9]/30 ring-offset-2 ring-offset-[#0B0D10]">
                  <div className="w-full h-full rounded-full bg-[#14181D] flex items-center justify-center overflow-hidden border-2 border-[#2A3038]">
                    {profile.avatar ? (
                      <Image
                        src={profile.avatar}
                        alt={profile.name}
                        fill
                        className="object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-3xl sm:text-5xl font-bold text-[#16C7D9]">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                {/* Verified Badge */}
                {profile.isVerified && (
                  <div className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0B0D10] shadow-lg">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#F2F4F6] flex items-center justify-center sm:justify-start gap-2 mb-1 sm:mb-2">
                  {profile.name}
                </h1>
                {profile.bio && (
                  <p className="text-[#9AA3AD] text-sm sm:text-base mb-2 max-w-md">
                    {profile.bio}
                  </p>
                )}
                <p className="text-[#6B7280] text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Miembro desde {profile.memberSince}
                </p>
              </div>

              {/* Action Buttons - Desktop only */}
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/perfil/editar"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-xl text-sm font-medium text-[#F2F4F6] transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar perfil
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-b from-[#14181D] to-[#12151A] border border-[#1E2328]/60 mb-6 sm:mb-10">
        <div className="flex-1 text-center py-4 sm:py-6 px-2">
          <p className="text-2xl sm:text-4xl font-black text-[#16C7D9] mb-0.5 sm:mb-1">
            {stats.moviesWatched}
          </p>
          <p className="text-[9px] sm:text-xs font-semibold text-[#6B7280] tracking-wider uppercase">
            Películas
          </p>
        </div>
        <div className="w-px h-12 sm:h-16 bg-[#1E2328]" />
        <div className="flex-1 text-center py-4 sm:py-6 px-2">
          <p className="text-2xl sm:text-4xl font-black text-[#D4AF37] mb-0.5 sm:mb-1">
            {stats.reviewsWritten}
          </p>
          <p className="text-[9px] sm:text-xs font-semibold text-[#6B7280] tracking-wider uppercase">
            Reseñas
          </p>
        </div>
        <div className="w-px h-12 sm:h-16 bg-[#1E2328]" />
        <div className="flex-1 text-center py-4 sm:py-6 px-2">
          <p className="text-2xl sm:text-4xl font-black text-[#9333EA] mb-0.5 sm:mb-1">
            {stats.circlesJoined}
          </p>
          <p className="text-[9px] sm:text-xs font-semibold text-[#6B7280] tracking-wider uppercase">
            Círculos
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Left Column - Movies & Ratings */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-10">
          {/* Favorite Movies */}
          <section>
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h2 className="text-lg sm:text-xl font-bold">
                <span className="text-[#F2F4F6]">Películas </span>
                <span className="text-[#16C7D9]">Favoritas</span>
              </h2>
              {favoriteMovies.length > 0 && (
                <Link
                  href="/perfil/favoritas"
                  className="text-sm text-[#6B7280] hover:text-[#16C7D9] transition-colors"
                >
                  Ver todas
                </Link>
              )}
            </div>

            {favoriteMovies.length === 0 ? (
              <div className="relative rounded-2xl bg-gradient-to-b from-[#13161B] to-[#111419] border border-[#1E2328]/60">
                <div className="relative flex flex-col items-center justify-center text-center py-12 px-6">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 w-20 h-20 rounded-full bg-[#16C7D9]/10 blur-xl animate-pulse" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#1A2026] to-[#14181D] border-2 border-[#2A3038] flex items-center justify-center">
                      <Heart className="w-10 h-10 text-[#4A5568]" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#F2F4F6] mb-2">
                    Sin favoritas todavía
                  </h3>
                  <p className="text-sm text-[#6B7280] max-w-sm mb-4">
                    Explorá películas y marcá tus favoritas para verlas acá.
                  </p>
                  <Link
                    href="/explorar"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#16C7D9]/10 hover:bg-[#16C7D9]/20 rounded-xl text-sm font-medium text-[#16C7D9] transition-all"
                  >
                    <Film className="w-4 h-4" />
                    Explorar películas
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {favoriteMovies.map((movie) => (
                  <Link
                    key={movie.id}
                    href={`/pelicula/${movie.tmdb_id}`}
                    className="flex-shrink-0 w-28 sm:w-36 group"
                  >
                    <div className="relative aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden mb-2 border border-[#1A2026] group-hover:border-[#2A3038] transition-all group-hover:shadow-xl group-hover:shadow-black/30 group-hover:-translate-y-1">
                      {movie.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                          alt={movie.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#1A2026] flex items-center justify-center">
                          <Film className="w-8 h-8 text-[#4A5568]" />
                        </div>
                      )}
                      {/* Heart overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Heart className="w-8 h-8 text-[#EF4444] fill-[#EF4444]" />
                      </div>
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[#F2F4F6] line-clamp-1 group-hover:text-[#16C7D9] transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-[#6B7280]">{movie.year}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Ratings */}
          <section>
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h2 className="text-lg sm:text-xl font-bold">
                <span className="text-[#F2F4F6]">Calificaciones </span>
                <span className="text-[#16C7D9]">Recientes</span>
              </h2>
              {recentRatings.length > 0 && (
                <Link
                  href="/perfil/calificaciones"
                  className="text-sm text-[#6B7280] hover:text-[#16C7D9] transition-colors"
                >
                  Ver todas
                </Link>
              )}
            </div>

            {recentRatings.length === 0 ? (
              <div className="relative rounded-2xl bg-gradient-to-b from-[#13161B] to-[#111419] border border-[#1E2328]/60">
                <div className="relative flex flex-col items-center justify-center text-center py-12 px-6">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 w-20 h-20 rounded-full bg-[#D4AF37]/10 blur-xl animate-pulse" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#1A2026] to-[#14181D] border-2 border-[#2A3038] flex items-center justify-center">
                      <Star className="w-10 h-10 text-[#4A5568]" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#F2F4F6] mb-2">
                    Sin calificaciones todavía
                  </h3>
                  <p className="text-sm text-[#6B7280] max-w-sm mb-4">
                    Unite a un círculo y calificá películas para verlas acá.
                  </p>
                  <Link
                    href="/grupos"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 rounded-xl text-sm font-medium text-[#D4AF37] transition-all"
                  >
                    <Users className="w-4 h-4" />
                    Ver mis círculos
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRatings.map((rating: any) => (
                  <Link
                    key={rating.id}
                    href={`/grupos/${rating.group.id}/pelicula/${rating.movie.id}`}
                    className="block p-4 rounded-2xl bg-[#181C21] shadow-md shadow-black/20 hover:shadow-lg hover:shadow-black/30 transition-all group"
                  >
                    <div className="flex gap-4">
                      {/* Poster - Left anchor */}
                      <div className="relative w-16 sm:w-20 aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0 bg-[#1A2026]">
                        {rating.movie.poster ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w500${rating.movie.poster}`}
                            alt={rating.movie.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-6 h-6 text-[#4A5568]" />
                          </div>
                        )}
                      </div>

                      {/* Content - Right side */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        {/* Header row: Title + Date */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm sm:text-base font-semibold text-[#F2F4F6] group-hover:text-[#16C7D9] transition-colors line-clamp-1">
                            {rating.movie.title}
                          </h3>
                          <span className="text-[10px] sm:text-xs text-[#4A5568] whitespace-nowrap flex-shrink-0">
                            {formatRelativeDate(rating.created_at)}
                          </span>
                        </div>

                        {/* Rating with stars */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                  star <= Math.round(rating.score / 2)
                                    ? 'text-[#D4AF37] fill-[#D4AF37]'
                                    : 'text-[#3A4048]'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm sm:text-base font-bold text-[#D4AF37]">
                            {rating.score.toFixed(1)}
                          </span>
                        </div>

                        {/* Review snippet */}
                        {rating.comment ? (
                          <p className="text-xs sm:text-sm text-[#9AA3AD] line-clamp-1 sm:line-clamp-2 mb-3">
                            &ldquo;{rating.comment}&rdquo;
                          </p>
                        ) : (
                          <p className="text-xs text-[#4A5568] italic mb-3">
                            Sin reseña escrita
                          </p>
                        )}

                        {/* Social indicators */}
                        <div className="flex items-center gap-4 mt-auto">
                          <div className="flex items-center gap-1.5 text-[#6B7280]">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span className="text-xs">{rating.likes}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#6B7280]">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-xs">{rating.comments}</span>
                          </div>
                          <span className="text-[10px] text-[#4A5568] ml-auto">
                            en {rating.group.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Genres & Circles */}
        <div className="space-y-4 sm:space-y-6">
          {/* Top Genres */}
          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#14181D] to-[#12151A] border border-[#1E2328]/60 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-[#F2F4F6] mb-4 sm:mb-6">
              Géneros principales
            </h3>

            {topGenres.length === 0 ? (
              <div className="text-center py-6">
                <Clapperboard className="w-10 h-10 text-[#4A5568] mx-auto mb-3" />
                <p className="text-sm text-[#6B7280]">
                  Calificá películas para ver tus géneros favoritos
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {topGenres.map((genre: any) => (
                  <div key={genre.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-[#F2F4F6] font-medium">{genre.name}</span>
                      <span className="text-xs text-[#6B7280]">{genre.percentage}%</span>
                    </div>
                    <div className="h-2 bg-[#1A2026] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${genre.percentage}%`,
                          backgroundColor: genre.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Circles */}
          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#14181D] to-[#12151A] border border-[#1E2328]/60 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-[#F2F4F6]">
                Círculos activos
              </h3>
              <Link
                href="/grupos"
                className="text-xs text-[#6B7280] hover:text-[#16C7D9] transition-colors"
              >
                Ver todos
              </Link>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-10 h-10 text-[#4A5568] mx-auto mb-3" />
                <p className="text-sm text-[#6B7280] mb-4">
                  Todavía no sos parte de ningún círculo
                </p>
                <Link
                  href="/grupos"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#16C7D9]/10 hover:bg-[#16C7D9]/20 rounded-xl text-sm font-medium text-[#16C7D9] transition-all"
                >
                  <Users className="w-4 h-4" />
                  Explorar círculos
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {groups.slice(0, 3).map((circle: any) => (
                    <Link
                      key={circle.id}
                      href={`/grupos/${circle.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#0B0D10]/50 hover:bg-[#1A2026] transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16C7D9]/20 to-[#0EA5E9]/20 flex items-center justify-center text-lg">
                        <Film className="w-5 h-5 text-[#16C7D9]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F2F4F6] group-hover:text-[#16C7D9] transition-colors truncate">
                          {circle.name}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {circle.member_count || 1} {(circle.member_count || 1) === 1 ? 'miembro' : 'miembros'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#4A5568] group-hover:text-[#16C7D9] transition-colors" />
                    </Link>
                  ))}
                </div>

                {groups.length > 3 && (
                  <Link
                    href="/grupos"
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-[#1A2026] hover:bg-[#242A32] border border-[#2A3038] text-xs sm:text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all"
                  >
                    <Users className="w-4 h-4" />
                    Ver todos los círculos
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Quick Stats Card - Only show if user has activity */}
          {stats.moviesWatched > 0 && (
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#16C7D9]/10 to-[#0EA5E9]/5 border border-[#16C7D9]/20 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#16C7D9]/20 flex items-center justify-center">
                  <Film className="w-5 h-5 text-[#16C7D9]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#F2F4F6]">Racha actual</p>
                  <p className="text-xs text-[#6B7280]">0 días calificando</p>
                </div>
              </div>
              <p className="text-xs text-[#9AA3AD]">
                Seguí así para mantener tu racha y subir en el ranking de tu círculo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
