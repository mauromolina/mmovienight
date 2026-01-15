'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star,
  Film,
  BookmarkPlus,
  MessageCircle,
  UserPlus,
  UserMinus,
  Activity,
  Loader2,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import type { ActivityType } from '@/types'
import type { ActivityRecord, ActivityFilter } from '@/services/activity'

interface ActivityFeedProps {
  initialActivities: ActivityRecord[]
  initialHasMore: boolean
  groupId?: string // If provided, fetch group-specific activities
  showGroupName?: boolean
}

const FILTER_OPTIONS: { value: ActivityFilter; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'ratings', label: 'Calificaciones' },
  { value: 'watchlist', label: 'Watchlist' },
  { value: 'comments', label: 'Debates' },
]

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

function getActivityIcon(activityType: ActivityType) {
  switch (activityType) {
    case 'group_created':
      return Sparkles
    case 'movie_rated':
    case 'rating_updated':
      return Star
    case 'movie_added':
      return Film
    case 'watchlist_added':
      return BookmarkPlus
    case 'comment_added':
      return MessageCircle
    case 'member_joined':
      return UserPlus
    case 'member_left':
      return UserMinus
    default:
      return Activity
  }
}

function getActivityColor(activityType: ActivityType): string {
  switch (activityType) {
    case 'group_created':
      return '#F59E0B'
    case 'movie_rated':
    case 'rating_updated':
      return '#D4AF37'
    case 'movie_added':
      return '#10B981'
    case 'watchlist_added':
      return '#16C7D9'
    case 'comment_added':
      return '#8B5CF6'
    case 'member_joined':
      return '#3B82F6'
    case 'member_left':
      return '#6B7280'
    default:
      return '#9AA3AD'
  }
}

function getActivityVerb(activityType: ActivityType): string {
  switch (activityType) {
    case 'group_created':
      return 'creó el círculo'
    case 'movie_rated':
      return 'calificó'
    case 'rating_updated':
      return 'actualizó su calificación de'
    case 'movie_added':
      return 'registró como vista'
    case 'watchlist_added':
      return 'agregó a la watchlist'
    case 'comment_added':
      return 'comentó en'
    case 'member_joined':
      return 'se unió al círculo'
    case 'member_left':
      return 'dejó el círculo'
    default:
      return 'realizó una acción'
  }
}

export function ActivityFeed({
  initialActivities,
  initialHasMore,
  groupId,
  showGroupName = true,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityRecord[]>(initialActivities)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchActivities = useCallback(
    async (filter: ActivityFilter, offset: number = 0, append: boolean = false) => {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      try {
        const endpoint = groupId ? `/api/groups/${groupId}/activities` : '/api/activities'

        const res = await fetch(`${endpoint}?filter=${filter}&limit=20&offset=${offset}`)

        if (!res.ok) throw new Error('Failed to fetch')

        const data = await res.json()

        if (append) {
          setActivities((prev) => [...prev, ...data.activities])
        } else {
          setActivities(data.activities)
        }
        setHasMore(data.hasMore)
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [groupId]
  )

  const handleFilterChange = (filter: ActivityFilter) => {
    setActiveFilter(filter)
    fetchActivities(filter)
  }

  const handleLoadMore = () => {
    fetchActivities(activeFilter, activities.length, true)
  }

  return (
    <div className="space-y-6">
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFilterChange(option.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === option.value
                ? 'bg-[#16C7D9] text-[#0B0D10]'
                : 'bg-[#1A1F25] text-[#9AA3AD] hover:bg-[#252A31] hover:text-[#F2F4F6] border border-[#2A3038]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#16C7D9] animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        /* Empty State */
        <div className="relative rounded-3xl bg-gradient-to-b from-[#13161B] to-[#111419] border border-[#1E2328]/60">
          <div className="relative flex flex-col items-center justify-center text-center py-16 px-8">
            <div className="relative mb-8">
              <div className="absolute inset-0 w-32 h-32 rounded-full bg-[#16C7D9]/10 blur-xl animate-pulse" />
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#1A2026] to-[#14181D] border-2 border-[#2A3038] flex items-center justify-center">
                <Activity className="w-14 h-14 text-[#4A5568]" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
              <span className="text-[#F2F4F6]">Sin actividad </span>
              <span className="text-[#16C7D9]">todavía</span>
            </h2>

            <p className="text-[#9AA3AD] text-base sm:text-lg max-w-xl leading-relaxed">
              {activeFilter === 'all'
                ? 'Cuando haya actividad en tus círculos, vas a verla acá.'
                : `No hay actividad de tipo "${
                    FILTER_OPTIONS.find((o) => o.value === activeFilter)?.label
                  }" todavía.`}
            </p>
          </div>
        </div>
      ) : (
        /* Activity Timeline */
        <div className="relative">
          {/* Timeline Line (desktop only) */}
          <div className="hidden md:block absolute left-[5px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#16C7D9]/50 via-[#2A3038] to-transparent" />

          {/* Activity Cards */}
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const IconComponent = getActivityIcon(activity.activity_type)
              const iconColor = getActivityColor(activity.activity_type)
              const verb = getActivityVerb(activity.activity_type)
              // Para member_left, usar el nombre guardado en metadata ya que el perfil puede no ser accesible
              const userName =
                activity.activity_type === 'member_left' && activity.metadata?.user_name
                  ? activity.metadata.user_name
                  : activity.profile.display_name || 'Alguien'
              const movieTitle = activity.movie?.title
              const score = activity.metadata?.score

              return (
                <div key={activity.id} className="relative flex gap-4 md:gap-6">
                  {/* Timeline Node (desktop only) */}
                  <div className="hidden md:flex flex-col items-center justify-start pt-5">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 ring-4 ring-[#0B0D10]"
                      style={{ backgroundColor: iconColor }}
                    />
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-gradient-to-br from-[#14181D] to-[#111419] border border-[#1E2328] rounded-2xl overflow-hidden hover:border-[#2A3038] transition-all group">
                    <div className="flex">
                      {/* Movie Poster (if applicable) */}
                      {activity.movie?.poster_path && (
                        <Link
                          href={`/grupos/${activity.group_id}/pelicula/${activity.movie.id}`}
                          className="relative w-20 sm:w-24 shrink-0"
                        >
                          <Image
                            src={`https://image.tmdb.org/t/p/w200${activity.movie.poster_path}`}
                            alt={activity.movie.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#14181D]/80" />
                        </Link>
                      )}

                      {/* Content */}
                      <div className="flex-1 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          {/* User Avatar */}
                          <div className="shrink-0">
                            {activity.profile.avatar_url ? (
                              <Image
                                src={activity.profile.avatar_url}
                                alt=""
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#16C7D9] to-[#0EA5E9] flex items-center justify-center text-[#0B0D10] font-bold text-sm">
                                {userName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Text Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base text-[#F2F4F6] leading-relaxed">
                              <span className="font-semibold text-[#16C7D9]">{userName}</span>{' '}
                              {verb}
                              {movieTitle && (
                                <>
                                  {' '}
                                  <Link
                                    href={`/grupos/${activity.group_id}/pelicula/${activity.movie?.id}`}
                                    className="font-medium text-[#F2F4F6] hover:text-[#16C7D9] transition-colors"
                                  >
                                    "{movieTitle}"
                                  </Link>
                                </>
                              )}
                            </p>

                            {/* Rating Badge */}
                            {(activity.activity_type === 'movie_rated' ||
                              activity.activity_type === 'rating_updated') &&
                              score && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                                    <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                                    <span className="text-sm font-bold text-[#D4AF37]">
                                      {score}/10
                                    </span>
                                  </div>
                                </div>
                              )}

                            {/* Rating Review */}
                            {(activity.activity_type === 'movie_rated' ||
                              activity.activity_type === 'rating_updated') &&
                              (activity.metadata?.comment ? (
                                <div className="mt-3 p-3 rounded-lg bg-[#1A1F25] border-l-4 border-l-[#D4AF37]">
                                  <p className="text-sm text-[#9AA3AD] italic line-clamp-2">
                                    "{activity.metadata.comment}"
                                  </p>
                                </div>
                              ) : (
                                <p className="mt-3 text-sm text-[#6B7280] italic">
                                  No se agregó una reseña
                                </p>
                              ))}

                            {/* Comment Preview */}
                            {activity.activity_type === 'comment_added' &&
                              activity.metadata?.comment && (
                                <div className="mt-2 p-3 rounded-lg bg-[#1A1F25] border border-[#2A3038]">
                                  <p className="text-sm text-[#9AA3AD] italic line-clamp-2">
                                    "{activity.metadata.comment}"
                                  </p>
                                </div>
                              )}

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 text-xs text-[#6B7280]">
                              <span>{formatRelativeTime(activity.created_at)}</span>
                              {showGroupName && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-[#4A5568]" />
                                  <Link
                                    href={`/grupos/${activity.group_id}`}
                                    className="text-[#9AA3AD] hover:text-[#16C7D9] transition-colors"
                                  >
                                    {activity.group.name}
                                  </Link>
                                </>
                              )}
                              {activity.movie && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-[#4A5568]" />
                                  <Link
                                    href={`/grupos/${activity.group_id}/pelicula/${activity.movie.id}`}
                                    className="text-[#16C7D9] hover:text-[#3DD4E4] transition-colors"
                                  >
                                    Ver película
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Mobile Icon */}
                          <div
                            className="md:hidden shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${iconColor}15` }}
                          >
                            <IconComponent className="w-5 h-5" style={{ color: iconColor }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-6 py-3 bg-[#1A1F25] hover:bg-[#252A31] border border-[#2A3038] rounded-xl text-sm font-medium text-[#9AA3AD] hover:text-[#F2F4F6] transition-all disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Cargar actividad anterior
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
