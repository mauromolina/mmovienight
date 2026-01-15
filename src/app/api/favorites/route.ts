import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTable, dbInsert } from '@/lib/supabase/db'
import { getOrCreateMovie } from '@/services/movies'

// GET /api/favorites - Get user's favorite movies with pagination and sorting
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
    const sortBy = searchParams.get('sortBy') || 'recent' // recent, year, title

    // First get total count
    const { count } = await getTable(supabase, 'favorite_movies')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Build query
    let query = getTable(supabase, 'favorite_movies')
      .select(`
        id,
        created_at,
        movie:movies (
          id,
          tmdb_id,
          title,
          year,
          poster_path,
          backdrop_path,
          director,
          genres
        )
      `)
      .eq('user_id', user.id)

    // Apply sorting
    if (sortBy === 'year') {
      query = query.order('movie(year)', { ascending: false })
    } else if (sortBy === 'title') {
      query = query.order('movie(title)', { ascending: true })
    } else {
      // Default: recently added
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: favorites, error } = await query

    if (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json({ error: 'Error al obtener favoritos' }, { status: 500 })
    }

    return NextResponse.json({
      favorites: favorites || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}

// POST /api/favorites - Add movie to favorites
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { tmdbId } = body

    if (!tmdbId) {
      return NextResponse.json({ error: 'tmdbId es requerido' }, { status: 400 })
    }

    // Get or create the movie in our database
    const movie = await getOrCreateMovie(tmdbId)
    if (!movie) {
      return NextResponse.json({ error: 'Error al obtener la película' }, { status: 500 })
    }

    const serviceClient = createServiceClient()

    // Check if already favorited
    const { data: existing } = await getTable(serviceClient, 'favorite_movies')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', movie.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'La película ya está en favoritos' }, { status: 400 })
    }

    // Add to favorites
    const { error } = await dbInsert(serviceClient, 'favorite_movies', {
      user_id: user.id,
      movie_id: movie.id,
    })

    if (error) {
      console.error('Error adding favorite:', error)
      return NextResponse.json({ error: 'Error al agregar a favoritos' }, { status: 500 })
    }

    return NextResponse.json({ success: true, movieId: movie.id })
  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}

// DELETE /api/favorites - Remove movie from favorites
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')

    if (!movieId) {
      return NextResponse.json({ error: 'movieId es requerido' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { error } = await getTable(serviceClient, 'favorite_movies')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', movieId)

    if (error) {
      console.error('Error removing favorite:', error)
      return NextResponse.json({ error: 'Error al quitar de favoritos' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
