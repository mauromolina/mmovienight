import Link from 'next/link'
import Image from 'next/image'
import { Plus, Users, Clapperboard, Ticket, Film, Star, MessageCircle, User } from 'lucide-react'
import { getUserGroups, getRecentActivityForUser } from '@/services/groups'
import { CreateGroupDialog } from './create-group-dialog'
import { formatRelativeDate } from '@/lib/utils'
import JoinWithCodeButton from '@/components/groups/join-with-code-button'

export default async function GroupsPage() {
  const [groups, recentActivity] = await Promise.all([getUserGroups(), getRecentActivityForUser(8)])

  // Show empty state when user has no groups
  if (groups.length === 0) {
    return <EmptyGroupsState />
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3">
            <span className="text-[#F2F4F6]">Tus </span>
            <span className="text-[#16C7D9]">Círculos</span>
          </h1>
          <p className="text-[#9AA3AD] text-base lg:text-lg max-w-2xl leading-relaxed">
            Espacios colaborativos para ver, puntuar y debatir pelis con tu grupo. Seguí el
            recorrido cinematográfico de cada círculo.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <JoinWithCodeButton />
          <CreateGroupDialog />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
        <NewGroupCard />
      </div>

      {/* Recent Activity / Debates Section */}
      {recentActivity.length > 0 && <RecentActivitySection activities={recentActivity} />}
    </div>
  )
}

// Group Card Component
function GroupCard({ group }: { group: any }) {
  const lastMovie = group.last_movie
  const hasMovieImage = lastMovie?.backdrop_path || lastMovie?.poster_path
  const memberAvatars = group.member_avatars || []
  const extraMembers = Math.max(0, (group.member_count || 0) - memberAvatars.length)

  // Determine if movie deserves a badge
  const getBadge = () => {
    if (!lastMovie?.average_rating) return null
    if (lastMovie.average_rating >= 9) return { text: 'Obra maestra', color: 'bg-[#D4AF37]' }
    if (lastMovie.average_rating >= 8) return { text: 'Destacada', color: 'bg-[#D4AF37]' }
    return null
  }
  const badge = getBadge()

  return (
    <div className="group relative bg-[#181C21] rounded-2xl shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Movie Image Header */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl">
        {hasMovieImage ? (
          <>
            <Image
              src={`https://image.tmdb.org/t/p/w780${lastMovie.backdrop_path || lastMovie.poster_path}`}
              alt={lastMovie.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </>
        ) : group.image_url ? (
          <>
            <Image
              src={group.image_url}
              alt={group.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A2026] to-[#14181D] flex items-center justify-center">
            <Film className="w-16 h-16 text-[#2A3038]" />
          </div>
        )}

        {/* Badge - Obra maestra / Destacada */}
        {badge && (
          <div className={`absolute top-3 left-3 h-5 px-2.5 flex items-center ${badge.color} rounded-lg shadow-lg`}>
            <span className="text-[10px] font-bold text-[#0B0D10] uppercase tracking-wide leading-none">
              {badge.text}
            </span>
          </div>
        )}

        {/* Last Movie Info Overlay */}
        {lastMovie && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Última vista</p>
            <h4 className="text-base font-semibold text-white line-clamp-1 drop-shadow-lg">
              {lastMovie.title}
            </h4>
          </div>
        )}

        {/* No movies placeholder text */}
        {!lastMovie && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <p className="text-xs text-[#4A5568]">Sin películas registradas</p>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Group Name */}
        <h3 className="text-lg font-bold text-[#F2F4F6] mb-2 line-clamp-1">{group.name}</h3>

        {/* Secondary Info */}
        <div className="flex items-center gap-3 text-xs text-[#6B7280] mb-4">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {group.member_count || 1} {group.member_count === 1 ? 'cinéfilo' : 'cinéfilos'}
          </span>
          <span className="w-1 h-1 rounded-full bg-[#4A5568]" />
          <span>Activo {formatRelativeDate(group.last_activity || group.created_at)}</span>
        </div>

        {/* Member Avatars */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center -space-x-2">
            {memberAvatars.slice(0, 4).map((member: any, index: number) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full border-2 border-[#181C21] overflow-hidden bg-[#1A2026]"
                style={{ zIndex: 10 - index }}
              >
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={member.display_name || ''}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#16C7D9]">
                    {(member.display_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {extraMembers > 0 && (
              <div className="w-8 h-8 rounded-full border-2 border-[#181C21] bg-[#14181D] flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#6B7280]">+{extraMembers}</span>
              </div>
            )}
          </div>

          {/* Admin badge */}
          {group.membership?.role === 'owner' && (
            <span className="px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full text-[10px] font-medium">
              Admin
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mt-auto">
          <Link
            href={`/grupos/${group.id}/actividad`}
            className="flex-1 flex items-center justify-center py-2.5 px-4 bg-[#14181D] hover:bg-[#1A2026] border border-[#2A3038] hover:border-[#3A4048] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all"
          >
            Ver actividad
          </Link>
          <Link
            href={`/grupos/${group.id}`}
            className="flex-1 flex items-center justify-center py-2.5 px-4 bg-[#16C7D9] hover:bg-[#14B8C9] rounded-xl text-sm font-semibold text-[#0B0D10] transition-all shadow-lg shadow-[#16C7D9]/20 hover:shadow-[#16C7D9]/30"
          >
            Entrar al grupo
          </Link>
        </div>
      </div>
    </div>
  )
}

// New Group Card
function NewGroupCard() {
  return (
    <div className="group h-full">
      <div className="relative bg-[#14181D]/50 rounded-2xl border-2 border-dashed border-[#2A3038] hover:border-[#16C7D9]/50 transition-all h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#1A1E24] to-[#13161B] border border-[#2A3038]/60 flex items-center justify-center mb-4 group-hover:border-[#16C7D9]/40 transition-all shadow-inner cursor-pointer">
          <Plus className="w-8 h-8 text-[#16C7D9]" />
        </div>
        <h3 className="text-lg font-bold text-[#F2F4F6] mb-2 group-hover:text-[#16C7D9] transition-colors">
          Nuevo círculo
        </h3>
        <p className="text-sm text-[#9AA3AD] max-w-[200px] mb-4">
          Creá un nuevo círculo privado e invitá a tus amigos
        </p>
        <CreateGroupDialog variant="empty-state" />
      </div>
    </div>
  )
}

// Recent Activity Section
function RecentActivitySection({ activities }: { activities: any[] }) {
  return (
    <section className="mt-12 pt-10 border-t border-[#1A2026]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">
            <span className="text-[#F2F4F6]">Debates </span>
            <span className="text-[#16C7D9]">Recientes</span>
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">Actividad reciente en tus círculos</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </section>
  )
}

// Activity Card Component
function ActivityCard({ activity }: { activity: any }) {
  return (
    <Link
      href={`/grupos/${activity.group.id}/pelicula/${activity.movie.id}`}
      className="group block p-4 rounded-2xl bg-[#14181D] border border-[#1A2026] hover:border-[#2A3038] transition-all hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex gap-3">
        {/* Movie Poster */}
        <div className="relative w-12 h-18 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0 bg-[#1A2026]">
          {activity.movie.poster_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w200${activity.movie.poster_path}`}
              alt={activity.movie.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-5 h-5 text-[#4A5568]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* User info */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-full bg-[#1A2026] overflow-hidden flex-shrink-0">
              {activity.user.avatar_url ? (
                <Image
                  src={activity.user.avatar_url}
                  alt={activity.user.display_name || ''}
                  width={20}
                  height={20}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-3 h-3 text-[#4A5568]" />
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-[#9AA3AD] truncate">
              {activity.user.display_name || 'Usuario'}
            </span>
          </div>

          {/* Movie title */}
          <h4 className="text-sm font-semibold text-[#F2F4F6] group-hover:text-[#16C7D9] transition-colors line-clamp-1 mb-1">
            {activity.movie.title}
          </h4>

          {/* Rating */}
          {activity.rating && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= Math.round(activity.rating.score / 2)
                        ? 'text-[#D4AF37] fill-[#D4AF37]'
                        : 'text-[#3A4048]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-[#D4AF37]">{activity.rating.score}</span>
            </div>
          )}

          {/* Comment preview */}
          {activity.rating?.comment && (
            <p className="text-[11px] text-[#6B7280] line-clamp-2 italic">
              &ldquo;{activity.rating.comment}&rdquo;
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1E2328]/60">
            <span className="text-[10px] text-[#4A5568]">{activity.group.name}</span>
            <span className="text-[10px] text-[#4A5568]">
              {formatRelativeDate(activity.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Empty State - Premium Cinema Welcome
function EmptyGroupsState() {
  return (
    <div className="animate-fade-in min-h-[calc(100vh-4rem)] -mt-8 -mb-24 pt-8 pb-24 flex flex-col items-center justify-center relative">
      {/* Full-bleed background container */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2831')`,
            filter: 'blur(20px) brightness(0.25) saturate(0.8)',
            transform: 'scale(1.15)',
          }}
        />
        <div className="absolute inset-0 bg-[#0B0D10]/70" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 0%, rgba(11, 13, 16, 0.4) 50%, rgba(11, 13, 16, 0.85) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D10]/60 via-transparent to-[#0B0D10]/80" />
        <div className="absolute inset-0 bg-[#0B0D10]/30 sm:bg-transparent sm:hidden" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4">
        {/* Badge */}
        <div className="mb-8">
          <span className="px-4 py-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase bg-[#12151A] text-[#D4AF37] rounded-full border border-[#D4AF37]/30 shadow-lg shadow-black/20">
            Bienvenido al estreno
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight text-center mb-6 max-w-3xl">
          <span className="text-[#F2F4F6]">Tu </span>
          <span className="text-[#16C7D9]">círculo de cine</span>
          <span className="text-[#F2F4F6]"> te está esperando</span>
        </h1>

        {/* Subtitle */}
        <p className="text-[#9AA3AD] text-base sm:text-lg text-center max-w-xl mb-12 leading-relaxed">
          Creá un espacio privado para ver pelis con amigos, calificarlas y debatir después de los
          créditos.
        </p>

        {/* Action Cards */}
        <div className="grid gap-6 sm:grid-cols-2 w-full max-w-3xl mb-10">
          {/* Card 1 - Create Group */}
          <div className="group relative bg-[#12151A] rounded-3xl border border-[#1E2328] p-8 hover:border-[#16C7D9]/40 transition-all duration-300 hover:shadow-2xl hover:shadow-[#16C7D9]/10 flex flex-col">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#1A1F25]/50 to-transparent pointer-events-none" />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#16C7D9]/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative flex flex-col flex-1">
              <div className="w-16 h-16 rounded-2xl bg-[#16C7D9]/10 border border-[#16C7D9]/20 flex items-center justify-center mb-6 group-hover:bg-[#16C7D9]/15 group-hover:border-[#16C7D9]/30 transition-all duration-300">
                <Clapperboard className="w-8 h-8 text-[#16C7D9]" />
              </div>
              <h3 className="text-xl font-bold text-[#F2F4F6] mb-3">Crear un nuevo círculo</h3>
              <p className="text-[#8A929B] text-sm leading-relaxed flex-1">
                Armá un círculo privado para vos y tus amigos, organizá noches de cine y llevá el
                registro de sus opiniones.
              </p>
              <div className="mt-6 pt-2">
                <CreateGroupDialog variant="empty-state" />
              </div>
            </div>
          </div>

          {/* Card 2 - Join Group */}
          <div className="group relative bg-[#12151A] rounded-3xl border border-[#1E2328] p-8 hover:border-[#D4AF37]/40 transition-all duration-300 hover:shadow-2xl hover:shadow-[#D4AF37]/10 flex flex-col">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#1A1F25]/50 to-transparent pointer-events-none" />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#D4AF37]/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative flex flex-col flex-1">
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-6 group-hover:bg-[#D4AF37]/15 group-hover:border-[#D4AF37]/30 transition-all duration-300">
                <Ticket className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-[#F2F4F6] mb-3">Unirse con código</h3>
              <p className="text-[#8A929B] text-sm leading-relaxed flex-1">
                ¿Te invitaron a un grupo? Ingresá el código y sumate al círculo al instante.
              </p>
              <div className="mt-6 pt-2">
                <JoinWithCodeButton variant="empty-state" />
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-[#4A5568] text-xs text-center max-w-md">
          Los grupos son privados. Solo las personas que invites pueden ver y participar.
        </p>
      </div>
    </div>
  )
}
