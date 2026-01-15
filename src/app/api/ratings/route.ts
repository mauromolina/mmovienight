import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'

// GET /api/ratings - Get user's ratings with pagination and filters
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const groupId = searchParams.get('groupId') // Filter by group
    const minScore = searchParams.get('minScore') // Filter by minimum score
    const maxScore = searchParams.get('maxScore') // Filter by maximum score
    const search = searchParams.get('search')?.trim() // Search by movie title

    // If search is provided, first find matching movie IDs
    let matchingMovieIds: string[] | null = null
    if (search && search.length >= 1) {
      const { data: movies } = await getTable(supabase, 'movies')
        .select('id')
        .ilike('title', `%${search}%`)

      matchingMovieIds = movies?.map((m: any) => m.id) || []

      // If no movies match, return empty results
      if (matchingMovieIds.length === 0) {
        // Still get user groups and stats
        const { data: memberships } = await getTable(supabase, 'memberships')
          .select('group:groups (id, name)')
          .eq('user_id', user.id)

        const userGroups = memberships?.map((m: any) => m.group).filter(Boolean) || []

        const { data: avgData } = await getTable(supabase, 'ratings')
          .select('score')
          .eq('user_id', user.id)

        const totalRatings = avgData?.length || 0
        const averageScore = totalRatings > 0 && avgData
          ? avgData.reduce((sum: number, r: any) => sum + r.score, 0) / totalRatings
          : 0

        return NextResponse.json({
          ratings: [],
          total: 0,
          hasMore: false,
          stats: { totalRatings, averageScore: Math.round(averageScore * 10) / 10 },
          userGroups,
        })
      }
    }

    // Build count query
    let countQuery = getTable(supabase, 'ratings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (groupId) {
      countQuery = countQuery.eq('group_id', groupId)
    }
    if (minScore) {
      countQuery = countQuery.gte('score', parseInt(minScore, 10))
    }
    if (maxScore) {
      countQuery = countQuery.lte('score', parseInt(maxScore, 10))
    }
    if (matchingMovieIds) {
      countQuery = countQuery.in('movie_id', matchingMovieIds)
    }

    const { count } = await countQuery

    // Build main query
    let query = getTable(supabase, 'ratings')
      .select(`
        id,
        score,
        comment,
        created_at,
        group_id,
        movie_id,
        movie:movies (
          id,
          tmdb_id,
          title,
          year,
          poster_path
        ),
        group:groups (
          id,
          name
        )
      `)
      .eq('user_id', user.id)

    // Apply filters
    if (groupId) {
      query = query.eq('group_id', groupId)
    }
    if (minScore) {
      query = query.gte('score', parseInt(minScore, 10))
    }
    if (maxScore) {
      query = query.lte('score', parseInt(maxScore, 10))
    }
    if (matchingMovieIds) {
      query = query.in('movie_id', matchingMovieIds)
    }

    // Apply ordering and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: ratings, error } = await query

    if (error) {
      console.error('Error fetching ratings:', error)
      return NextResponse.json({ error: 'Error al obtener calificaciones' }, { status: 500 })
    }

    // Get user's groups for filter dropdown
    const { data: memberships } = await getTable(supabase, 'memberships')
      .select(`
        group:groups (
          id,
          name
        )
      `)
      .eq('user_id', user.id)

    const userGroups = memberships?.map((m: any) => m.group).filter(Boolean) || []

    // Calculate average score
    const { data: avgData } = await getTable(supabase, 'ratings')
      .select('score')
      .eq('user_id', user.id)

    const totalRatings = avgData?.length || 0
    const averageScore = totalRatings > 0 && avgData
      ? avgData.reduce((sum: number, r: any) => sum + r.score, 0) / totalRatings
      : 0

    return NextResponse.json({
      ratings: ratings || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
      stats: {
        totalRatings,
        averageScore: Math.round(averageScore * 10) / 10,
      },
      userGroups,
    })
  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
