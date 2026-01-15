import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { BookmarkPlus, Users, Film } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserGroups } from '@/services/groups'

export default async function WatchlistPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's groups to show their watchlists
  const groups = await getUserGroups()

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3">
          <span className="text-[#F2F4F6]">Tus </span>
          <span className="text-[#16C7D9]">Watchlists</span>
        </h1>
        <p className="text-[#9AA3AD] text-base lg:text-lg max-w-2xl leading-relaxed">
          Explorá las películas pendientes de cada uno de tus círculos de cine.
        </p>
      </div>

      {/* Empty State - No groups */}
      {groups.length === 0 ? (
        <div className="relative rounded-3xl bg-gradient-to-b from-[#13161B] to-[#111419] border border-[#1E2328]/60">
          <div className="relative flex flex-col items-center justify-center text-center py-16 px-8">
            <div className="relative mb-8">
              <div className="absolute inset-0 w-32 h-32 rounded-full bg-[#16C7D9]/10 blur-xl animate-pulse" />
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#1A2026] to-[#14181D] border-2 border-[#2A3038] flex items-center justify-center">
                <BookmarkPlus className="w-14 h-14 text-[#4A5568]" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
              <span className="text-[#F2F4F6]">Sin watchlists </span>
              <span className="text-[#16C7D9]">todavía</span>
            </h2>

            <p className="text-[#9AA3AD] text-base sm:text-lg max-w-xl leading-relaxed mb-8">
              Unite a un círculo o creá uno nuevo para empezar a agregar películas
              a la watchlist grupal.
            </p>

            <Link
              href="/grupos"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#16C7D9] to-[#0EA5E9] hover:from-[#14B8C9] hover:to-[#0D96D9] rounded-2xl text-base font-bold text-[#0B0D10] shadow-lg shadow-[#16C7D9]/25 hover:shadow-[#16C7D9]/40 transition-all"
            >
              <Users className="w-5 h-5" />
              Ver mis círculos
            </Link>
          </div>
        </div>
      ) : (
        /* Group Watchlists Grid */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/grupos/${group.id}/watchlist`}
              className="group"
            >
              <div className="relative bg-gradient-to-b from-[#14181D] to-[#12151A] rounded-3xl border border-[#1A2026] hover:border-[#16C7D9]/30 transition-all hover:shadow-xl hover:shadow-[#16C7D9]/5 overflow-hidden">
                {/* Header */}
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[#16C7D9]/20 to-[#0EA5E9]/10">
                  {group.image_url ? (
                    <Image
                      src={group.image_url}
                      alt={group.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film className="w-16 h-16 text-[#16C7D9]/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14181D] via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#F2F4F6] mb-2 group-hover:text-[#16C7D9] transition-colors">
                    {group.name}
                  </h3>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-[#6B7280] mb-4">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {group.member_count || 1} {(group.member_count || 1) === 1 ? 'miembro' : 'miembros'}
                    </span>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-1 text-sm font-medium text-[#16C7D9] group-hover:gap-2 transition-all">
                    Ver watchlist
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
