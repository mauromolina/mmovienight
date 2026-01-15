import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTable, dbInsert } from '@/lib/supabase/db'
import type { ActivityType } from '@/types'

export interface ActivityRecord {
  id: string
  group_id: string
  user_id: string
  activity_type: ActivityType
  target_movie_id: string | null
  target_user_id: string | null
  metadata: Record<string, any> | null
  created_at: string
  // Joined data
  profile: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
  group: {
    id: string
    name: string
  }
  movie?: {
    id: string
    title: string
    poster_path: string | null
    year: number | null
  } | null
}

// Record a new activity
export async function recordActivity({
  groupId,
  userId,
  activityType,
  targetMovieId,
  targetUserId,
  metadata,
}: {
  groupId: string
  userId: string
  activityType: ActivityType
  targetMovieId?: string | null
  targetUserId?: string | null
  metadata?: Record<string, any> | null
}): Promise<boolean> {
  try {
    const serviceClient = createServiceClient()

    const { error } = await dbInsert(serviceClient, 'activity_feed', {
      group_id: groupId,
      user_id: userId,
      activity_type: activityType,
      target_movie_id: targetMovieId || null,
      target_user_id: targetUserId || null,
      metadata: metadata || null,
    })

    if (error) {
      console.error('Error recording activity:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error recording activity:', error)
    return false
  }
}

// Activity filter types
export type ActivityFilter = 'all' | 'ratings' | 'watchlist' | 'comments'

// Map filter to activity types
function getActivityTypesForFilter(filter: ActivityFilter): ActivityType[] | null {
  switch (filter) {
    case 'ratings':
      return ['movie_rated', 'rating_updated']
    case 'watchlist':
      return ['watchlist_added', 'movie_added']
    case 'comments':
      return ['comment_added']
    case 'all':
    default:
      return null // No filter, return all
  }
}

// Get activities for all groups the user belongs to
export async function getUserActivities(
  limit: number = 20,
  offset: number = 0,
  filter: ActivityFilter = 'all'
): Promise<{ activities: ActivityRecord[]; hasMore: boolean }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { activities: [], hasMore: false }

  // First get user's groups
  const { data: memberships } = await getTable(supabase, 'memberships')
    .select('group_id')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) return { activities: [], hasMore: false }

  const groupIds = memberships.map((m: any) => m.group_id)
  const activityTypes = getActivityTypesForFilter(filter)

  // Build query
  let query = getTable(supabase, 'activity_feed')
    .select('*', { count: 'exact' })
    .in('group_id', groupIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)

  // Apply filter if not "all"
  if (activityTypes) {
    query = query.in('activity_type', activityTypes)
  }

  const { data: activities, error, count } = await query

  if (error || !activities) {
    console.error('Error fetching activities:', error)
    return { activities: [], hasMore: false }
  }

  // Fetch related data
  const result = await enrichActivities(activities, groupIds)
  const hasMore = count ? offset + limit < count : false

  return { activities: result, hasMore }
}

// Enrich activities with profile, group, and movie data
async function enrichActivities(activities: any[], groupIds: string[]): Promise<ActivityRecord[]> {
  if (!activities || activities.length === 0) return []

  const supabase = await createClient()

  const userIds = [...new Set(activities.map((a: any) => a.user_id))]
  const movieIds = [...new Set(activities.filter((a: any) => a.target_movie_id).map((a: any) => a.target_movie_id))]

  const [profilesRes, groupsRes, moviesRes] = await Promise.all([
    getTable(supabase, 'profiles').select('id, display_name, avatar_url').in('id', userIds),
    getTable(supabase, 'groups').select('id, name').in('id', groupIds),
    movieIds.length > 0
      ? getTable(supabase, 'movies').select('id, title, poster_path, year').in('id', movieIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]))
  const groupMap = new Map((groupsRes.data || []).map((g: any) => [g.id, g]))
  const movieMap = new Map((moviesRes.data || []).map((m: any) => [m.id, m]))

  return activities.map((a: any) => ({
    ...a,
    profile: profileMap.get(a.user_id) || { id: a.user_id, display_name: null, avatar_url: null },
    group: groupMap.get(a.group_id) || { id: a.group_id, name: 'Grupo' },
    movie: a.target_movie_id ? movieMap.get(a.target_movie_id) || null : null,
  })) as ActivityRecord[]
}


// Helper to get activity message
export function getActivityMessage(activity: ActivityRecord): string {
  const userName = activity.profile.display_name || 'Alguien'
  const movieTitle = activity.movie?.title || 'una película'
  const groupName = activity.group.name

  switch (activity.activity_type) {
    case 'group_created':
      return `${userName} creó el círculo ${groupName}`
    case 'movie_rated':
      const score = activity.metadata?.score
      return `${userName} calificó "${movieTitle}" con ${score}/10 en ${groupName}`
    case 'rating_updated':
      const newScore = activity.metadata?.score
      return `${userName} actualizó su calificación de "${movieTitle}" a ${newScore}/10 en ${groupName}`
    case 'movie_added':
      return `${userName} registró "${movieTitle}" como vista en ${groupName}`
    case 'watchlist_added':
      return `${userName} agregó "${movieTitle}" a la watchlist de ${groupName}`
    case 'comment_added':
      return `${userName} comentó en "${movieTitle}" en ${groupName}`
    case 'member_joined':
      return `${userName} se unió a ${groupName}`
    case 'member_left':
      return `${userName} dejó ${groupName}`
    default:
      return `${userName} realizó una acción en ${groupName}`
  }
}

// Helper to get activity icon color
export function getActivityColor(activityType: ActivityType): string {
  switch (activityType) {
    case 'group_created':
      return '#F59E0B' // Amber for group creation
    case 'movie_rated':
    case 'rating_updated':
      return '#D4AF37' // Gold for ratings
    case 'movie_added':
      return '#10B981' // Green for watched
    case 'watchlist_added':
      return '#16C7D9' // Cyan for watchlist
    case 'comment_added':
      return '#8B5CF6' // Purple for comments
    case 'member_joined':
      return '#3B82F6' // Blue for joins
    case 'member_left':
      return '#6B7280' // Gray for leaves
    default:
      return '#9AA3AD'
  }
}

// Get activities for a specific group
export async function getGroupActivities(
  groupId: string,
  limit: number = 20,
  offset: number = 0,
  filter: ActivityFilter = 'all'
): Promise<{ activities: ActivityRecord[]; hasMore: boolean }> {
  const supabase = await createClient()

  const activityTypes = getActivityTypesForFilter(filter)

  // Build query
  let query = getTable(supabase, 'activity_feed')
    .select('*', { count: 'exact' })
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)

  // Apply filter if not "all"
  if (activityTypes) {
    query = query.in('activity_type', activityTypes)
  }

  const { data: activities, error, count } = await query

  if (error || !activities || activities.length === 0) {
    return { activities: [], hasMore: false }
  }

  // Fetch related data separately
  const userIds = [...new Set(activities.map((a: any) => a.user_id))]
  const movieIds = [...new Set(activities.filter((a: any) => a.target_movie_id).map((a: any) => a.target_movie_id))]

  const [profilesRes, groupRes, moviesRes] = await Promise.all([
    getTable(supabase, 'profiles').select('id, display_name, avatar_url').in('id', userIds),
    getTable(supabase, 'groups').select('id, name').eq('id', groupId).single(),
    movieIds.length > 0
      ? getTable(supabase, 'movies').select('id, title, poster_path, year').in('id', movieIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]))
  const movieMap = new Map((moviesRes.data || []).map((m: any) => [m.id, m]))
  const group = groupRes.data || { id: groupId, name: 'Grupo' }

  const result = activities.map((a: any) => ({
    ...a,
    profile: profileMap.get(a.user_id) || { id: a.user_id, display_name: null, avatar_url: null },
    group: group,
    movie: a.target_movie_id ? movieMap.get(a.target_movie_id) || null : null,
  })) as ActivityRecord[]

  const hasMore = count ? offset + limit < count : false

  return { activities: result, hasMore }
}
