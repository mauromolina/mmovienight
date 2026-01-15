import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTable, dbSelect } from '@/lib/supabase/db'
import type { Group, GroupWithMembership, Profile, InviteCode } from '@/types'

// Asegura que el perfil del usuario exista (para usuarios registrados antes del trigger)
async function ensureProfileExists(userId: string, email: string): Promise<boolean> {
  const serviceClient = createServiceClient()

  // Verificar si el perfil existe
  const { data: existingProfile } = await getTable(serviceClient, 'profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (existingProfile) return true

  // Crear el perfil si no existe
  const { error } = await getTable(serviceClient, 'profiles').insert({
    id: userId,
    email: email,
    display_name: email.split('@')[0],
  })

  if (error) {
    console.error('Error creating profile:', error)
    return false
  }

  return true
}

interface MembershipWithGroup {
  role: string
  group: Group
}

interface MembershipWithProfile {
  role: string
  profile: Profile
}

export async function getUserGroups(): Promise<GroupWithMembership[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: membershipsData, error } = await getTable(supabase, 'memberships')
    .select(`
      role,
      group:groups (
        id,
        name,
        description,
        image_url,
        owner_id,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const memberships = membershipsData as MembershipWithGroup[] | null

  if (error || !memberships) return []

  // Obtener datos completos para cada grupo
  const groups: GroupWithMembership[] = await Promise.all(
    memberships.map(async (m) => {
      const group = m.group

      // Obtener conteo de miembros y algunos avatares
      const { data: membersData, count } = await getTable(supabase, 'memberships')
        .select(`
          profile:profiles (
            id,
            display_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('group_id', group.id)
        .limit(5)

      const memberAvatars = (membersData || []).map((md: any) => ({
        id: md.profile.id,
        display_name: md.profile.display_name,
        avatar_url: md.profile.avatar_url,
      }))

      // Obtener última película vista con su rating promedio
      const { data: lastMovieData } = await getTable(supabase, 'group_movies')
        .select(`
          id,
          movie_id,
          watched_at,
          created_at,
          movie:movies (
            id,
            title,
            poster_path,
            backdrop_path
          )
        `)
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let lastMovie = null
      let lastMovieRating = null

      if (lastMovieData?.movie) {
        const movieRaw = lastMovieData.movie as unknown
        const movieData = (Array.isArray(movieRaw) ? movieRaw[0] : movieRaw) as {
          id: string
          title: string
          poster_path: string | null
          backdrop_path: string | null
        }

        // Obtener rating promedio de la última película
        const { data: ratingsData } = await getTable(supabase, 'ratings')
          .select('score')
          .eq('group_id', group.id)
          .eq('movie_id', lastMovieData.movie_id)

        if (ratingsData && ratingsData.length > 0) {
          const scores = ratingsData.map((r: any) => r.score)
          lastMovieRating = Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10
        }

        lastMovie = {
          ...movieData,
          watched_at: lastMovieData.watched_at,
          average_rating: lastMovieRating,
        }
      }

      // Obtener última actividad (último rating en el grupo)
      const { data: lastActivityData } = await getTable(supabase, 'ratings')
        .select('created_at')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const lastActivity = lastActivityData?.created_at || lastMovie?.watched_at || group.created_at

      return {
        ...group,
        membership: {
          id: '',
          group_id: group.id,
          user_id: user.id,
          role: m.role as 'owner' | 'member',
          created_at: '',
        },
        member_count: count || 0,
        member_avatars: memberAvatars,
        last_movie: lastMovie,
        last_activity: lastActivity,
      }
    })
  )

  return groups
}

export async function getGroupById(groupId: string): Promise<Group | null> {
  const supabase = await createClient()

  const { data, error } = await getTable(supabase, 'groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (error) return null
  return data as Group
}

export async function getGroupMembers(groupId: string): Promise<(Profile & { role: string })[]> {
  const supabase = await createClient()

  const { data, error } = await getTable(supabase, 'memberships')
    .select(`
      role,
      profile:profiles (*)
    `)
    .eq('group_id', groupId)
    .order('role', { ascending: true })

  const memberships = data as MembershipWithProfile[] | null

  if (error || !memberships) return []

  return memberships.map((m) => ({
    ...m.profile,
    role: m.role,
  }))
}

export async function isUserMemberOfGroup(groupId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: memberships } = await dbSelect(supabase, 'memberships', 'id', {
    group_id: groupId,
    user_id: userId,
  })

  return !!memberships?.[0]
}

export async function getUserMembership(
  groupId: string,
  userId: string
): Promise<{ id: string; role: 'owner' | 'member'; group_id: string; user_id: string } | null> {
  const supabase = await createClient()

  const { data: memberships } = await dbSelect(supabase, 'memberships', '*', {
    group_id: groupId,
    user_id: userId,
  })
  const membership = memberships?.[0] as { id: string; role: 'owner' | 'member'; group_id: string; user_id: string } | undefined

  if (!membership) return null
  return membership
}

// ============================================================================
// CREAR GRUPO
// ============================================================================

interface CreateGroupData {
  name: string
  description?: string
  image_url?: string
}

interface CreateGroupResult {
  success: boolean
  group?: Group
  inviteCode?: string
  error?: string
}

export async function createGroup(
  data: CreateGroupData,
  user?: { id: string; email: string }
): Promise<CreateGroupResult> {
  // Si se proporciona user, usamos service client (auth ya validada en API route)
  // De lo contrario, usamos cliente normal con cookies
  let ownerId: string
  let ownerEmail: string

  if (!user) {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser || !authUser.email) {
      return { success: false, error: 'No autenticado' }
    }
    ownerId = authUser.id
    ownerEmail = authUser.email
  } else {
    ownerId = user.id
    ownerEmail = user.email
  }

  // Asegurar que el perfil del usuario exista
  const profileExists = await ensureProfileExists(ownerId, ownerEmail)
  if (!profileExists) {
    return { success: false, error: 'Error al crear el perfil de usuario' }
  }

  // Usar service client para bypass de RLS (ya validamos auth arriba o en API route)
  const serviceClient = createServiceClient()

  // Crear el grupo
  const { data: group, error: groupError } = await getTable(serviceClient, 'groups')
    .insert({
      name: data.name,
      description: data.description || null,
      image_url: data.image_url || null,
      owner_id: ownerId,
    })
    .select()
    .single()

  if (groupError || !group) {
    console.error('Error creating group:', groupError)
    return { success: false, error: 'Error al crear el grupo' }
  }

  // Generar código de invitación inicial
  const inviteCode = await generateInviteCode(group.id, ownerId)

  return {
    success: true,
    group: group as Group,
    inviteCode: inviteCode || undefined,
  }
}

// ============================================================================
// CÓDIGOS DE INVITACIÓN
// ============================================================================

function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function generateInviteCode(
  groupId: string,
  userId: string,
  options?: { maxUses?: number; expiresInDays?: number }
): Promise<string | null> {
  // Usar service client para bypass de RLS
  const serviceClient = createServiceClient()

  // Generar código único
  let code = generateRandomCode()
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const { data: existing } = await getTable(serviceClient, 'invite_codes')
      .select('id')
      .eq('code', code)
      .single()

    if (!existing) break
    code = generateRandomCode()
    attempts++
  }

  if (attempts >= maxAttempts) {
    console.error('Could not generate unique invite code')
    return null
  }

  // Calcular fecha de expiración si se especifica
  let expiresAt: string | null = null
  if (options?.expiresInDays) {
    const expDate = new Date()
    expDate.setDate(expDate.getDate() + options.expiresInDays)
    expiresAt = expDate.toISOString()
  }

  // Crear el código
  const { error } = await getTable(serviceClient, 'invite_codes').insert({
    group_id: groupId,
    code,
    created_by: userId,
    max_uses: options?.maxUses || null,
    expires_at: expiresAt,
  })

  if (error) {
    console.error('Error creating invite code:', error)
    return null
  }

  return code
}

export async function getGroupInviteCodes(groupId: string): Promise<InviteCode[]> {
  const supabase = await createClient()

  const { data, error } = await getTable(supabase, 'invite_codes')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as InviteCode[]
}

// ============================================================================
// UNIRSE CON CÓDIGO
// ============================================================================

interface JoinGroupResult {
  success: boolean
  groupId?: string
  groupName?: string
  alreadyMember?: boolean
  error?: string
}

// ============================================================================
// ACTIVIDAD RECIENTE
// ============================================================================

export interface RecentActivity {
  id: string
  type: 'rating' | 'comment'
  created_at: string
  user: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
  group: {
    id: string
    name: string
  }
  movie: {
    id: string
    title: string
    poster_path: string | null
  }
  rating?: {
    score: number
    comment: string | null
  }
}

export async function getRecentActivityForUser(limit: number = 10): Promise<RecentActivity[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  // Primero obtener los grupos del usuario
  const { data: membershipsData } = await getTable(supabase, 'memberships')
    .select('group_id')
    .eq('user_id', user.id)

  if (!membershipsData || membershipsData.length === 0) return []

  const groupIds = membershipsData.map((m: any) => m.group_id)

  // Obtener ratings recientes de esos grupos (excluyendo los del usuario actual)
  const { data: ratingsData, error } = await getTable(supabase, 'ratings')
    .select(`
      id,
      score,
      comment,
      created_at,
      user_id,
      profile:profiles (
        id,
        display_name,
        avatar_url
      ),
      group:groups (
        id,
        name
      ),
      movie:movies (
        id,
        title,
        poster_path
      )
    `)
    .in('group_id', groupIds)
    .neq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !ratingsData) return []

  return ratingsData.map((r: any) => ({
    id: r.id,
    type: 'rating' as const,
    created_at: r.created_at,
    user: {
      id: r.profile.id,
      display_name: r.profile.display_name,
      avatar_url: r.profile.avatar_url,
    },
    group: r.group,
    movie: r.movie,
    rating: {
      score: r.score,
      comment: r.comment,
    },
  }))
}

export async function joinGroupWithCode(code: string): Promise<JoinGroupResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  // Usar la función de la base de datos
  const { data, error } = await (supabase.rpc as any)('use_invite_code', {
    p_code: code.toUpperCase(),
    p_user_id: user.id,
  })

  if (error) {
    console.error('Error using invite code:', error)
    return { success: false, error: 'Error al procesar el código' }
  }

  const result = data?.[0]

  if (!result) {
    return { success: false, error: 'El código no es válido o ya expiró' }
  }

  if (!result.success) {
    return { success: false, error: result.error_message || 'El código no es válido' }
  }

  if (result.error_message === 'already_member') {
    return {
      success: true,
      alreadyMember: true,
      groupId: result.group_id,
      groupName: result.group_name,
    }
  }

  return {
    success: true,
    groupId: result.group_id,
    groupName: result.group_name,
  }
}
