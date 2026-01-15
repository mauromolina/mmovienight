import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Film } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getGroupById, getUserMembership, getGroupMembers } from '@/services/groups'
import { getMovieWithRatings } from '@/services/movies'
import { getTMDbClient } from '@/lib/tmdb'
import GroupMovieDetailClient from './group-movie-detail-client'

interface GroupMovieDetailPageProps {
  params: Promise<{ groupId: string; movieId: string }>
}

export default async function GroupMovieDetailPage({ params }: GroupMovieDetailPageProps) {
  const { groupId, movieId } = await params

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

  // Obtener datos de la película con ratings y miembros del grupo
  const [movie, members] = await Promise.all([
    getMovieWithRatings(groupId, movieId),
    getGroupMembers(groupId),
  ])

  // Si la película no existe en el grupo
  if (!movie) {
    return (
      <div className="animate-fade-in pb-12 relative">
        {/* Back link */}
        <Link
          href={`/grupos/${groupId}`}
          className="relative z-10 inline-flex items-center gap-2 text-sm text-[#16C7D9] hover:text-[#3DD4E4] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al grupo {group.name}
        </Link>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center text-center py-16 px-8 rounded-3xl bg-gradient-to-b from-[#13161B] to-[#111419] border border-[#1E2328]/60">
          <div className="relative mb-8">
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-[#16C7D9]/10 blur-xl animate-pulse" />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#1A2026] to-[#14181D] border-2 border-[#2A3038] flex items-center justify-center">
              <Film className="w-14 h-14 text-[#4A5568]" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
            <span className="text-[#F2F4F6]">Película no </span>
            <span className="text-[#16C7D9]">encontrada</span>
          </h2>

          <p className="text-[#9AA3AD] text-base sm:text-lg max-w-xl leading-relaxed mb-8">
            Esta película aún no ha sido registrada en el grupo o no existe en nuestros registros.
          </p>

          <Link
            href={`/grupos/${groupId}`}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-2xl text-base font-bold text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al grupo
          </Link>
        </div>
      </div>
    )
  }

  // Obtener datos adicionales de TMDB (elenco, tagline)
  let tmdbData = null
  if (movie.tmdb_id) {
    try {
      const tmdb = getTMDbClient()
      tmdbData = await tmdb.getMovieDetails(movie.tmdb_id)
    } catch (error) {
      console.error('Error fetching TMDB data:', error)
    }
  }

  // Renderizar la página con los datos de la película
  return (
    <GroupMovieDetailClient
      movie={movie}
      group={group}
      userId={user.id}
      memberCount={members.length}
      tmdbData={tmdbData ? {
        tagline: tmdbData.tagline || null,
        cast: tmdbData.credits?.cast?.slice(0, 10).map(c => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile_path: c.profile_path,
        })) || [],
        voteAverage: tmdbData.vote_average,
        voteCount: tmdbData.vote_count,
      } : null}
    />
  )
}
