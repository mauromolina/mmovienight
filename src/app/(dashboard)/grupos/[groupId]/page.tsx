import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Users,
  Plus,
  Film,
  Crown,
  Star,
  BookmarkPlus,
  ChevronRight,
  Clapperboard,
  Sparkles,
  Settings,
  TrendingUp,
  Calendar,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { getGroupById, getGroupMembers, getUserMembership } from '@/services/groups'
import { getGroupMovies } from '@/services/movies'
import { ShareInviteDialog } from './share-invite-dialog'
import { LeaveGroupButton } from './leave-group-button'

// Filter options for the group movies
const filterOptions = [
  { id: 'recent', label: 'Más recientes' },
  { id: 'top', label: 'Mejor calificadas' },
]

// Format date to Spanish
function formatWatchedDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface GroupPageProps {
  params: Promise<{ groupId: string }>
  searchParams: Promise<{ filter?: string }>
}

export default async function GroupPage({ params, searchParams }: GroupPageProps) {
  const { groupId } = await params
  const { filter = 'recent' } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar membresía
  const membership = await getUserMembership(groupId, user.id)
  if (!membership) {
    notFound()
  }

  // Obtener datos del grupo
  const group = await getGroupById(groupId)
  if (!group) {
    notFound()
  }

  const members = await getGroupMembers(groupId)
  const movies = await getGroupMovies(groupId, filter as 'recent' | 'top')
  const isOwner = membership.role === 'owner'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#6B7280]">
        <Link href="/grupos" className="hover:text-[#9AA3AD] transition-colors">
          Círculos
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-[#9AA3AD]">{group.name}</span>
      </nav>

      {/* Group Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#F2F4F6]">
              {group.name}
            </h1>
            {isOwner ? (
              <>
                <span className="flex items-center gap-1 px-2.5 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-xs font-semibold text-[#D4AF37]">
                  <Crown className="w-3 h-3" />
                  Admin
                </span>
                <Link
                  href={`/grupos/${groupId}/configuracion`}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#14181D] hover:bg-[#1A2026] border border-[#2A3038] hover:border-[#3A4048] rounded-lg text-xs font-medium text-[#6B7280] hover:text-[#F2F4F6] transition-all"
                >
                  <Settings className="w-3 h-3" />
                  Configuración
                </Link>
              </>
            ) : (
              <LeaveGroupButton groupId={groupId} groupName={group.name} />
            )}
          </div>

          {group.description && (
            <p className="text-[#9AA3AD] mb-5 max-w-2xl leading-relaxed">{group.description}</p>
          )}

          {/* Stats Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#14181D] border border-[#2A3038] rounded-lg">
              <Users className="w-4 h-4 text-[#16C7D9]" />
              <span className="text-sm text-[#F2F4F6] font-medium">
                {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#14181D] border border-[#2A3038] rounded-lg">
              <Film className="w-4 h-4 text-[#16C7D9]" />
              <span className="text-sm text-[#F2F4F6] font-medium">
                {movies.length} {movies.length === 1 ? 'película vista' : 'películas vistas'}
              </span>
            </div>
            {movies.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#14181D] border border-[#2A3038] rounded-lg">
                <Star className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm text-[#D4AF37] font-medium">
                  {(
                    movies.reduce((acc: number, m: any) => acc + (m.average_rating || 0), 0) /
                    (movies.filter((m: any) => (m.average_rating || 0) > 0).length || 1)
                  ).toFixed(1)}{' '}
                  promedio
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href={`/grupos/${groupId}/registrar`}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-xl text-sm font-semibold text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            Registrar película
          </Link>
          <Link
            href={`/grupos/${groupId}/watchlist`}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#14181D] hover:bg-[#1A2026] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all"
          >
            <BookmarkPlus className="w-4 h-4" />
            Watchlist
          </Link>
          <Link
            href={`/grupos/${groupId}/actividad`}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#14181D] hover:bg-[#1A2026] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all"
          >
            <Activity className="w-4 h-4" />
            Actividad
          </Link>
          <ShareInviteDialog groupId={groupId} groupName={group.name} />
        </div>
      </div>

      {/* Movies Section */}
      {movies.length === 0 ? (
        <EmptyMoviesState groupId={groupId} groupName={group.name} />
      ) : (
        <>
          {/* Section Header with Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-[#1A2026]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#16C7D9]/10 border border-[#16C7D9]/20 flex items-center justify-center">
                <Film className="w-5 h-5 text-[#16C7D9]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F2F4F6]">Recorrido cinematográfico</h2>
                <p className="text-xs text-[#6B7280]">
                  {movies.length}{' '}
                  {movies.length === 1 ? 'película compartida' : 'películas compartidas'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              {filterOptions.map((option) => (
                <Link
                  key={option.id}
                  href={`/grupos/${groupId}?filter=${option.id}`}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all',
                    filter === option.id
                      ? 'bg-[#16C7D9]/10 text-[#16C7D9] border border-[#16C7D9]/20'
                      : 'text-[#9AA3AD] hover:text-[#F2F4F6] hover:bg-[#14181D] border border-transparent'
                  )}
                >
                  {option.id === 'recent' && <Calendar className="w-3.5 h-3.5" />}
                  {option.id === 'top' && <TrendingUp className="w-3.5 h-3.5" />}
                  {option.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Movies Grid - Desktop/Tablet */}
          <div className="hidden sm:grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {movies.map((movie: any) => (
              <GroupMovieCard key={movie.id} movie={movie} groupId={groupId} />
            ))}
          </div>

          {/* Movies Carousel - Mobile */}
          <div className="sm:hidden -mx-4 px-4">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {movies.map((movie: any) => (
                <div key={movie.id} className="flex-shrink-0 w-[160px] snap-start">
                  <GroupMovieCard movie={movie} groupId={groupId} />
                </div>
              ))}
            </div>
          </div>

          {/* Group Status Block */}
          <GroupStatusBlock groupId={groupId} movieCount={movies.length} />
        </>
      )}
    </div>
  )
}

// Empty State Component
function EmptyMoviesState({ groupId, groupName }: { groupId: string; groupName: string }) {
  return (
    <div className="space-y-8">
      <div className="relative rounded-3xl bg-gradient-to-b from-[#13161B] to-[#111419] border border-[#1E2328]/60">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2A3038]/50 to-transparent rounded-t-3xl" />

        <div className="relative flex flex-col items-center justify-center text-center py-16 px-8">
          {/* Cinematic Icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-[#16C7D9]/10 blur-xl animate-pulse" />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#1A2026] to-[#14181D] border-2 border-[#2A3038] flex items-center justify-center">
              <div className="relative">
                <Clapperboard className="w-14 h-14 text-[#4A5568]" />
                <div className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-[#16C7D9]/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[#16C7D9]/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
            <span className="text-[#F2F4F6]">La pantalla está en blanco… </span>
            <span className="text-[#16C7D9]">por ahora.</span>
          </h2>

          {/* Description */}
          <p className="text-[#9AA3AD] text-base sm:text-lg max-w-xl leading-relaxed mb-8">
            <span className="text-[#F2F4F6] font-medium">{groupName}</span> todavía no registró
            ninguna película. Cada gran historia empieza con una primera función.
          </p>

          {/* CTA Button */}
          <Link
            href={`/grupos/${groupId}/registrar`}
            className="flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Registrar primera película
          </Link>

          {/* Decorative elements */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 mt-8 sm:mt-10 text-[#4A5568]">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="text-xs">Califiquen juntos</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-[#4A5568]" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-xs">Compartan opiniones</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-[#4A5568]" />
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4" />
              <span className="text-xs">Construyan historia</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Group Status Block Component
function GroupStatusBlock({ groupId, movieCount }: { groupId: string; movieCount: number }) {
  return (
    <div className="mt-16 rounded-2xl border-2 border-dashed border-[#2A3038]/60 py-12 px-8 sm:py-16 sm:px-12">
      <div className="flex flex-col items-center text-center gap-5">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#16C7D9]/10 border border-[#16C7D9]/20 flex items-center justify-center">
          <Clapperboard className="w-8 h-8 text-[#16C7D9]" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[#F2F4F6] uppercase italic tracking-wide">
          ¿Sin ideas?
        </h3>

        {/* Subtitle */}
        <p className="text-[#6B7280] max-w-md">
          Tu grupo ha explorado <span className="text-[#F2F4F6] font-medium">{movieCount}</span>{' '}
          {movieCount === 1 ? 'película' : 'películas'} juntos. ¡Empiecen un nuevo capítulo con una
          nueva película!
        </p>

        {/* CTA */}
        <Link
          href="/explorar"
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-xl text-sm font-semibold text-[#0B0D10] shadow-lg shadow-[#16C7D9]/20 hover:shadow-[#16C7D9]/30 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Ver sugerencias
        </Link>
      </div>
    </div>
  )
}

// Movie Card Component
function GroupMovieCard({ movie, groupId }: { movie: any; groupId: string }) {
  const movieData = movie.movie || movie
  const posterPath = movieData.poster_path

  return (
    <Link href={`/grupos/${groupId}/pelicula/${movie.movie_id}`} className="group block">
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-[#1A2026] group-hover:border-[#3A4048] transition-all duration-300 bg-[#14181D] shadow-lg group-hover:shadow-xl group-hover:shadow-black/30 group-hover:-translate-y-1">
        {posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w500${posterPath}`}
            alt={movieData.title}
            fill
            className="object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1A2026] to-[#14181D]">
            <Film className="w-12 h-12 text-[#2A3038]" />
          </div>
        )}

        {/* Gradient overlay - always visible at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Rating badge - top right */}
        {movie.average_rating > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 bg-[#D4AF37]/90 rounded-lg shadow-lg">
            <Star className="w-3 h-3 text-[#0B0D10] fill-[#0B0D10]" />
            <span className="text-xs font-bold text-[#0B0D10]">
              {movie.average_rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* User rating indicator - top left */}
        {movie.user_rating && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 bg-[#16C7D9]/90 rounded-lg shadow-lg">
            <span className="text-xs font-bold text-[#0B0D10]">
              Tu voto: {movie.user_rating.score}/10
            </span>
          </div>
        )}

        {/* Movie info - bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
          <h3 className="font-bold text-[#F2F4F6] text-sm leading-tight line-clamp-2 drop-shadow-lg">
            {movieData.title}
          </h3>
          <p className="text-xs text-[#9AA3AD] drop-shadow-md">
            {movieData.director && <span className="text-[#B0B8C1]">{movieData.director}</span>}
            {movieData.director && movieData.year && ' · '}
            {movieData.year}
          </p>
          {movie.watched_at && (
            <p className="text-[10px] text-[#6B7280] flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              {formatWatchedDate(movie.watched_at)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
