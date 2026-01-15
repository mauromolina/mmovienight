import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'

// GET /api/watchlist/check?tmdbId=xxx - Check which groups have this movie in watchlist
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tmdbId = searchParams.get('tmdbId')

  if (!tmdbId) {
    return NextResponse.json({ error: 'tmdbId es requerido' }, { status: 400 })
  }

  try {
    // First, get the movie by tmdb_id
    const { data: movie } = await getTable(supabase, 'movies')
      .select('id')
      .eq('tmdb_id', parseInt(tmdbId, 10))
      .single()

    if (!movie) {
      // Movie doesn't exist in our database, so it can't be in any watchlist
      return NextResponse.json({ groupIds: [] })
    }

    // Get user's groups
    const { data: memberships } = await getTable(supabase, 'memberships')
      .select('group_id')
      .eq('user_id', user.id)

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ groupIds: [] })
    }

    const userGroupIds = memberships.map((m: any) => m.group_id)

    // Check which of the user's groups have this movie in watchlist
    const { data: watchlistItems } = await getTable(supabase, 'watchlist_items')
      .select('group_id')
      .eq('movie_id', movie.id)
      .in('group_id', userGroupIds)

    const groupIds = watchlistItems?.map((w: any) => w.group_id) || []

    return NextResponse.json({ groupIds })
  } catch (error) {
    console.error('Error checking watchlist:', error)
    return NextResponse.json({ groupIds: [] })
  }
}
