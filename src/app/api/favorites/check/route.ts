import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTable } from '@/lib/supabase/db'

// GET /api/favorites/check?movieId=xxx or ?tmdbId=xxx - Check if movie is favorited
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const movieId = searchParams.get('movieId')
  const tmdbId = searchParams.get('tmdbId')

  if (!movieId && !tmdbId) {
    return NextResponse.json({ error: 'movieId o tmdbId es requerido' }, { status: 400 })
  }

  try {
    let internalMovieId = movieId

    // If we have tmdbId but not movieId, look up the movie first
    if (!internalMovieId && tmdbId) {
      const { data: movie } = await getTable(supabase, 'movies')
        .select('id')
        .eq('tmdb_id', parseInt(tmdbId, 10))
        .single()

      if (!movie) {
        // Movie doesn't exist, so it can't be favorited
        return NextResponse.json({ isFavorite: false })
      }
      internalMovieId = movie.id
    }

    const { data: favorite } = await getTable(supabase, 'favorite_movies')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', internalMovieId)
      .single()

    return NextResponse.json({
      isFavorite: !!favorite,
      movieId: internalMovieId
    })
  } catch (error) {
    return NextResponse.json({ isFavorite: false })
  }
}
