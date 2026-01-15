import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, BookmarkPlus, Film, Star, User, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getGroupById, getUserMembership } from '@/services/groups'
import { getGroupWatchlist } from '@/services/movies'
import { RemoveFromWatchlistButton } from './remove-from-watchlist-button'
import { MovieRoulette } from './movie-roulette'

interface GroupWatchlistPageProps {
  params: Promise<{ groupId: string }>
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function GroupWatchlistPage({ params }: GroupWatchlistPageProps) {
  const { groupId } = await params

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

  // Fetch watchlist
  const watchlistMovies = await getGroupWatchlist(groupId)

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
        <Link href="/grupos" className="hover:text-[#9AA3AD] transition-colors">
          Círculos
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/grupos/${groupId}`} className="hover:text-[#9AA3AD] transition-colors">
          {group.name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-[#9AA3AD]">Watchlist</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3">
            <span className="text-[#F2F4F6]">Watchlist </span>
            <span className="text-[#16C7D9]">del grupo</span>
          </h1>
          <p className="text-[#9AA3AD] text-base lg:text-lg max-w-2xl leading-relaxed">
            {watchlistMovies.length > 0
              ? `${watchlistMovies.length} ${watchlistMovies.length === 1 ? 'película propuesta' : 'películas propuestas'} para la próxima función.`
              : 'Películas propuestas por el grupo para ver en la próxima función.'}
          </p>
        </div>

        {/* Roulette Button */}
        {watchlistMovies.length >= 2 && (
          <div className="flex-shrink-0">
            <MovieRoulette movies={watchlistMovies} groupId={groupId} />
          </div>
        )}
      </div>

      {/* Empty State */}
      {watchlistMovies.length === 0 ? (
        <div className="relative rounded-3xl bg-gradient-to-b from-[#13161B] to-[#111419] border border-[#1E2328]/60">
          <div className="relative flex flex-col items-center justify-center text-center py-16 px-8">
            <div className="relative mb-8">
              <div className="absolute inset-0 w-32 h-32 rounded-full bg-[#16C7D9]/10 blur-xl animate-pulse" />
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#1A2026] to-[#14181D] border-2 border-[#2A3038] flex items-center justify-center">
                <BookmarkPlus className="w-14 h-14 text-[#4A5568]" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
              <span className="text-[#F2F4F6]">La watchlist está </span>
              <span className="text-[#16C7D9]">vacía</span>
            </h2>

            <p className="text-[#9AA3AD] text-base sm:text-lg max-w-xl leading-relaxed mb-8">
              Todavía no hay películas propuestas para la próxima función.
              Agregá la primera película desde la página de explorar.
            </p>

            <Link
              href="/explorar"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-2xl text-base font-bold text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 transition-all"
            >
              <Film className="w-5 h-5" />
              Explorar películas
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {watchlistMovies.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-[#14181D] border border-[#1E2328] rounded-2xl hover:border-[#2A3038] transition-colors group"
            >
              {/* Mobile & Desktop Layout */}
              <div className="flex gap-4">
                {/* Poster */}
                <Link
                  href={`/pelicula/${item.movie.tmdb_id}`}
                  className="flex-shrink-0 relative w-16 sm:w-28 md:w-32 aspect-[2/3] rounded-xl overflow-hidden bg-[#1A2026]"
                >
                  {item.movie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w200${item.movie.poster_path}`}
                      alt={item.movie.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-6 h-6 sm:w-8 sm:h-8 text-[#3A4048]" />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/pelicula/${item.movie.tmdb_id}`}>
                    <h3 className="text-base sm:text-lg font-bold text-[#F2F4F6] hover:text-[#16C7D9] transition-colors line-clamp-2 sm:line-clamp-1">
                      {item.movie.title}
                    </h3>
                  </Link>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs sm:text-sm text-[#6B7280]">
                    {item.movie.year && <span>{item.movie.year}</span>}
                    {item.movie.director && (
                      <>
                        <span className="text-[#3A4048] hidden sm:inline">·</span>
                        <span className="hidden sm:inline">{item.movie.director}</span>
                      </>
                    )}
                    {item.movie.genres && item.movie.genres.length > 0 && (
                      <>
                        <span className="text-[#3A4048]">·</span>
                        <span>{item.movie.genres.slice(0, 2).join(', ')}</span>
                      </>
                    )}
                  </div>

                  {/* Reason - visible on mobile too */}
                  {item.reason && (
                    <p className="mt-2 text-xs sm:text-sm text-[#16C7D9] italic line-clamp-1">
                      &ldquo;{item.reason}&rdquo;
                    </p>
                  )}

                  {/* Overview - desktop only */}
                  {item.movie.overview && (
                    <p className="mt-2 text-sm text-[#9AA3AD] line-clamp-2 hidden md:block">
                      {item.movie.overview}
                    </p>
                  )}

                  {/* Added by - desktop inline */}
                  <div className="hidden sm:flex items-center gap-2 mt-3 text-xs text-[#6B7280]">
                    <div className="flex items-center gap-1.5">
                      {item.added_by_profile?.avatar_url ? (
                        <Image
                          src={item.added_by_profile.avatar_url}
                          alt=""
                          width={16}
                          height={16}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span>
                        Agregada por{' '}
                        <span className="text-[#9AA3AD]">
                          {item.added_by_profile?.display_name || 'Usuario'}
                        </span>
                      </span>
                    </div>
                    <span className="text-[#3A4048]">·</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>

                  {/* Desktop Actions - inline */}
                  <div className="hidden sm:flex items-center gap-2 mt-4">
                    <Link
                      href={`/grupos/${groupId}/registrar?movie=${item.movie.tmdb_id}`}
                      className="px-4 py-2 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-lg text-xs font-semibold text-[#0B0D10] transition-all"
                    >
                      Marcar como vista
                    </Link>
                    <RemoveFromWatchlistButton
                      watchlistItemId={item.id}
                      movieTitle={item.movie.title}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile: Added by + Actions stacked below */}
              <div className="sm:hidden mt-4 pt-3 border-t border-[#1E2328]">
                {/* Added by */}
                <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-3">
                  <div className="flex items-center gap-1.5">
                    {item.added_by_profile?.avatar_url ? (
                      <Image
                        src={item.added_by_profile.avatar_url}
                        alt=""
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                    <span>
                      Por{' '}
                      <span className="text-[#9AA3AD]">
                        {item.added_by_profile?.display_name || 'Usuario'}
                      </span>
                    </span>
                  </div>
                  <span className="text-[#3A4048]">·</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>

                {/* Actions - full width buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/grupos/${groupId}/registrar?movie=${item.movie.tmdb_id}`}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-xl text-xs font-semibold text-[#0B0D10] text-center transition-all"
                  >
                    Marcar como vista
                  </Link>
                  <RemoveFromWatchlistButton
                    watchlistItemId={item.id}
                    movieTitle={item.movie.title}
                    compact
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
